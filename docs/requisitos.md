# Trazabilidad de la pauta y alcance incremental

Fuente principal: **Actividad Sumativa Nº1.pdf**, 9 páginas, leídas completas antes de implementar. La solicitud del propietario delimita esta entrega a Fase 1 local; lo diferido sigue siendo obligatorio para la evaluación final.

## Actualización de alcance: Fase 2

La tabla siguiente conserva la línea base histórica de Fase 1. La Fase 2 actual implementa únicamente Cognito + Amplify Auth en React, ProtectedRoute, navegación por grupos y Axios Bearer con Access Token. Los recursos Cognito ya fueron creados por el propietario. Spring Security, API Gateway y Lambda/PokéAPI se difieren por su nueva instrucción explícita. La prueba real con las tres cuentas queda pendiente; ver [guía de Fase 2](fase-2-cognito.md).

## Actualización de alcance: Fase 3

Fase 2 fue validada manualmente y publicada. Fase 3 incorpora Resource Server, validación Cognito JWT y RBAC real por método/ruta, incluidos GET contacto para ADMIN/EDITOR y POST para ADMIN/EDITOR/USER. Se conservan los tests de negocio y se agregan pruebas de seguridad/criptografía sin Internet. La matriz histórica de Fase 1 que sigue no describe el estado actual; ver [Fase 3](fase-3-resource-server.md). Gateway + JWT Authorizer + CORS AWS, Lambda/PokéAPI y despliegue siguen pendientes por instrucción del propietario.

## Requisitos funcionales y técnicos

| Referencia de pauta | Requisito | Estado de Fase 1 |
| --- | --- | --- |
| p. 1-3 | Spring Boot 3, puerto 8081, CSR, SQLite productos_db.db | Implementado |
| p. 2 | PublicController GET /api/public/info | Implementado, libre acceso |
| p. 2 | ProductController GET/POST/PUT/DELETE | Implementado, permisos diferidos |
| p. 2 | ContactController POST/GET con persistencia | Implementado, permisos diferidos |
| p. 2-3 | Driver y dialecto SQLite, ddl-auto=update, show-sql | Implementado, adaptación de coordenada/versión del dialecto explicada abajo |
| p. 3 | Resource Server, issuer-uri, JwtAuthenticationConverter | Pendiente Fase 2 por solicitud explícita |
| p. 3 | Mapear cognito:groups a ROLE_ADMIN/EDITOR/USER | Pendiente Fase 2 |
| p. 4 | React en 3000, Router DOM, Axios | Implementado |
| p. 4 | /login con Cognito y JWT global/en memoria | Vista implementada; autenticación pendiente |
| p. 4 | /productos, /admin/productos, /contacto | Implementadas; protección pendiente |
| p. 4 | ProtectedRoute y validación ADMIN del token | Pendiente, documentado en src/auth |
| p. 4 | Axios centralizado e interceptor Bearer | Instancia implementada; interceptor/sesión pendientes |
| p. 5 | Cognito User Pool + App Client sin secret + grupos + usuario por grupo | Pendiente Fase 2 |
| p. 5 | HTTP API Gateway, JWT Authorizer, Issuer/Audience | Pendiente Fase 2 |
| p. 5 | Integración HTTP con backend, CORS 3000/Authorization/Content-Type | CORS local implementado; Gateway y conectividad pendientes |

## Entregables y rúbrica completos

- **Hito 1 (30%)**, p. 6: cuestionario teórico de 50 preguntas sobre OAuth2, OIDC, JWT, CORS, API Gateway y Spring Security. No se reemplaza con código.
- **Hito 2 (40%)**, p. 6-7: ZIP de frontend y backend en AVA e informe Word de configuración AWS. Los 40 puntos se distribuyen en backend (15: CSR/persistencia 3, controladores 5, seguridad 7), frontend (15: vistas 5, protección 5, interceptor/sesión 5), informe (10: Cognito 5, Gateway 5).
- **Hito 3 (30%)**, p. 7: demo en localhost e infraestructura AWS. 20 puntos funcionales (login/JWT 4, roles 6, CRUD ADMIN 6, seguridad HTTP 4) y 10 de dominio técnico/defensa oral.
- **Rúbrica**, p. 8-9: exige tanto persistencia y rutas como protección real, informe con capturas, demo funcional y explicación del JWT. Fase 1 no equivale a una entrega final sobresaliente.
- **Modalidad y fechas**, p. 1: equipos de hasta 3 integrantes; entrega AVA y exposición el miércoles 30 de septiembre. Se conserva la fecha de la pauta, sin cambiarla por una fecha inferida.

No se creó informe Word, ZIP final, diapositivas ni capturas de recursos AWS inexistentes. `docs/` queda preparado para agregar evidencias reales después.

## Decisiones y diferencias explícitas

1. **Versiones del dialecto:** la pauta muestra `org.hibernate.community:hibernate-community-dialects:6.4.4.Final`. La coordenada publicada es `org.hibernate.orm:hibernate-community-dialects`. Se usa Spring Boot 3.5.11 y su versión administrada 6.6.42.Final para mantener Core y Dialects alineados; no se mezcla Core 6.6 con dialecto 6.4. Se mantiene `org.xerial:sqlite-jdbc:3.45.1.0`. [Referencia oficial de Hibernate](https://docs.hibernate.org/orm/6.4/quickstart/html_single/).
2. **Índice de unicidad:** se añade `schema.sql` después de JPA. La prueba de inserción SQL directa evidenció que `ddl-auto=update` solo no aplicaba UNIQUE en SQLite. Se mantiene la configuración exigida y se garantiza la regla mediante un índice explícito.
3. **Seguridad diferida:** no se incluye Spring Security ni issuer-uri ficticio porque el propietario pide CRUD abierto local en Fase 1. El objetivo final sigue siendo Resource Server.
4. **Contacto:** el texto de p. 2 restringe GET a ADMIN/EDITOR; el ejemplo de SecurityFilterChain de p. 3 solo exige autenticación para todo contacto. En Fase 2 se seguirá el requisito escrito más específico. La plantilla no se copiará sin corregir ese acceso.
5. **401/403:** p. 7 menciona 403 para peticiones no autorizadas. La implementación posterior deberá distinguir normalmente 401 para token ausente/inválido y 403 para identidad válida sin permiso, y explicarlo en la defensa.
6. **Conectividad Gateway:** p. 5 apunta a localhost:8081, pero desde AWS localhost no identifica el notebook. Resolver conectividad alcanzable para la demo requiere una decisión posterior; no se presume que ya funciona.
7. **Extensiones solicitadas por el propietario:** GET de detalle, `/productos/:id`, metadatos Pokémon, `pokemonId` único, datos demo y Lambda/PokéAPI planificada. No se atribuyen a la pauta.
8. **Modelo:** precio en CLP entero (Long), stock entero y DTOs separados de entidades. Contact incluye asunto y fecha UTC. Los campos adicionales son simples y documentados.
9. **Frontend:** Vite con puerto 3000 estricto y React Router DOM. No se usa Create React App ni login falso.
10. **Imágenes:** SVG originales neutrales, sin logos oficiales ni descarga de assets de Pokémon. Su parecido genérico entre productos es intencional mientras se definen fotografías definitivas.
