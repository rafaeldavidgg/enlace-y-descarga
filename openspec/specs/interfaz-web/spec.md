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
