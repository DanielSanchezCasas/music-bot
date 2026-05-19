import { SlashCommandBuilder } from 'discord.js';

export const slashCommands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Comprueba que el bot responde'),

    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción')
        .addStringOption((option) =>
            option
                .setName('query')
                .setDescription('Nombre o URL de la canción')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa la reproducción'),

    new SlashCommandBuilder()
        .setName('replay')
        .setDescription('Reanuda la música pausada'),

    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta la canción actual'),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la música y vacía la cola'),

    new SlashCommandBuilder()
        .setName('list')
        .setDescription('Muestra la cola de reproducción'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra la ayuda de todos los comandos'),
];
