package cl.pokepeluche.repository;

import cl.pokepeluche.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByPokemonId(Integer pokemonId);
    boolean existsByPokemonIdAndIdNot(Integer pokemonId, Long id);
}
