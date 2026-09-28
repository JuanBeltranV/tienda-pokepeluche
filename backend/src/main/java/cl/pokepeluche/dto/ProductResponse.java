package cl.pokepeluche.dto;

import cl.pokepeluche.entity.Product;

public record ProductResponse(Long id, String name, String description, Long price, Integer stock, String imageUrl, Integer pokemonId, String pokemonName) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getPrice(), product.getStock(), product.getImageUrl(), product.getPokemonId(), product.getPokemonName());
    }
}
