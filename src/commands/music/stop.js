import { createPrefixReply } from '../../lib/discord/replyAdapter.js';
import { executeStop } from './playbackService.js';

export default async function stop(message, _args, player) {
    return executeStop({
        member: message.member,
        guildId: message.guild.id,
        player,
        reply: createPrefixReply(message),
    });
}
