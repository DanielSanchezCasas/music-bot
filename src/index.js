import dotenv from 'dotenv';
import client from './utils/client.js';
import commands from './commands/commands.js';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

dotenv.config()

const prefix = process.env.PREFIX_BOT;

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} conectado!`);
});

const player = new Player(client);

player.extractors.register(YoutubeiExtractor).then(() => {
    console.log('Youtube cargado.');
}).catch((e) => console.log(e));

client.on('messageCreate', message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (commands[command]) {
        commands[command](message, args, player);
    }
});

client.login(process.env.TOKEN_BOT);