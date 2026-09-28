package cl.pokepeluche.dto;

import jakarta.validation.constraints.*;

public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120) String name,
        @NotBlank(message = "La descripción es obligatoria.") @Size(max = 2000) String description,
        @NotNull @Min(value = 1, message = "El precio debe ser al menos $1 CLP.") @Max(999999999) Long price,
        @NotNull @Min(value = 0, message = "El stock no puede ser negativo.") @Max(999999) Integer stock,
        @NotBlank @Size(max = 2048)
        @Pattern(regexp = "(?:/images/[a-zA-Z0-9_-]+\\.(?:svg|png|jpg|jpeg|webp)|https://[a-zA-Z0-9][^\\s]*)", message = "Usa una imagen local /images/archivo.svg o una URL HTTPS.") String imageUrl,
        @NotNull @Min(value = 1, message = "El número de Pokémon debe ser positivo.") Integer pokemonId,
        @NotBlank @Size(max = 100) @Pattern(regexp = "[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*", message = "Usa el nombre del Pokémon sin espacios ni símbolos.") String pokemonName
) {}
