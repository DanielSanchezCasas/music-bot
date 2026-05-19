import { validateVoiceChannelMember } from '../../validators/playCommand.js';
import { executePlay } from '../music/playService.js';
import { executeList } from '../music/listService.js';
import { executeHelp } from '../general/helpService.js';
import {
    executePause,
    executeResume,
    executeSkip,
    executeStop,
} from '../music/playbackService.js';
async function getMember(interaction) {
    if (interaction.member?.voice) {
        return interaction.member;
    }
    return interaction.guild.members.fetch(interaction.user.id);
}

async function replyEphemeral(interaction, content) {
    const payload = { content, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

export async function handlePing(interaction) {
    await interaction.reply({ content: 'pong' });
}

export async function handlePlay(interaction, player) {
    const query = interaction.options.getString('query', true);
    const member = await getMember(interaction);

    const voiceError = validateVoiceChannelMember(member);
    if (voiceError) {
        return replyEphemeral(interaction, voiceError);
    }

    await interaction.deferReply();

    await executePlay({
        member,
        textChannel: interaction.channel,
        query,
        player,
        reply: async ({ content, ephemeral }) => {
            if (ephemeral) {
                await interaction.followUp({ content, ephemeral: true });
                return;
            }
            await interaction.editReply({ content });
        },
    });
}

async function replyWithPayload(interaction, payload) {
    if (payload.ephemeral) {
        return replyEphemeral(interaction, payload.content);
    }
    return interaction.reply({ embeds: payload.embeds });
}

export async function handlePause(interaction, player) {
    const member = await getMember(interaction);
    return executePause({
        member,
        guildId: interaction.guildId,
        player,
        reply: (payload) => replyWithPayload(interaction, payload),
    });
}

export async function handleReplay(interaction, player) {
    const member = await getMember(interaction);
    return executeResume({
        member,
        guildId: interaction.guildId,
        player,
        reply: (payload) => replyWithPayload(interaction, payload),
    });
}

export async function handleSkip(interaction, player) {
    const member = await getMember(interaction);
    return executeSkip({
        member,
        guildId: interaction.guildId,
        player,
        reply: (payload) => replyWithPayload(interaction, payload),
    });
}

export async function handleList(interaction, player) {
    await executeList(interaction, player);
}

export async function handleHelp(interaction) {
    await executeHelp((payload) => interaction.reply(payload));
}

export async function handleStop(interaction, player) {
    const member = await getMember(interaction);
    return executeStop({
        member,
        guildId: interaction.guildId,
        player,
        reply: (payload) => replyWithPayload(interaction, payload),
    });
}

export const slashHandlers = {
    ping: handlePing,
    play: handlePlay,
    pause: handlePause,
    replay: handleReplay,
    skip: handleSkip,
    stop: handleStop,
    list: handleList,
    help: handleHelp,
};
