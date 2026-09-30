package cl.pokepeluche.service;

import cl.pokepeluche.entity.Product;
import cl.pokepeluche.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoDataService {
    private final ProductRepository repository;
    public DemoDataService(ProductRepository repository) { this.repository = repository; }

    @Transactional
    public void initializeIfEmpty() {
        if (repository.count() != 0) return;
        repository.saveAll(List.of(
            new Product("Peluche Bulbasaur 25 cm", "Un pequeño compañero para hacer florecer tu colección. Peluche ficticio de 25 cm, de tacto suave y con detalles bordados. Imagen ilustrativa provisional.", 16990L, 12, "/images/bulbasaur.png", 1, "bulbasaur"),
            new Product("Peluche Charmander 25 cm", "Un toque de calidez para tu rincón favorito. Peluche ficticio de 25 cm, de tacto suave y con detalles bordados. Imagen ilustrativa provisional.", 17990L, 8, "/images/charmander.png", 4, "charmander"),
            new Product("Peluche Squirtle 25 cm", "Listo para acompañarte en tu próxima aventura. Peluche ficticio de 25 cm, de tacto suave y con detalles bordados. Imagen ilustrativa provisional.", 16990L, 10, "/images/squirtle.png", 7, "squirtle"),
            new Product("Peluche Pikachu 30 cm", "Una chispa de alegría para tu colección. Peluche ficticio de 30 cm, de tacto suave y con detalles bordados. Imagen ilustrativa provisional.", 19990L, 10, "/images/pikachu.png", 25, "pikachu")
        ));
    }
}
