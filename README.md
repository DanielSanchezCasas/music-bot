# Music Bot (Discord + CasaOS)

Bot de música para Discord con interfaz web para controlarlo desde el navegador (ideal en **CasaOS**).

## Requisitos

- Servidor Discord y bot creado en [Discord Developer Portal](https://discord.com/developers/applications)
- Intents del bot: **Message Content**, **Server Members** (opcional), **Voice**
- Alguien en un canal de voz para reproducir música

## Instalación en CasaOS

1. Clona o sube el proyecto al NAS.
2. Crea el archivo `.env` junto a `docker-compose.yml`:

```env
TOKEN_BOT=tu_token_discord
GUILD_ID=id_servidor1,id_servidor2
WEB_PORT=3000
WEB_API_TOKEN=un_token_largo_y_secreto
```

3. En la carpeta del proyecto:

```bash
docker compose up -d --build
```

4. Abre en el navegador: `http://<ip-del-nas>:3000`
5. Introduce el `WEB_API_TOKEN`.
6. Conéctate a un canal de voz en Discord y usa **Play** desde la web.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `TOKEN_BOT` | Token del bot Discord |
| `GUILD_ID` | ID(s) del servidor Discord, separados por coma. La web elige el que tenga gente en voz |
| `WEB_PORT` | Puerto de la interfaz (3000) |
| `WEB_API_TOKEN` | Contraseña de la interfaz web |
| `TEXT_CHANNEL_ID` | Canal de texto para mensajes (opcional) |
| `VOICE_CHANNEL_ID` | Solo detectar usuarios en ese canal de voz (opcional) |
| `YOUTUBE_COOKIE` | Cookies de YouTube (pegar desde el navegador) si falla el stream |

## Desarrollo local

```bash
pnpm install
pnpm --dir web install
cp .env.example .env
# Edita .env
pnpm start:dev
```

- Bot + API: puerto 3000  
- UI Vue: http://localhost:5173

## Notas

- El audio usa **discord-player-youtubei v3** con varios métodos de respaldo (adaptive, SABR, yt-dlp si está instalado).
- Si ves `Could not extract stream`, añade `YOUTUBE_COOKIE` en `.env` (cookies exportadas de youtube.com en tu navegador).
- Los logs se ven en la interfaz web, no hace falta la terminal del contenedor.
- El bot no sale del canal de voz al terminar una canción (pensado para dejarlo corriendo en CasaOS).
