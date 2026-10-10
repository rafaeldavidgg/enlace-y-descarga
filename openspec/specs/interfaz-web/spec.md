# Spec: interfaz-web

## Purpose

Es la página en español donde el usuario pega un enlace, revisa el preview del medio,
elige la calidad, descarga el archivo y entiende con claridad cualquier error.

## Requirements

### Requirement: Pegar un enlace y ver el preview

La interfaz SHALL presentar un campo para pegar un enlace y SHALL mostrar el título, la
miniatura y la duración del medio una vez resuelto. La interfaz SHALL estar en español y
SHALL mostrar un estado de carga mientras se resuelve el enlace.

#### Scenario: Enlace resuelto con éxito

- **WHEN** el usuario pega un enlace válido y confirma
- **THEN** la interfaz muestra un estado de carga y luego el título, la miniatura y la duración

#### Scenario: Fallo al resolver el enlace

- **WHEN** la resolución del enlace falla
- **THEN** la interfaz vuelve al estado inicial y muestra un mensaje de error en español

### Requirement: Elegir la calidad de descarga

La interfaz SHALL permitir elegir entre los formatos descargables disponibles. SHALL seleccionar por defecto el mejor formato que ya incluya audio y video juntos, y SHALL mostrar las opciones con etiquetas legibles en lugar de identificadores técnicos. Para TikTok, todas las opciones mostradas SHALL ser sin marca de agua y la selección por defecto SHALL ser la mejor variante limpia.

#### Scenario: Selección por defecto

- **WHEN** el usuario resuelve un enlace con varios formatos disponibles
- **THEN** la interfaz preselecciona el mejor formato que ya incluye audio y video

#### Scenario: Selección manual

- **WHEN** el usuario elige otro formato de la lista
- **THEN** la interfaz usa ese formato para la descarga siguiente

#### Scenario: Sin formatos disponibles

- **WHEN** el medio no tiene formatos descargables con audio y video juntos
- **THEN** la interfaz lo comunica y deshabilita la acción de descarga

#### Scenario: Opciones TikTok sin marca de agua

- **WHEN** el usuario resuelve un enlace de TikTok con variantes limpias disponibles
- **THEN** la interfaz muestra solo opciones sin marca de agua e indica que la descarga será sin marca de agua móvil ni tarjeta final

### Requirement: Accionar la descarga

La interfaz SHALL ofrecer una acción de descarga explícita para el formato seleccionado y
SHALL indicar visualmente que la descarga está en curso hasta que el navegador la inicia.

#### Scenario: Inicio de la descarga

- **WHEN** el usuario pulsa la acción de descarga con un formato seleccionado
- **THEN** la interfaz inicia la descarga y muestra un estado de "descargando"

#### Scenario: Error durante la descarga

- **WHEN** la descarga falla
- **THEN** la interfaz abandona el estado de "descargando" y muestra un mensaje de error

### Requirement: Comunicar límites y aviso legal

La interfaz SHALL mostrar un aviso visible de uso responsable y de que el usuario es responsable de respetar los términos de servicio y los derechos de autor de las plataformas. La interfaz SHALL comunicar de forma comprensible cuando una descarga no es posible por límites de tamaño, duración o disponibilidad. Para TikTok, SHALL explicar cuando no hay variante sin marca de agua disponible, sin ofrecer la variante con marca como si fuera limpia.

#### Scenario: Aviso legal visible

- **WHEN** el usuario carga la página
- **THEN** la interfaz muestra un aviso de uso responsable y derechos de autor

#### Scenario: Aviso por límites

- **WHEN** una operación se rechaza por límites de tamaño, duración o disponibilidad
- **THEN** la interfaz explica el motivo en lenguaje comprensible y sugiere una alternativa

#### Scenario: TikTok sin variante limpia

- **WHEN** un video de TikTok no tiene variante sin marca de agua combinada
- **THEN** la interfaz informa que no se puede descargar sin marca de agua y no presenta la variante con marca como descarga válida

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
