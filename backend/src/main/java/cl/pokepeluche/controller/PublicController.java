package cl.pokepeluche.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {
    @GetMapping("/info") public Map<String, String> info() {
        return Map.of("name", "PokePeluche", "description", "Catálogo y gestión de peluches ficticios", "phase", "3 - Resource Server", "authentication", "Amazon Cognito Access Token JWT + RBAC");
    }
}
