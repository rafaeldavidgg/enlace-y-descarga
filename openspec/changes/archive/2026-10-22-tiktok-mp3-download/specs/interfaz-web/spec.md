# Spec Delta

## ADDED Requirements

### Requirement: Ofrecer la descarga de audio solo para TikTok

La interfaz SHALL mostrar una accion explicita "Descargar audio (MP3)" unicamente cuando el medio resuelto es de TikTok y tiene formatos disponibles. Para otras plataformas la accion SHALL NOT aparecer.

#### Scenario: TikTok resuelto con formatos

- **WHEN** el usuario resuelve un TikTok con al menos un formato disponible
- **THEN** la interfaz muestra el boton de descarga de audio junto al de video

#### Scenario: Medio de otra plataforma

- **WHEN** el usuario resuelve un enlace de X/Twitter
- **THEN** la interfaz no muestra la accion de descarga de audio

#### Scenario: TikTok sin formatos disponibles

- **WHEN** el TikTok no tiene variante limpia combinada
- **THEN** la interfaz no ofrece la descarga de audio y mantiene el aviso de sin-marca

### Requirement: Indicar el estado de la descarga de audio

La interfaz SHALL indicar visualmente que la descarga de audio esta en curso hasta que el navegador la inicia. La accion de audio SHALL usar el formato de video seleccionado como fuente y SHALL compartir objetivo tactil y accesibilidad con la accion de video.

#### Scenario: Inicio de la descarga de audio

- **WHEN** el usuario pulsa "Descargar audio (MP3)" con un formato seleccionado
- **THEN** la interfaz inicia la descarga e indica el estado en curso

#### Scenario: Controles usables en movil

- **WHEN** el usuario usa la accion de audio en un viewport de 360 px o con teclado
- **THEN** el boton ofrece altura minima de 44 px, foco visible y conservan los textos en espanol
