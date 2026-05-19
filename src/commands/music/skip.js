import { createPrefixReply } from '../../lib/discord/replyAdapter.js';
import { executeSkip } from './playbackService.js';

export default async function skip(message, _args, player) {
    return executeSkip({
        member: message.member,
        guildId: message.guild.id,
        player,
        reply: createPrefixReply(message),
    });
}
