# Spec Delta

## Purpose

Entrega el archivo de video elegido como una descarga real iniciada por el navegador, con
nombre de archivo, en lugar de abrirlo o reproducirlo en una pestaña.

## ADDED Requirements

### Requirement: Iniciar la descarga desde una referencia de formato

El sistema SHALL iniciar la descarga cuando el cliente envía una referencia de formato
obtenida de la resolución de enlaces. El servidor SHALL resolver el formato contra el
enlace original y SHALL entregar el archivo como una descarga con nombre de archivo
sugerido, sin exponer la lógica interna de extracción al cliente.

#### Scenario: Descarga iniciada con una referencia válida

- **WHEN** el cliente solicita la descarga con una referencia de formato válida
- **THEN** el sistema entrega el archivo del formato solicitado con un nombre de archivo sugerido

#### Scenario: Referencia de formato inválida o manipulada

- **WHEN** el cliente solicita la descarga con una referencia ausente, vencida o manipulada
- **THEN** el sistema rechaza la solicitud con un error claro y no inicia ninguna descarga

### Requirement: Entregar el archivo en streaming

El sistema SHALL transmitir el archivo al cliente a medida que se obtiene, sin requerir
almacenamiento persistente ni cargarlo por completo en memoria. La entrega SHALL funcionar
para archivos mayores que el límite de cuerpo de respuesta de la plataforma de despliegue.

#### Scenario: Archivo mayor que el límite de cuerpo de respuesta

- **WHEN** el archivo solicitado supera el límite de cuerpo de respuesta de la plataforma
- **THEN** el sistema lo entrega igualmente mediante streaming, sin truncarlo

#### Scenario: Cliente cancela la descarga

- **WHEN** el cliente interrumpe la descarga antes de terminar
- **THEN** el sistema detiene la obtención del archivo y libera los recursos asociados

### Requirement: Forzar la descarga en lugar de la reproducción

El sistema SHALL indicar al navegador que el archivo debe descargarse, no abrirse. Cuando
el nombre del medio esté disponible, SHALL usarlo como nombre de archivo sugerido con una
extensión coherente con el formato entregado.

#### Scenario: Nombre de archivo sugerido

- **WHEN** la descarga se entrega correctamente
- **THEN** el navegador recibe una indicación de descarga con un nombre de archivo coherente con el formato

#### Scenario: Nombre no disponible

- **WHEN** el título del medio no está disponible
- **THEN** el sistema propone un nombre de archivo genérico pero válido, con la extensión correcta

### Requirement: Gestionar límites de tiempo y tamaño

El sistema SHALL detectar y comunicar cuando una descarga excede el tiempo máximo de
ejecución permitido o falla por límites de la plataforma, sin dejar la operación en un
estado ambiguo para el usuario.

#### Scenario: Descarga que excede el tiempo máximo

- **WHEN** la obtención del archivo supera el tiempo máximo de ejecución permitido
- **THEN** el sistema informa que el archivo es demasiado grande o largo para procesarse y sugiere intentar con otro formato o más tarde

#### Scenario: Fallo del origen durante la descarga

- **WHEN** el origen corta la conexión o responde con un error durante la transmisión
- **THEN** el sistema comunica el fallo de forma clara en lugar de entregar un archivo incompleto como si fuera válido
