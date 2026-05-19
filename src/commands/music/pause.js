import { createPrefixReply } from '../../lib/discord/replyAdapter.js';
import { executePause } from './playbackService.js';

export default async function pause(message, _args, player) {
    return executePause({
        member: message.member,
        guildId: message.guild.id,
        player,
        reply: createPrefixReply(message),
    });
}
