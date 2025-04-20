import { validateVoiceChannel } from "../../utils/validate/validatePlayCommand.js";

export default async function stop(message, args, player) {

    if (validateVoiceChannel(message)) {
        return message.reply(voiceChannelError);
    }

    const queue = player.queues.get(message.guild);
    if (!queue) {
        return message.reply({ content: 'No hay una lista reproduciendose.' })
    }


    message.channel.send('Stop');

    queue.delete();
    queue.node.stop;
}
 