import { executeHelp } from './helpService.js';

export default async function help(message) {
    return executeHelp((payload) => message.channel.send(payload));
}
