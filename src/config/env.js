import dotenv from 'dotenv';

dotenv.config();

export const prefix = process.env.PREFIX_BOT ?? '!';
export const token = process.env.TOKEN_BOT;
export const guildId = process.env.GUILD_ID?.trim() || undefined;

export function validateEnv(client) {
    const issues = [];

    if (!token) {
        issues.push('TOKEN_BOT no está definido en .env');
    }

    if (guildId && client && !client.guilds.cache.has(guildId)) {
        const servers = [...client.guilds.cache.values()]
            .map((g) => `${g.name} → ${g.id}`)
            .join(', ');
        issues.push(
            `GUILD_ID=${guildId} no coincide con ningún servidor del bot. Servidores disponibles: ${servers || '(ninguno)'}`
        );
    }

    return issues;
}
