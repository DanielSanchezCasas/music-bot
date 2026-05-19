import { createPrefixReply } from '../../lib/discord/replyAdapter.js';
import { executeResume } from './playbackService.js';

export default async function replay(message, _args, player) {
    return executeResume({
        member: message.member,
        guildId: message.guild.id,
        player,
        reply: createPrefixReply(message),
    });
}
