import { slashHandlers } from '../../commands/slash/handlers.js';
import { logCommand } from '../../lib/console/commandLogger.js';
import * as status from '../../lib/console/status.js';

function getCommandDetail(interaction) {
    if (interaction.commandName === 'play') {
        return interaction.options.getString('query', true);
    }
    return '';
}

export function registerInteractionHandler(client, player) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.inGuild()) {
            return;
        }

        if (!interaction.isChatInputCommand()) {
            return;
        }

        const handler = slashHandlers[interaction.commandName];
        if (!handler) {
            return;
        }

        logCommand(interaction.commandName, getCommandDetail(interaction));

        try {
            await handler(interaction, player);
        } catch (error) {
            status.logError(`/${interaction.commandName}`, error);

            const payload = {
                content: 'Ocurrió un error al ejecutar el comando.',
                ephemeral: true,
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload).catch(() => {});
            } else {
                await interaction.reply(payload).catch(() => {});
            }
        }
    });
}
