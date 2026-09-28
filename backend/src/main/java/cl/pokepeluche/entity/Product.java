package cl.pokepeluche.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(name = "uk_products_pokemon_id", columnNames = "pokemon_id"))
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 2000)
    private String description;
    @Column(nullable = false)
    private Long price;
    @Column(nullable = false)
    private Integer stock;
    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;
    @Column(name = "pokemon_id", nullable = false)
    private Integer pokemonId;
    @Column(name = "pokemon_name", nullable = false, length = 100)
    private String pokemonName;

    protected Product() {}

    public Product(String name, String description, Long price, Integer stock, String imageUrl, Integer pokemonId, String pokemonName) {
        update(name, description, price, stock, imageUrl, pokemonId, pokemonName);
    }

    public void update(String name, String description, Long price, Integer stock, String imageUrl, Integer pokemonId, String pokemonName) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.pokemonId = pokemonId;
        this.pokemonName = pokemonName;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Long getPrice() { return price; }
    public Integer getStock() { return stock; }
    public String getImageUrl() { return imageUrl; }
    public Integer getPokemonId() { return pokemonId; }
    public String getPokemonName() { return pokemonName; }
}
