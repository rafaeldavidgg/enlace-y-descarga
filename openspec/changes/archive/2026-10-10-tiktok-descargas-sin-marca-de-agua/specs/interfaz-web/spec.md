# Spec Delta

## MODIFIED Requirements

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
