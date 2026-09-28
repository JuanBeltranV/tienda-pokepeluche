# Identidad visual: PokePeluche Emerald

Rediseño de la Fase 1 basado en las dos referencias visuales entregadas por el propietario.

- **Composición:** saludo de entrenador seguido directamente por la colección. Se retiraron las tres tarjetas promocionales y la franja verde superior para acercar los productos al inicio. El portal oficial sirve como referencia de jerarquía visual, no como fuente de código, logos, noticias o imágenes.
- **Estética GBA:** marcos dobles, esquinas casi rectas, sombras de borde, ventanas de diálogo, indicadores triangulares y una paleta principal rojo Poké Ball y negro carbón, con acentos amarillos y azules. Todas las tarjetas usan la misma paleta neutra: fondo claro y cuerpo gris carbón. No representan tipos Pokémon y su color no depende del orden ni del filtro.
- **Tipografía:** VT323 para títulos, navegación, precios, controles y el mensaje completo de bienvenida. Texto largo y campos conservan una tipografía de lectura convencional. Se instala mediante `@fontsource/vt323` y Vite empaqueta los archivos localmente; no se consulta Google Fonts al navegar.
- **Licencia de la fuente:** VT323 Project Authors, SIL Open Font License 1.1. Copia distribuida en `frontend/public/fonts/VT323-LICENSE.txt`. No se extrajo tipografía de una ROM.
- **Arte:** `frontend/public/images/emerald-route.svg` es un paisaje vectorial pixel art original, con bosque, laguna, tienda y un compañero genérico. Se mantienen las ilustraciones neutrales de productos hasta contar con imágenes definitivas.
- **Implementación:** `Catalog.jsx` organiza el saludo y la colección; `emerald.css` contiene la apariencia sobre los estilos comunes de layout y formularios. El sprite local `frontend/public/images/pokeball.svg` reemplaza la hoja en la marca y se configura como favicon en `frontend/index.html`.
- **Adaptación:** colección de cuatro columnas en escritorio y dos en móvil; el diálogo ajusta sus líneas al ancho disponible. Formularios con etiquetas legibles y foco visible.

El rediseño se aplica a catálogo, detalle, gestión, contacto y login visual. No agrega funciones de negocio, integración con PokéAPI ni autenticación.

Verificado con lint, los ocho tests existentes del frontend y build. Revisión visual de escritorio y móvil (390 px), navegación, formularios y ausencia de desbordamiento horizontal a nivel de página.

Capturas: [escritorio](capturas/catalogo-emerald-escritorio.png) y [móvil](capturas/catalogo-emerald-movil.png). Las capturas originales de Fase 1 se conservan como referencia de la primera versión.


Se retiraron los textos superiores «El mundo de PokePeluche», «Explora · Descubre · Colecciona» y la frase lateral de la colección. Captura anterior a la unificación neutra: [catálogo Poké Ball](capturas/catalogo-pokeball-escritorio.png).

Para asignar fotos reales, colocar el archivo en frontend/public/images y escribir su ruta pública (por ejemplo /images/bulbasaur.jpg) en Gestionar → Editar → Imagen. También se admite una URL HTTPS. El formulario actual no carga archivos.


## Color por tipo: fase futura

Cuando se integre Lambda + PokéAPI, el color o acento de cada tarjeta se determinará dinámicamente a partir del tipo principal devuelto por PokéAPI a través de Lambda: grass → verde, fire → rojo, water → azul, electric → amarillo, etc. La respuesta normalizada deberá preservar el orden de los tipos para identificar el principal. Si no hay datos de tipo disponibles, se conservará la paleta neutra. No se inferirá el tipo por posición, nombre o ID, ni se agregará pokemonType manualmente a SQLite. Esta fase no implementa la integración.
