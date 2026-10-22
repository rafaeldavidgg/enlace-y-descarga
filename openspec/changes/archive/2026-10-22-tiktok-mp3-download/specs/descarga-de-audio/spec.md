# Spec Delta

## Purpose

Permite descargar solo el audio en MP3 de un video de TikTok ya resuelto, derivado de su variante limpia combinada, como descarga real en streaming.

## ADDED Requirements

### Requirement: Descargar el audio en MP3 desde una referencia de video

El sistema SHALL entregar el audio en MP3 cuando el cliente envia una referencia de formato valida de TikTok con el modo audio activado. El audio SHALL derivarse del mismo `format_id` limpio de la referencia, sin sustituirlo por otra variante.

#### Scenario: Descarga de audio con referencia valida de TikTok

- **WHEN** el cliente solicita la descarga con una referencia valida de TikTok y el modo audio MP3
- **THEN** el sistema entrega un archivo MP3 con el titulo del medio y `Content-Disposition: attachment`

#### Scenario: Referencia invalida o manipulada en modo audio

- **WHEN** el cliente solicita el modo audio con una referencia ausente, vencida o manipulada
- **THEN** el sistema rechaza la solicitud con un error claro y no inicia ninguna conversion

#### Scenario: Sin sustitucion por variante con marca en modo audio

- **WHEN** la variante limpia de la referencia deja de estar disponible al pedir el audio
- **THEN** el sistema falla con un error claro en lugar de entregar audio de otra variante

### Requirement: Entregar el audio en streaming como descarga real

El sistema SHALL transmitir el MP3 a medida que se convierte, sin almacenamiento persistente ni carga completa en memoria. La entrega SHALL forzar la descarga en el navegador con extension y tipo coherentes.

#### Scenario: Archivo de audio entregado en streaming

- **WHEN** el audio solicitado se convierte correctamente
- **THEN** el sistema lo entrega en streaming con `Content-Type: audio/mpeg` y nombre `*.mp3`

#### Scenario: Cliente cancela la descarga de audio

- **WHEN** el cliente interrumpe la descarga de audio antes de terminar
- **THEN** el sistema detiene la conversion y libera los recursos asociados

### Requirement: Limitar el modo audio a TikTok

El sistema SHALL ofrecer el modo audio MP3 unicamente para referencias de TikTok. Una solicitud de audio con referencia de otra plataforma SHALL ser rechazada con un error claro.

#### Scenario: Audio pedido para TikTok

- **WHEN** la referencia es de TikTok y el modo audio esta activado
- **THEN** el sistema procesa la conversion a MP3

#### Scenario: Audio pedido para otra plataforma

- **WHEN** la referencia es de X/Twitter y el modo audio esta activado
- **THEN** el sistema responde que el audio solo esta disponible para TikTok

### Requirement: Gestionar fallos y limites de la conversion de audio

El sistema SHALL comunicar de forma clara cuando la conversion excede el tiempo maximo o falla en el origen, sin dejar la operacion en estado ambiguo ni entregar un archivo incompleto como valido.

#### Scenario: Conversion que excede el tiempo maximo

- **WHEN** la extraccion del audio supera el tiempo maximo de ejecucion permitido
- **THEN** el sistema informa el corte y sugiere reintentarlo mas tarde

#### Scenario: Fallo del origen durante la conversion

- **WHEN** el origen corta la conexion o responde con error durante la conversion
- **THEN** el sistema comunica el fallo en lugar de entregar un MP3 incompleto
