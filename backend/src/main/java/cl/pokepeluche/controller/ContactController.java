package cl.pokepeluche.controller;

import cl.pokepeluche.dto.*;
import cl.pokepeluche.service.ContactService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactService service;
    public ContactController(ContactService service) { this.service = service; }
    @GetMapping public List<ContactResponse> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ContactResponse create(@Valid @RequestBody ContactRequest request) { return service.create(request); }
}
