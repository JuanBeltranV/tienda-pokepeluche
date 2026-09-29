package cl.pokepeluche;

import cl.pokepeluche.config.CognitoAuthoritiesConverter;
import cl.pokepeluche.config.CognitoJwtValidators;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import static org.assertj.core.api.Assertions.*;

class CognitoJwtTest {
    static final String ISSUER = "https://issuer.example.test/pool";
    static final String CLIENT = "test-public-client";
    static RSAKey key;
    static NimbusJwtDecoder decoder;

    @BeforeAll static void setup() throws Exception {
        // Ephemeral test keys only; never Cognito keys, secrets or real user tokens.
        key = new RSAKeyGenerator(2048).keyID("test-key").generate();
        decoder = NimbusJwtDecoder.withPublicKey(key.toRSAPublicKey()).build();
        decoder.setJwtValidator(CognitoJwtValidators.forAccessToken(ISSUER, CLIENT));
    }
    String signed(RSAKey signingKey, Consumer<JWTClaimsSet.Builder> change) throws Exception {
        Instant now = Instant.now();
        var claims = new JWTClaimsSet.Builder().issuer(ISSUER).subject("test-user")
                .issueTime(Date.from(now.minusSeconds(7200))).expirationTime(Date.from(now.plusSeconds(600)))
                .claim("token_use", "access").claim("client_id", CLIENT).claim("cognito:groups", List.of("ADMIN"));
        change.accept(claims);
        var token = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).type(JOSEObjectType.JWT).keyID(signingKey.getKeyID()).build(), claims.build());
        token.sign(new RSASSASigner(signingKey));
        return token.serialize();
    }
    void rejects(Consumer<JWTClaimsSet.Builder> change) throws Exception {
        String value = signed(key, change);
        assertThatThrownBy(() -> decoder.decode(value)).isInstanceOf(JwtException.class);
    }
    @Test void acceptsValidAccessTokenAndMapsAdmin() throws Exception {
        Jwt jwt = decoder.decode(signed(key, builder -> {}));
        assertThat(new CognitoAuthoritiesConverter().convert(jwt)).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN");
    }
    @Test void rejectsWrongSignature() throws Exception {
        var other = new RSAKeyGenerator(2048).keyID("another-test-key").generate();
        String value = signed(other, builder -> {});
        assertThatThrownBy(() -> decoder.decode(value)).isInstanceOf(JwtException.class);
    }
    @Test void rejectsWrongIssuer() throws Exception { rejects(builder -> builder.issuer("https://other.example.test")); }
    @Test void rejectsExpiredToken() throws Exception { rejects(builder -> builder.expirationTime(Date.from(Instant.now().minusSeconds(3600)))); }
    @Test void rejectsNotYetValidToken() throws Exception { rejects(builder -> builder.notBeforeTime(Date.from(Instant.now().plusSeconds(300)))); }
    @Test void requiresExpiration() throws Exception { rejects(builder -> builder.expirationTime(null)); }
    @Test void rejectsIdTokenEvenWithValidSignature() throws Exception { rejects(builder -> builder.claim("token_use", "id").audience(CLIENT)); }
    @Test void requiresTokenUse() throws Exception { rejects(builder -> builder.claim("token_use", null)); }
    @Test void rejectsOtherAppClient() throws Exception { rejects(builder -> builder.claim("client_id", "other-client")); }
    @Test void requiresClientIdRatherThanIdTokenAudience() throws Exception { rejects(builder -> builder.claim("client_id", null).audience(CLIENT)); }
    @Test void rejectsMalformedToken() { assertThatThrownBy(() -> decoder.decode("not-a-jwt")).isInstanceOf(JwtException.class); }
    @Test void groupsCanBeAbsentOrMultipleAndDoNotTrustRolesClaim() {
        var converter = new CognitoAuthoritiesConverter();
        var base = Jwt.withTokenValue("fixture").header("alg", "RS256").subject("test");
        assertThat(converter.convert(base.claim("roles", List.of("ADMIN")).build())).isEmpty();
        assertThat(converter.convert(base.claim("cognito:groups", List.of("ADMIN", "EDITOR", "USER", "ADMIN")).build()))
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN", "ROLE_EDITOR", "ROLE_USER");
        assertThat(converter.convert(base.claim("cognito:groups", "ADMIN").build())).isEmpty();
        assertThat(converter.convert(base.claim("cognito:groups", List.of(1, "", "USER")).build()))
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
    }
}
