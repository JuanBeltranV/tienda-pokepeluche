package cl.pokepeluche.service;

import cl.pokepeluche.dto.*;
import cl.pokepeluche.entity.Contact;
import cl.pokepeluche.repository.ContactRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ContactService {
    private final ContactRepository repository;
    public ContactService(ContactRepository repository) { this.repository = repository; }

    public List<ContactResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id")).stream().map(ContactResponse::from).toList();
    }

    @Transactional
    public ContactResponse create(ContactRequest request) {
        return ContactResponse.from(repository.saveAndFlush(new Contact(request.name().trim(), request.email().trim(), request.subject().trim(), request.message().trim())));
    }
}
