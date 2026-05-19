import { token } from './config/env.js';
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

client.login(token).catch((error) => {
    status.logError('No se pudo iniciar sesión en Discord', error);
    process.exit(1);
});
