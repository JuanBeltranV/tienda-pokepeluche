package cl.pokepeluche.dto;

import jakarta.validation.constraints.*;

public record ContactRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 100) String name,
        @NotBlank @Email(message = "Ingresa un correo válido.") @Size(max = 254) String email,
        @NotBlank(message = "El asunto es obligatorio.") @Size(max = 150) String subject,
        @NotBlank(message = "El mensaje es obligatorio.") @Size(max = 3000) String message
) {}
