package cl.pokepeluche.config;

import java.util.Collection;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public final class CognitoAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Object claim = jwt.getClaims().get("cognito:groups");
        if (!(claim instanceof Collection<?> groups)) return List.of();
        return groups.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .filter(group -> !group.isBlank())
                .distinct()
                .<GrantedAuthority>map(group -> new SimpleGrantedAuthority("ROLE_" + group))
                .toList();
    }
}
