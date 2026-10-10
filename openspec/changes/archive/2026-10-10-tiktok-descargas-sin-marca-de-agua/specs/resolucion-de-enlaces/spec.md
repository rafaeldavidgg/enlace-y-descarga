# Spec Delta

## MODIFIED Requirements

### Requirement: Listar formatos disponibles con audio y video juntos

El sistema SHALL listar los formatos descargables que ya contienen audio y video en un único archivo. Los formatos que requieran fusionar pistas separadas SHALL quedar fuera de la lista. Cada formato listado SHALL exponer una etiqueta legible y una referencia opaca que el cliente pueda enviar para iniciar la descarga. Para TikTok, los formatos listados SHALL ser sin marca de agua (ni la móvil durante el video ni la tarjeta final) siempre que la plataforma exponga una variante limpia combinada; las variantes con marca de agua SHALL quedar excluidas en ese caso.

#### Scenario: Formatos con audio y video disponibles

- **WHEN** la plataforma ofrece uno o más formatos que ya incluyen audio y video
- **THEN** el sistema devuelve una lista de esos formatos con etiqueta legible y referencia opaca

#### Scenario: Solo existen formatos con pistas separadas

- **WHEN** la plataforma no ofrece ningún formato con audio y video en un solo archivo
- **THEN** el sistema indica que no hay formatos descargables disponibles para ese medio

#### Scenario: TikTok con variantes con y sin marca de agua

- **WHEN** TikTok expone para el mismo medio variantes con marca de agua y variantes limpias que ya incluyen audio y video
- **THEN** el sistema lista solo las variantes limpias y excluye todas las variantes con marca de agua

#### Scenario: TikTok solo con variante con marca de agua

- **WHEN** TikTok no expone ninguna variante limpia combinada y solo hay variantes con marca de agua o pistas separadas
- **THEN** el sistema indica que no hay formato sin marca de agua descargable en lugar de ofrecer la variante con marca
