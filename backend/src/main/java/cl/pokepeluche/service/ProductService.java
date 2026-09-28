package cl.pokepeluche.service;

import cl.pokepeluche.dto.*;
import cl.pokepeluche.entity.Product;
import cl.pokepeluche.exception.*;
import cl.pokepeluche.repository.ProductRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository repository;

    public ProductService(ProductRepository repository) { this.repository = repository; }

    public List<ProductResponse> list() {
        return repository.findAll(Sort.by("pokemonId")).stream().map(ProductResponse::from).toList();
    }

    public ProductResponse get(Long id) { return ProductResponse.from(find(id)); }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (repository.existsByPokemonId(request.pokemonId())) throw new DuplicatePokemonException(request.pokemonId());
        Product product = new Product(request.name().trim(), request.description().trim(), request.price(), request.stock(), request.imageUrl(), request.pokemonId(), request.pokemonName().toLowerCase(Locale.ROOT));
        return ProductResponse.from(repository.saveAndFlush(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        if (repository.existsByPokemonIdAndIdNot(request.pokemonId(), id)) throw new DuplicatePokemonException(request.pokemonId());
        product.update(request.name().trim(), request.description().trim(), request.price(), request.stock(), request.imageUrl(), request.pokemonId(), request.pokemonName().toLowerCase(Locale.ROOT));
        return ProductResponse.from(repository.saveAndFlush(product));
    }

    @Transactional
    public void delete(Long id) { repository.delete(find(id)); }

    private Product find(Long id) { return repository.findById(id).orElseThrow(() -> new ProductNotFoundException(id)); }
}
