import { resolveQueueList } from '../../lib/queue/listReply.js';

export default async function list(message, _args, player) {
    const result = resolveQueueList(player, message.guild.id);

    if (result.error) {
        return message.reply(result.error);
    }

    return message.reply(result.payload);
}
