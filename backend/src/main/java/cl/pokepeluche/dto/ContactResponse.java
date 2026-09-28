package cl.pokepeluche.dto;

import cl.pokepeluche.entity.Contact;
import java.time.Instant;

public record ContactResponse(Long id, String name, String email, String subject, String message, Instant createdAt) {
    public static ContactResponse from(Contact contact) {
        return new ContactResponse(contact.getId(), contact.getName(), contact.getEmail(), contact.getSubject(), contact.getMessage(), contact.getCreatedAt());
    }
}
