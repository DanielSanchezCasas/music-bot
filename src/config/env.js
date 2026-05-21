import dotenv from 'dotenv';

dotenv.config();

export const prefix = process.env.PREFIX_BOT ?? '!';
export const token = process.env.TOKEN_BOT;

/** @param {string | undefined} raw */
function parseGuildIds(raw) {
    if (!raw?.trim()) {
        return [];
    }
    return [
        ...new Set(
            raw
                .split(/[,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
        ),
    ];
}

/** Uno o varios servidores (GUILD_ID=id1,id2). La web usa el que tenga gente en voz. */
export const guildIds = parseGuildIds(process.env.GUILD_ID);

/** Primer ID de la lista (compatibilidad). */
export const guildId = guildIds[0];
export const textChannelId = process.env.TEXT_CHANNEL_ID?.trim() || undefined;
export const voiceChannelId = process.env.VOICE_CHANNEL_ID?.trim() || undefined;
export const webPort = Number(process.env.WEB_PORT) || 0;
export const webApiToken = process.env.WEB_API_TOKEN?.trim() || undefined;
export const disableTerminalPanel =
    process.env.WEB_DISABLE_TERMINAL_PANEL === 'true' ||
    process.env.NODE_ENV === 'production';

export function isWebEnabled() {
    return webPort > 0 && Boolean(webApiToken);
}

export function validateEnv(client) {
    const issues = [];

    if (!token) {
        issues.push('TOKEN_BOT no está definido en .env');
    }

    if (client) {
        for (const id of guildIds) {
            if (!client.guilds.cache.has(id)) {
                const servers = [...client.guilds.cache.values()]
                    .map((g) => `${g.name} → ${g.id}`)
                    .join(', ');
                issues.push(
                    `GUILD_ID incluye ${id} pero el bot no está en ese servidor. Disponibles: ${servers || '(ninguno)'}`
                );
            }
        }
    }

    if (isWebEnabled()) {
        if (!guildIds.length) {
            issues.push('GUILD_ID es obligatorio cuando WEB_PORT está activo');
        }
        if (!webApiToken) {
            issues.push('WEB_API_TOKEN es obligatorio cuando WEB_PORT está activo');
        }
    }

    return issues;
}
