# Spec: resolucion-de-enlaces

## Purpose

Permite aceptar un enlace de una plataforma soportada, validarlo y devolver los metadatos
y los formatos descargables disponibles, para que el usuario decida qué descargar.

## Requirements

### Requirement: Aceptar y validar un enlace

El sistema SHALL aceptar un enlace de texto proporcionado por el usuario y SHALL
reconocer únicamente enlaces de las plataformas soportadas (TikTok y X/Twitter). Un enlace
de una plataforma no soportada o con formato inválido SHALL ser rechazado con un mensaje
claro en español, sin intentar la extracción.

#### Scenario: Enlace válido de plataforma soportada

- **WHEN** el usuario envía un enlace de TikTok o X/Twitter
- **THEN** el sistema lo marca como válido y continúa con la extracción de metadatos

#### Scenario: Enlace de plataforma no soportada

- **WHEN** el usuario envía un enlace de un dominio no soportado, como Instagram o YouTube
- **THEN** el sistema responde que la plataforma no es compatible e indica cuáles sí lo son

#### Scenario: Entrada vacía o con formato inválido

- **WHEN** el usuario envía un texto vacío o que no es una URL válida
- **THEN** el sistema responde solicitando un enlace válido y no realiza ninguna extracción

### Requirement: Devolver metadatos del medio

El sistema SHALL devolver, para un enlace válido, al menos el título, la miniatura y la
duración, además de un identificador estable del medio. Los metadatos SHALL obtenerse de
la plataforma de origen y no SHALL inventarse ni completarse con valores por defecto
engañosos cuando falten.

#### Scenario: Metadatos completos

- **WHEN** la plataforma expone título, miniatura y duración
- **THEN** el sistema devuelve esos tres campos junto con el identificador del medio

#### Scenario: Metadatos parcialmente ausentes

- **WHEN** la plataforma no expone alguno de los campos opcionales
- **THEN** el sistema devuelve los campos disponibles y omite explícitamente los ausentes

### Requirement: Listar formatos disponibles con audio y video juntos

El sistema SHALL listar los formatos descargables que ya contienen audio y video en un
único archivo. Los formatos que requieran fusionar pistas separadas SHALL quedar fuera de
la lista. Cada formato listado SHALL exponer una etiqueta legible y una referencia opaca
que el cliente pueda enviar para iniciar la descarga.

#### Scenario: Formatos con audio y video disponibles

- **WHEN** la plataforma ofrece uno o más formatos que ya incluyen audio y video
- **THEN** el sistema devuelve una lista de esos formatos con etiqueta legible y referencia opaca

#### Scenario: Solo existen formatos con pistas separadas

- **WHEN** la plataforma no ofrece ningún formato con audio y video en un solo archivo
- **THEN** el sistema indica que no hay formatos descargables disponibles para ese medio

### Requirement: Reportar fallos de extracción

El sistema SHALL informar de forma clara cuando no pueda obtener los metadatos, sin
exponer detalles internos. SHALL distinguir, como mínimo, contenido privado o eliminado,
contenido que requiere autenticación y fallo genérico de extracción.

#### Scenario: Contenido privado o eliminado

- **WHEN** el enlace corresponde a un medio privado, eliminado o restringido
- **THEN** el sistema responde que el contenido no está disponible públicamente

#### Scenario: Contenido que requiere autenticación

- **WHEN** la plataforma exige iniciar sesión para acceder al medio
- **THEN** el sistema responde que ese contenido requiere autenticación y no se puede procesar

#### Scenario: Fallo genérico de extracción

- **WHEN** la extracción falla por una causa no clasificada, como un cambio en la plataforma
- **THEN** el sistema responde con un mensaje de error genérico y sugiere intentar de nuevo más tarde
