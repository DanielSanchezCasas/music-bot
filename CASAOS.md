# Music Bot en CasaOS v0.4.x

## Instalación por terminal (recomendado)

```bash
cd ~/music-bot
cp .env.example .env
nano .env   # TOKEN_BOT, GUILD_ID, WEB_API_TOKEN
docker compose up -d --build
docker compose ps
```

Debe mostrar **Up (healthy)**.

Interfaz gráfica en la red local:

```text
http://<IP-del-servidor>:3000
```

Ejemplo: `http://192.168.5.101:3000` — contraseña = `WEB_API_TOKEN` del `.env`.

## Icono en CasaOS que abre la GUI

1. **Elimina** la ficha antigua `music-bot` en Apps si no guardaba (Imagen Docker bloqueada).
2. Deja el contenedor solo con compose (comandos de arriba).
3. Apps → **Instalar aplicación personalizada** → **Docker Compose**.
4. Ruta del archivo: `/home/<usuario>/music-bot/docker-compose.yml`
5. No uses el asistente manual con campos vacíos; importa el **archivo YAML**.

El `docker-compose.yml` incluye:

- `image: music-bot-music-bot:latest` (CasaOS puede leer el nombre de imagen)
- Labels `casaos.io/port`, `casaos.io/index`, `casaos.io/url`

Si el icono sigue en “no disponible”:

- En **Ajustes** de la app, **Web UI**: `http://<IP-LAN>:3000/` (no `127.0.0.1` si entras desde otro PC).
- Abre en **pestaña nueva** o usa el marcador directo `http://<IP>:3000`.

## Variables obligatorias en `.env`

| Variable | Uso |
|----------|-----|
| `TOKEN_BOT` | Token del bot Discord |
| `GUILD_ID` | ID(s) de servidor, separados por coma |
| `WEB_API_TOKEN` | Contraseña de la interfaz web |

`WEB_PORT=3000` ya lo fija `docker-compose.yml`; no hace falta duplicarlo en CasaOS con un placeholder.

## Actualizar

```bash
cd ~/music-bot
git pull
docker compose down
docker compose up -d --build
```

## Acceso desde internet

`https://casaos.tudominio.com` no abre el puerto 3000 solo. Opciones:

- `http://tudominio.com:3000` con reenvío en el router, o
- Proxy inverso (Nginx) → `http://127.0.0.1:3000`
