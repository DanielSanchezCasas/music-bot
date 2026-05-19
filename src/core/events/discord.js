import * as status from '../../lib/console/status.js';
import { validateEnv } from '../../config/env.js';
import { registerSlashCommands } from '../registerSlashCommands.js';

export function registerDiscordEvents(client) {
    client.once('clientReady', async () => {
        for (const issue of validateEnv(client)) {
            status.logError('Configuración', new Error(issue));
        }

        try {
            const result = await registerSlashCommands(client);
            const scope =
                result.mode === 'guild'
                    ? `servidor ${result.guildId}`
                    : 'global (puede tardar hasta 1 h)';
            status.setReady(
                `Conectado · ${client.user.tag} · /commands en ${scope}`
            );
        } catch (error) {
            status.logError('Registrar slash commands', error);
            status.setReady(
                `Conectado · ${client.user.tag} · corrige GUILD_ID`
            );
        }
    });
}
