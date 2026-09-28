package cl.pokepeluche.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) { super("No existe el producto " + id + "."); }
}
