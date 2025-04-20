import { validateVoiceChannel } from "../../utils/validate/validatePlayCommand.js";

export default async function skip(message, args, player) {

    if (validateVoiceChannel(message)) {
        return message.reply(voiceChannelError);
    }

    const queue = player.queues.get(message.guild);
    if (!queue) {
        return message.reply({ content: 'No hay una lista reproduciendose.' })
    }

    queue.node.skip();
    message.channel.send('Cancion saltada');

}
 