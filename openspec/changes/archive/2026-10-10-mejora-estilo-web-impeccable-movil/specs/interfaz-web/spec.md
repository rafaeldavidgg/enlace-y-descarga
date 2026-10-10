# Spec Delta

## ADDED Requirements

### Requirement: Presentación mobile-first con jerarquía legible

La interfaz SHALL ofrecer una presentación mobile-first con jerarquía clara que priorice la tarea (pegar enlace → revisar → descargar), legible en pantallas estrechas de 360 px sin scroll horizontal.

#### Scenario: Carga en móvil sin scroll horizontal

- **WHEN** el usuario abre la página en un viewport de 360 px de ancho
- **THEN** todo el contenido (cabecera, formulario, preview y aviso) se muestra apilado sin scroll horizontal ni recortes

#### Scenario: Jerarquía clara de la tarea principal

- **WHEN** el usuario recorre la página en móvil
- **THEN** identifica en orden el título, la descripción breve, el campo de enlace con su acción principal y después el resultado o el aviso legal

#### Scenario: Texto legible en pantallas estrechas

- **WHEN** el usuario lee títulos, descripciones, errores y avisos en móvil
- **THEN** los tamaños, interlineados y longitudes de línea permiten leer sin zoom y los mensajes clave no quedan truncados

### Requirement: Controles táctiles usables en móvil

Los controles interactivos SHALL ser usables con el pulgar en móvil, con objetivos táctiles suficientes y formulario apilado, preservando accesibilidad por teclado.

#### Scenario: Formulario apilado en móvil

- **WHEN** el usuario pega un enlace en un viewport estrecho
- **THEN** el campo ocupa todo el ancho y el botón principal queda debajo a ancho completo, sin competir en una misma fila comprimida

#### Scenario: Objetivos táctiles mínimos

- **WHEN** el usuario pulsa el campo, el botón de búsqueda, el selector de calidad o las acciones de descarga y reintento en táctil
- **THEN** cada control ofrece una altura mínima de 44 px y separación suficiente para pulsarlo sin errores

#### Scenario: Foco visible y uso con teclado

- **WHEN** el usuario navega con teclado o lector de pantalla
- **THEN** el foco es visible en todos los controles, los labels asociados se mantienen y los errores conservan `role="alert"`

### Requirement: Coherencia visual en modo claro y oscuro

La interfaz SHALL mantener un sistema visual coherente en modo claro y oscuro mediante tokens compartidos, sin contrastes insuficientes ni estilos ad-hoc por componente.

#### Scenario: Contraste y acabado coherente en ambos modos

- **WHEN** el usuario alterna entre modo claro y oscuro
- **THEN** fondos, bordes, textos y estados conservan contraste legible y un mismo lenguaje de radios, sombras y estados de foco

#### Scenario: Sin patrones genéricos de baja calidad

- **WHEN** se revisa la página con la lista de anti-patrones Impeccable (beige genérico, bordes finos con sombras dispersas, tarjetas anidadas, etiquetas numeradas innecesarias)
- **THEN** no aparecen esos patrones y el acabado se percibe propio del producto, no generado por defecto

### Requirement: Preview y estados adaptados a pantallas estrechas

El preview del medio y los estados de carga, error, sin formatos y descarga SHALL adaptarse a pantallas estrechas manteniendo la información y los textos actuales en español.

#### Scenario: Preview apilado en móvil

- **WHEN** el enlace se resuelve en un viewport estrecho
- **THEN** la miniatura se muestra arriba a ancho completo con proporción estable y los metadatos (título, duración, plataforma) y el selector de calidad quedan debajo sin desbordar

#### Scenario: Estados legibles sin desbordar

- **WHEN** la interfaz muestra carga, error, aviso de sin formatos o estado descargando en móvil
- **THEN** cada mensaje es legible a ancho completo, conserva su significado y no desplaza la acción principal fuera de alcance

#### Scenario: Se preservan textos y semántica existentes

- **WHEN** se compara con la versión anterior tras el restyling
- **THEN** los textos en español, el aviso de uso responsable y la semántica (cabecera, formulario, artículo de resultado, alertas) se mantienen sin pérdidas
