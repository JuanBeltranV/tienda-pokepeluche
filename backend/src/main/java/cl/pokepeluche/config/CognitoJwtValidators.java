package cl.pokepeluche.config;

import java.util.Objects;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;

/** Claim validation only; signature verification and JWK discovery belong to Spring/Nimbus. */
public final class CognitoJwtValidators {
    private CognitoJwtValidators() {}

    public static OAuth2TokenValidator<Jwt> forAccessToken(String issuer, String clientId) {
        return new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                new JwtClaimValidator<>("exp", Objects::nonNull),
                new JwtClaimValidator<>("token_use", "access"::equals),
                new JwtClaimValidator<>("client_id", clientId::equals));
    }
}
