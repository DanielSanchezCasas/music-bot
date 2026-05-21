import {
    token,
    isWebEnabled,
    webPort,
    webApiToken,
    guildIds,
} from './config/env.js';
import * as status from './lib/console/status.js';
import client from './core/client.js';
import { createPlayer } from './core/player.js';
import { registerDiscordEvents } from './core/events/discord.js';
import { registerMessageHandler } from './core/events/messages.js';
import { registerInteractionHandler } from './core/events/interactions.js';

status.initConsole();

const player = createPlayer(client);

registerDiscordEvents(client);
registerMessageHandler(client, player);
registerInteractionHandler(client, player);

function validateBootEnv() {
    if (!token) {
        console.error('[music-bot] TOKEN_BOT no está definido en .env');
        process.exit(1);
    }

    if (webPort > 0 && !webApiToken) {
        console.error(
            '[music-bot] WEB_API_TOKEN es obligatorio cuando WEB_PORT está activo (CasaOS/Docker usa 3000)'
        );
        process.exit(1);
    }

    if (isWebEnabled() && !guildIds.length) {
        console.error('[music-bot] GUILD_ID es obligatorio para la interfaz web');
        process.exit(1);
    }
}

async function boot() {
    validateBootEnv();

    if (isWebEnabled()) {
        try {
            const { startWebServer } = await import('./server/index.js');
            await startWebServer(client, player);
        } catch (error) {
            status.logError('Servidor web', error);
            process.exit(1);
        }
    }

    client.login(token).catch((error) => {
        status.logError('No se pudo iniciar sesión en Discord', error);
        process.exit(1);
    });
}

boot();
