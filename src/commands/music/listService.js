import { resolveQueueList } from '../../lib/queue/listReply.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord-player').Player} player
 */
export async function executeList(interaction, player) {
    const result = resolveQueueList(player, interaction.guildId);

    if (result.error) {
        return interaction.reply({
            content: result.error,
            ephemeral: true,
        });
    }

    return interaction.reply(result.payload);
}
