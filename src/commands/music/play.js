import { sendMusicEmbed } from "../../utils/sendMessage.js";
import { validateVoiceChannel, validateSearchQuery } from "../../utils/validate/validatePlayCommand.js";

export default async function play(message, args, player) {

    const voiceChanel = message.member.voice.channel;

    if (validateVoiceChannel(message)) {
        return message.reply(voiceChannelError);
    }

    if (validateSearchQuery(args)) {
        return message.reply(searchQueryError);
    }

    const results = args.join(' ');

    const result = await player.play(voiceChanel, results, {
        nodeOptions: {
            metadata: {
                channel: message.channel,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 30000,
            leaveOnEnd: true,
            leaveOnEndCooldown: 30000,
        }
    })
    sendMusicEmbed(message.channel, result.track);
}
