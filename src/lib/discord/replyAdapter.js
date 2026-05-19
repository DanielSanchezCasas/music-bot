/**
 * Adapta respuestas de servicios (content/embeds) a comandos con prefijo.
 *
 * @param {import('discord.js').Message} message
 */
export function createPrefixReply(message) {
    return (payload) => {
        if (payload.embeds) {
            return message.channel.send({ embeds: payload.embeds });
        }
        return message.reply({ content: payload.content });
    };
}
