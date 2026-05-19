import { prefix } from '../../config/env.js';
import commands from '../../commands/index.js';
import { logCommand } from '../../lib/console/commandLogger.js';

export function registerMessageHandler(client, player) {
    client.on('messageCreate', (message) => {
        if (message.author.bot || !prefix || !message.content.startsWith(prefix)) {
            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (commands[command]) {
            logCommand(command, args.join(' '));
            commands[command](message, args, player);
        }
    });
}
