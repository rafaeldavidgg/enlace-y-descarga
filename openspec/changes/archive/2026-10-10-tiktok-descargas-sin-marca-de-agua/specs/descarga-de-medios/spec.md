# Spec Delta

## MODIFIED Requirements

### Requirement: Iniciar la descarga desde una referencia de formato

El sistema SHALL iniciar la descarga cuando el cliente envía una referencia de formato obtenida de la resolución de enlaces. El servidor SHALL resolver el formato contra el enlace original y SHALL entregar el archivo como una descarga con nombre de archivo sugerido, sin exponer la lógica interna de extracción al cliente. Para TikTok, el archivo entregado SHALL ser la variante sin marca de agua elegida (sin marca móvil ni tarjeta final) y SHALL NOT sustituirse por una variante con marca de agua en ningún paso.

#### Scenario: Descarga iniciada con una referencia válida

- **WHEN** el cliente solicita la descarga con una referencia de formato válida
- **THEN** el sistema entrega el archivo del formato solicitado con un nombre de archivo sugerido

#### Scenario: Referencia de formato inválida o manipulada

- **WHEN** el cliente solicita la descarga con una referencia ausente, vencida o manipulada
- **THEN** el sistema rechaza la solicitud con un error claro y no inicia ninguna descarga

#### Scenario: Descarga de TikTok sin marca de agua

- **WHEN** el cliente solicita la descarga de un formato TikTok resuelto como limpio
- **THEN** el sistema entrega el archivo sin marca de agua móvil y sin tarjeta final, correspondiente a ese formato

#### Scenario: Sin sustitución por variante con marca

- **WHEN** la variante limpia deja de estar disponible en el momento de descargar
- **THEN** el sistema falla con un error claro en lugar de entregar la variante con marca de agua
