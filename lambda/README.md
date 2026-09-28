# Integración PokéAPI - PLANIFICADA

Esta carpeta queda reservada. No contiene una Lambda implementada ni infraestructura desplegada.

La función futura recibirá nombre o número de Pokémon desde React a través de HTTP API Gateway, consultará PokéAPI, comprobará existencia, obtendrá el ID canónico y normalizará la respuesta:

```json
{
  "id": 25,
  "name": "pikachu",
  "types": ["electric"],
  "height": 4,
  "weight": 60,
  "sprite": "..."
}
```

Se documentarán las unidades: PokéAPI usa decímetros para altura y hectogramos para peso. La interfaz podrá convertirlas a metros y kilogramos. Un Pokémon inexistente producirá 404 con error controlado. También se tratarán timeout, errores upstream y límites de uso.

Dos usos planificados:

- Reemplazar `frontend/src/components/PokemonFields.jsx` por un buscador nombre/ID. Solo una selección validada habilitará la creación o cambio de asociación.
- Completar la sección Pokédex de `/productos/:id` usando el `pokemonId` guardado.

La Lambda no guarda precios, stock, productos ni mensajes. Esos datos siguen bajo Spring Boot + SQLite. La unicidad de `pokemonId` permanece en SQLite incluso después de validar la existencia. El flujo final será React → Gateway → Lambda → PokéAPI; no se hará fetch directo desde React a PokéAPI.

Pendiente decidir cómo el backend garantizará la validez canónica de la asociación frente a clientes que omitan el formulario. Una validación únicamente en el navegador no es una barrera de integridad. La Fase 1 solo garantiza formato y unicidad.

Uso visual futuro: el frontend asignará el color/acento de las tarjetas según el tipo principal de la respuesta normalizada (grass verde, fire rojo, water azul, electric amarillo, etc.). Se preservará el orden de tipos devuelto por PokéAPI. Hasta disponer de esos datos, las tarjetas tendrán una paleta neutra común, independiente del orden o filtro. No se añadirá pokemonType manual a SQLite.
