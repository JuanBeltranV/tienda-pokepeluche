package cl.pokepeluche;

import cl.pokepeluche.repository.ContactRepository;
import cl.pokepeluche.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.seed-demo=false", "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
class SecurityIntegrationTest {
    static final Path DATABASE;
    static {
        try { DATABASE = Files.createTempFile("pokepeluche-security-", ".db"); DATABASE.toFile().deleteOnExit(); }
        catch (Exception exception) { throw new ExceptionInInitializerError(exception); }
    }
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DATABASE.toAbsolutePath());
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ProductRepository products;
    @Autowired ContactRepository contacts;
    // Only remote decoding is mocked. Real Bearer filter, converter, RBAC, CORS and SQLite stay active.
    @MockitoBean JwtDecoder decoder;
    static final Map<String, Object> PRODUCT = Map.of("name", "Peluche QA", "description", "Prueba de seguridad",
            "price", 19990, "stock", 3, "imageUrl", "/images/plush-sage.svg", "pokemonId", 133, "pokemonName", "eevee");
    static final Map<String, String> CONTACT = Map.of("name", "QA", "email", "qa@example.com", "subject", "Prueba", "message", "Mensaje de prueba");

    @BeforeEach void setup() {
        contacts.deleteAll(); products.deleteAll();
        for (String role : List.of("ADMIN", "EDITOR", "USER")) {
            when(decoder.decode(role + "-fixture")).thenReturn(jwt(List.of(role)));
        }
    }
    Jwt jwt(Object groups) {
        var builder = Jwt.withTokenValue("test-only").header("alg", "RS256").subject("test-user")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(300))
                .claim("token_use", "access").claim("client_id", "test-client");
        if (groups != null) builder.claim("cognito:groups", groups);
        return builder.build();
    }
    MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String role) {
        return request.header("Authorization", "Bearer " + role + "-fixture");
    }
    long create() throws Exception {
        var response = mvc.perform(as(post("/api/products"), "ADMIN").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(PRODUCT))).andExpect(status().isCreated()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("id").asLong();
    }

    @Test void publicEndpointWithoutTokenIs200() throws Exception {
        mvc.perform(get("/api/public/info")).andExpect(status().isOk());
        verifyNoInteractions(decoder);
    }
    @Test void allProtectedOperationsWithoutTokenAre401() throws Exception {
        for (var request : List.of(get("/api/products"), get("/api/products/1"), post("/api/products"),
                put("/api/products/1"), delete("/api/products/1"), get("/api/contact"), post("/api/contact"))) {
            mvc.perform(request).andExpect(status().isUnauthorized()).andExpect(header().string("WWW-Authenticate", "Bearer"))
                    .andExpect(jsonPath("$.status").value(401)).andExpect(header().doesNotExist("Set-Cookie"));
        }
    }
    @ParameterizedTest @ValueSource(strings = {"USER", "EDITOR"})
    void readerRolesCanReadProductsAndPostContactButCannotMutateProducts(String role) throws Exception {
        long id = create();
        mvc.perform(as(get("/api/products"), role)).andExpect(status().isOk());
        mvc.perform(as(get("/api/products/" + id), role)).andExpect(status().isOk());
        mvc.perform(as(post("/api/products"), role).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(PRODUCT)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
        mvc.perform(as(put("/api/products/" + id), role).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(PRODUCT)))
                .andExpect(status().isForbidden());
        mvc.perform(as(delete("/api/products/" + id), role)).andExpect(status().isForbidden());
        assertThat(products.count()).isEqualTo(1);
        assertThat(products.findById(id).orElseThrow().getStock()).isEqualTo(3);
        mvc.perform(as(post("/api/contact"), role).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(CONTACT)))
                .andExpect(status().isCreated());
        mvc.perform(as(get("/api/contact"), role))
                .andExpect(status().is(role.equals("EDITOR") ? 200 : 403));
        assertThat(contacts.count()).isEqualTo(1);
    }
    @Test void adminCanPerformCompleteCrudAndReadAndPostContact() throws Exception {
        long id = create();
        mvc.perform(as(get("/api/products"), "ADMIN")).andExpect(status().isOk());
        mvc.perform(as(get("/api/products/" + id), "ADMIN")).andExpect(status().isOk());
        mvc.perform(as(put("/api/products/" + id), "ADMIN").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(PRODUCT)))
                .andExpect(status().isOk());
        mvc.perform(as(delete("/api/products/" + id), "ADMIN")).andExpect(status().isNoContent());
        assertThat(products.count()).isZero();
        mvc.perform(as(post("/api/contact"), "ADMIN").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(CONTACT)))
                .andExpect(status().isCreated());
        mvc.perform(as(get("/api/contact"), "ADMIN")).andExpect(status().isOk());
    }
    @Test void noGroupsAndMalformedGroupsDenyWithout500() throws Exception {
        for (Object groups : new Object[] {null, List.of(), "ADMIN", List.of("UNRECOGNIZED"), List.of(123)}) {
            when(decoder.decode("no-role")).thenReturn(jwt(groups));
            mvc.perform(get("/api/products").header("Authorization", "Bearer no-role")).andExpect(status().isForbidden());
            mvc.perform(post("/api/contact").header("Authorization", "Bearer no-role")).andExpect(status().isForbidden());
        }
    }
    @Test void multipleGroupsAreMappedAndFrontendHeadersCannotGrantRoles() throws Exception {
        when(decoder.decode("multi")).thenReturn(jwt(List.of("USER", "EDITOR")));
        mvc.perform(get("/api/contact").header("Authorization", "Bearer multi")).andExpect(status().isOk());
        mvc.perform(as(post("/api/products"), "USER").header("X-Role", "ADMIN").header("cognito:groups", "ADMIN"))
                .andExpect(status().isForbidden());
    }
    @Test void invalidTokensAre401AndDoNotLeakDecoderDetails() throws Exception {
        when(decoder.decode("invalid-fixture")).thenThrow(new BadJwtException("private decoder details"));
        var result = mvc.perform(get("/api/products").header("Authorization", "Bearer invalid-fixture"))
                .andExpect(status().isUnauthorized()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("private decoder", "invalid-fixture");
    }
    @Test void sessionIsNotCreatedOrReusedAfterBearerRequest() throws Exception {
        var result = mvc.perform(as(get("/api/products"), "USER")).andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie")).andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/products").header("Authorization", "Basic dXNlcjpwYXNz")).andExpect(status().isUnauthorized());
    }
    @Test void unspecifiedRoutesAndMethodsAreDeniedEvenForAdmin() throws Exception {
        mvc.perform(as(patch("/api/products/1"), "ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/public/info"), "ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/other"), "ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(get("/error"), "ADMIN")).andExpect(status().isForbidden());
    }
    @Test void corsPreflightWorksWithoutTokenAndErrorsKeepCorsHeaders() throws Exception {
        mvc.perform(options("/api/products").header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(get("/api/products").header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(as(get("/api/contact"), "USER").header("Origin", "http://localhost:3000"))
                .andExpect(status().isForbidden()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(options("/api/products").header("Origin", "https://untrusted.example").header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
