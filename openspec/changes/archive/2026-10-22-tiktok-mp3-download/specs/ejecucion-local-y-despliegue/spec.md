# Spec Delta

## ADDED Requirements

### Requirement: Resolver el binario de conversion de audio por plataforma

El sistema SHALL obtener el binario de conversion de audio (ffmpeg) en tiempo de preparacion segun el sistema operativo, igual que hace con yt-dlp. El binario SHALL quedar fuera del control de versiones y SHALL localizarse en ejecucion sin rutas absolutas codificadas.

#### Scenario: Preparacion en Linux con audio disponible

- **WHEN** el proyecto se prepara en Linux y se resuelve una descarga de audio
- **THEN** la conversion a MP3 encuentra su binario y se ejecuta

#### Scenario: Binario de audio ausente al convertir

- **WHEN** el binario de conversion no esta disponible al pedir un MP3
- **THEN** el sistema falla con un mensaje claro de componente ausente en lugar de fallar de forma opaca

### Requirement: Empaquetar el binario de audio en la funcion de descarga

El proyecto SHALL incluir el binario de conversion en el paquete de la funcion de descarga en Vercel, manteniendo la paridad funcional con local y los limites del plan gratuito.

#### Scenario: Funcion de descarga con audio en Vercel

- **WHEN** la funcion de descarga con modo audio se ejecuta en Vercel
- **THEN** encuentra el binario de conversion incluido y entrega el MP3

#### Scenario: Limites documentados del modo audio

- **WHEN** alguien lee el README
- **THEN** encuentra que el MP3 solo aplica a TikTok y los limites de tamano y duracion del plan gratuito
