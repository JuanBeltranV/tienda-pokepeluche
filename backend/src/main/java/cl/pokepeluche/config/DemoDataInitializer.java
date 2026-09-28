package cl.pokepeluche.config;

import cl.pokepeluche.service.DemoDataService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements CommandLineRunner {
    private final DemoDataService service;
    public DemoDataInitializer(DemoDataService service) { this.service = service; }
    @Override public void run(String... args) { service.initializeIfEmpty(); }
}
