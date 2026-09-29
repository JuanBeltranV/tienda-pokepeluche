package cl.pokepeluche;

import cl.pokepeluche.repository.*;
import cl.pokepeluche.service.DemoDataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.sql.DriverManager;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.seed-demo=false", "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
class ApiIntegrationTest {
    // Business tests keep the real filter chain; a mock decoder prevents remote discovery.
    @MockitoBean JwtDecoder jwtDecoder;
    static final Path DATABASE;
    static {
        try { DATABASE = Files.createTempFile("pokepeluche-test-", ".db"); DATABASE.toFile().deleteOnExit(); }
        catch (Exception exception) { throw new ExceptionInInitializerError(exception); }
    }
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DATABASE.toAbsolutePath());
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ProductRepository products;
    @Autowired ContactRepository contacts;
    @Autowired DemoDataService demo;

    @BeforeEach void clearData() { contacts.deleteAll(); products.deleteAll(); }

    Map<String, Object> product(int pokemonId) {
        return new LinkedHashMap<>(Map.of("name", "Peluche de prueba", "description", "Descripción de prueba", "price", 19990, "stock", 10, "imageUrl", "/images/plush-sage.svg", "pokemonId", pokemonId, "pokemonName", "pikachu"));
    }
    long create(int pokemonId) throws Exception {
        var response = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(product(pokemonId))))
                .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("id").asLong();
    }

    @Test @WithAnonymousUser void publicInfoIsAccessible() throws Exception {
        mvc.perform(get("/api/public/info")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("PokePeluche"));
    }

    @Test void completeCrudPersistsInRealSqlite() throws Exception {
        long id = create(25);
        mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/products/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.pokemonId").value(25));
        var changed = product(25); changed.put("stock", 0); changed.put("price", 25000);
        mvc.perform(put("/api/products/" + id).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(changed)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stock").value(0));
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + DATABASE); var statement = connection.createStatement(); var rows = statement.executeQuery("SELECT price, stock FROM products")) {
            assertThat(rows.next()).isTrue(); assertThat(rows.getLong("price")).isEqualTo(25000); assertThat(rows.getInt("stock")).isZero();
        }
        mvc.perform(delete("/api/products/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + id)).andExpect(status().isNotFound());
        assertThat(products.count()).isZero();
    }

    @Test void duplicatePokemonRejectedOnCreateAndUpdate() throws Exception {
        create(25); long second = create(4);
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(product(25))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.detail").value("El Pokémon #25 ya tiene un producto asociado."));
        mvc.perform(put("/api/products/" + second).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(product(25))))
                .andExpect(status().isConflict());
        assertThat(products.findById(second).orElseThrow().getPokemonId()).isEqualTo(4);
        assertThat(products.count()).isEqualTo(2);
    }

    @Test void sqliteEnforcesUniquenessWithoutService() throws Exception {
        create(25);
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + DATABASE); var statement = connection.createStatement()) {
            assertThatThrownBy(() -> statement.executeUpdate("INSERT INTO products (name, description, price, stock, image_url, pokemon_id, pokemon_name) SELECT name, description, price, stock, image_url, pokemon_id, pokemon_name FROM products"))
                    .hasMessageContaining("UNIQUE constraint failed");
        }
    }

    @Test void missingProductsReturn404ForEveryOperation() throws Exception {
        mvc.perform(get("/api/products/999999")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/products/999999")).andExpect(status().isNotFound());
        mvc.perform(put("/api/products/999999").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(product(25))))
                .andExpect(status().isNotFound());
    }

    @Test void invalidFieldsReturn400AndDoNotPersist() throws Exception {
        var invalid = product(0); invalid.put("name", " "); invalid.put("price", -1); invalid.put("stock", -1); invalid.put("imageUrl", "javascript:alert(1)");
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.name").exists()).andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.stock").exists()).andExpect(jsonPath("$.errors.pokemonId").exists()).andExpect(jsonPath("$.errors.imageUrl").exists());
        assertThat(products.count()).isZero();
    }

    @Test void decimalsAndUnknownFieldsAreNotSilentlyAccepted() throws Exception {
        var invalid = product(25); invalid.put("price", 1.5);
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
        invalid = product(25); invalid.put("id", 999);
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
    }

    @Test void emptyOrMalformedBodyIs400() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors").exists());
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest());
    }

    @Test void contactIsValidatedAndPersisted() throws Exception {
        var contact = Map.of("name", "Ana", "email", "ana@example.com", "subject", "Consulta", "message", "Hola, consulta de demostración.");
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(contact)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.createdAt").exists());
        mvc.perform(get("/api/contact")).andExpect(status().isOk()).andExpect(jsonPath("$[0].subject").value("Consulta"));
        try (var connection = DriverManager.getConnection("jdbc:sqlite:" + DATABASE); var statement = connection.createStatement(); var rows = statement.executeQuery("SELECT count(*) FROM contacts")) {
            assertThat(rows.next()).isTrue(); assertThat(rows.getInt(1)).isEqualTo(1);
        }
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"invalid\",\"subject\":\"\",\"message\":\" \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.email").exists()).andExpect(jsonPath("$.errors.message").exists());
        assertThat(contacts.count()).isEqualTo(1);
    }

    @Test void demoSeedOnlyRunsWhenDatabaseIsEmpty() {
        demo.initializeIfEmpty();
        assertThat(products.findAll()).extracting(p -> p.getPokemonId()).containsExactlyInAnyOrder(1, 4, 7, 25);
        demo.initializeIfEmpty(); assertThat(products.count()).isEqualTo(4);
        products.delete(products.findAll().get(0));
        demo.initializeIfEmpty(); assertThat(products.count()).isEqualTo(3);
    }

    @Test void corsAllowsOnlyTheLocalFrontend() throws Exception {
        mvc.perform(options("/api/products").header("Origin", "http://localhost:3000").header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(options("/api/products").header("Origin", "https://untrusted.example").header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
