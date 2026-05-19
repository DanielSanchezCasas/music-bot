import { EmbedBuilder } from 'discord.js';
import { prefix } from '../../config/env.js';

export function buildHelpPayload() {
    const p = prefix;

    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📖 Ayuda · Music Bot')
        .addFields(
            {
                name: '🎵 Reproducción',
                value:
                    `\`/play\` · \`${p}play <búsqueda o URL>\`\n` +
                    'Reproduce o encola una canción de YouTube.\n\n' +
                    `\`/pause\` · \`${p}pause\`\n` +
                    'Pausa la canción actual.\n\n' +
                    `\`/replay\` · \`${p}replay\`\n` +
                    'Reanuda la música pausada.\n\n' +
                    `\`/skip\` · \`${p}skip\`\n` +
                    'Salta a la siguiente canción.\n\n' +
                    `\`/stop\` · \`${p}stop\`\n` +
                    'Detiene la reproducción y vacía la cola.',
                inline: false,
            },
            {
                name: '📋 Cola',
                value:
                    `\`/list\` · \`${p}list\`\n` +
                    'Muestra la cola: orden, duración de cada tema y tiempo total.',
                inline: false,
            },
            {
                name: '🔧 Otros',
                value:
                    `\`/ping\` · \`${p}ping\`\n` +
                    'Comprueba que el bot responde.\n\n' +
                    `\`/help\` · \`${p}help\`\n` +
                    'Muestra esta ayuda.',
                inline: false,
            }
        );

    return { embeds: [embed] };
}

/**
 * @param {(payload: { embeds: import('discord.js').EmbedBuilder[] }) => Promise<unknown>} reply
 */
export async function executeHelp(reply) {
    return reply(buildHelpPayload());
}
