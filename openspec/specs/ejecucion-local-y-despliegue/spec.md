# Spec: ejecucion-local-y-despliegue

## Purpose

Garantiza que el mismo proyecto se pueda clonar y ejecutar localmente y desplegarse en
Vercel sin cambios de código, resolviendo el binario de extracción según la plataforma.

## Requirements

### Requirement: Resolver el binario de extracción por plataforma

El sistema SHALL obtener el binario de extracción de medios en tiempo de preparación,
según el sistema operativo donde se ejecute, y SHALL localizarlo en tiempo de ejecución
sin rutas absolutas codificadas. El binario SHALL quedar fuera del control de versiones.

#### Scenario: Preparación en Linux (despliegue)

- **WHEN** el proyecto se prepara en un entorno Linux
- **THEN** se descarga y se deja disponible el binario correspondiente a Linux

#### Scenario: Preparación en Windows o macOS (local)

- **WHEN** el proyecto se prepara en Windows o macOS
- **THEN** se descarga y se deja disponible el binario correspondiente a ese sistema

#### Scenario: Binario ausente al ejecutar

- **WHEN** el binario no está disponible al ejecutar una extracción
- **THEN** el sistema falla con un mensaje claro que indica cómo obtenerlo, en lugar de fallar de forma opaca

### Requirement: Paridad entre ejecución local y despliegue

El sistema SHALL comportarse igual en local y en Vercel para las plataformas soportadas,
usando las mismas rutas y la misma lógica de negocio. Las diferencias de plataforma SHALL
limitarse a la resolución del binario y a los límites de la infraestructura.

#### Scenario: Misma funcionalidad en local y en Vercel

- **WHEN** se resuelve y descarga un enlace en local y luego en Vercel
- **THEN** se obtiene el mismo resultado funcional y los mismos mensajes, salvo por los límites de infraestructura

#### Scenario: Sin pasos manuales adicionales

- **WHEN** alguien clona el proyecto y sigue las instrucciones del README
- **THEN** puede ejecutar la aplicación localmente sin editar código ni configurar servicios externos de pago

### Requirement: Configuración de despliegue en Vercel

El proyecto SHALL incluir la configuración necesaria para desplegarse en Vercel en el plan
gratuito, incluyendo el tiempo máximo de ejecución de las funciones de descarga y el
empaquetado del binario en la función correspondiente.

#### Scenario: Despliegue documentado

- **WHEN** alguien sigue las instrucciones de despliegue del README
- **THEN** puede publicar el proyecto en Vercel sin pasos no documentados

#### Scenario: Binario disponible en la función desplegada

- **WHEN** la función de descarga se ejecuta en Vercel
- **THEN** encuentra el binario incluido en el paquete de la función y puede usarlo

### Requirement: Documentar límites y aviso legal

El README SHALL documentar los límites conocidos del despliegue gratuito y SHALL incluir un
aviso de uso responsable y de derechos de autor. SHALL indicar qué plataformas están
soportadas y cuáles quedan fuera de alcance.

#### Scenario: Límites documentados

- **WHEN** alguien lee el README
- **THEN** encuentra los límites de transferencia, duración y tamaño del plan gratuito

#### Scenario: Aviso legal documentado

- **WHEN** alguien lee el README
- **THEN** encuentra el aviso de uso responsable y la indicación de plataformas soportadas y no soportadas
