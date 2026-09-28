package cl.pokepeluche.exception;

public class DuplicatePokemonException extends RuntimeException {
    public DuplicatePokemonException(Integer id) { super("El Pokémon #" + id + " ya tiene un producto asociado."); }
}
