import { guildIds } from '../config/env.js';
import { resolveVoiceMember } from './resolveVoiceMember.js';

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord-player').Player} player
 */
export async function fetchConfiguredGuilds(client) {
    if (!guildIds.length) {
        return { error: 'GUILD_ID no configurado' };
    }

    const guilds = [];

    for (const id of guildIds) {
        let guild = client.guilds.cache.get(id);
        if (!guild) {
            try {
                guild = await client.guilds.fetch(id);
            } catch {
                continue;
            }
        }
        guilds.push(guild);
    }

    if (!guilds.length) {
        return { error: 'Ningún servidor de GUILD_ID está disponible' };
    }

    return { guilds };
}

/**
 * Elige el servidor activo: primero con alguien en voz; si no, con cola; si no, el primero de la lista.
 *
 * @param {import('discord.js').Client} client
 * @param {import('discord-player').Player} player
 */
export async function resolveActiveGuild(client, player) {
    const fetched = await fetchConfiguredGuilds(client);
    if ('error' in fetched) {
        return fetched;
    }

    const { guilds } = fetched;

    for (const guild of guilds) {
        const voice = await resolveVoiceMember(guild);
        if (!('error' in voice)) {
            return { guild, selection: 'voice' };
        }
    }

    for (const guild of guilds) {
        const queue = player.queues.get(guild.id);
        if (queue && !queue.deleted) {
            return { guild, selection: 'queue' };
        }
    }

    return { guild: guilds[0], selection: 'default' };
}
