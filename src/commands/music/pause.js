import { validateVoiceChannel } from "../../utils/validate/validatePlayCommand.js";

export default async function pause(message, args, player) {

    if (validateVoiceChannel(message)) {
        return message.reply(voiceChannelError);
    }

    const queue = player.queues.get(message.guild);
    if (!queue) {
        return message.reply({ content: 'No hay una lista reproduciendose.' })
    }

    if (queue.node.isPaused()) {
        return message.reply({ content: 'La musica esta pausada' })
    }

    queue.node.pause();
    message.channel.send('Pausando');

}
 