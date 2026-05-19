import { validateVoiceChannelMember, validateSearchQuery } from '../../validators/playCommand.js';
import { executePlay } from './playService.js';

export default async function play(message, args, player) {
    const query = args.join(' ').trim();
    const searchQueryError = validateSearchQuery(query);

    if (searchQueryError) {
        return message.reply(
            `${searchQueryError} Ejemplo: \`!play nombre de la canción\` o usa \`/play\` con el campo query.`
        );
    }

    const voiceChannelError = validateVoiceChannelMember(message.member);
    if (voiceChannelError) {
        return message.reply(voiceChannelError);
    }

    return executePlay({
        member: message.member,
        textChannel: message.channel,
        query,
        player,
        reply: ({ content }) => message.reply(content),
    });
}
