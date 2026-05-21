import { REST, Routes } from 'discord.js';
import { token, guildIds } from '../config/env.js';
import { slashCommands } from '../commands/slash/definitions.js';

function formatDiscordError(error) {
    const code = error.code ?? error.rawError?.code;
    const message = error.message ?? error.rawError?.message ?? String(error);

    if (code === 50001 || message.includes('Missing Access')) {
        return (
            'Missing Access (50001): el bot no está en el servidor de GUILD_ID o falta el scope applications.commands al invitarlo.'
        );
    }

    return `${message}${code ? ` (${code})` : ''}`;
}

export async function registerSlashCommands(client) {
    if (!token) {
        throw new Error('TOKEN_BOT no está definido');
    }

    const rest = new REST().setToken(token);
    const body = slashCommands.map((command) => command.toJSON());
    const appId = client.user.id;

    if (guildIds.length) {
        const registered = [];

        for (const id of guildIds) {
            if (!client.guilds.cache.has(id)) {
                const servers = [...client.guilds.cache.values()]
                    .map((g) => `${g.name} (${g.id})`)
                    .join(', ');
                throw new Error(
                    `GUILD_ID incluye ${id} pero el bot no está ahí. Servidores: ${servers || 'ninguno'}`
                );
            }

            try {
                await rest.put(Routes.applicationGuildCommands(appId, id), { body });
                registered.push(id);
            } catch (error) {
                throw new Error(formatDiscordError(error));
            }
        }

        return {
            mode: 'guild',
            count: body.length,
            guildId: registered[0],
            guildIds: registered,
        };
    }

    try {
        await rest.put(Routes.applicationCommands(appId), { body });
        return { mode: 'global', count: body.length };
    } catch (error) {
        throw new Error(formatDiscordError(error));
    }
}
