import { guildIds } from '../config/env.js';
import { resolveActiveGuild } from './resolveActiveGuild.js';
import { executePlay } from '../commands/music/playService.js';
import { buildHelpPayload } from '../commands/general/helpService.js';
import {
    executePause,
    executeResume,
    executeSkip,
    executeStop,
} from '../commands/music/playbackService.js';
import { resolveQueueList } from '../lib/queue/listReply.js';
import { getWaitingTracks } from '../lib/queue/sync.js';
import * as status from '../lib/console/status.js';
import { resolveVoiceMember } from './resolveVoiceMember.js';
import { resolveTextChannel } from './resolveTextChannel.js';

/**
 * @param {import('discord.js').Client} client
 */
export function createCommandBridge(client, player) {
    async function getGuild() {
        const result = await resolveActiveGuild(client, player);
        if ('error' in result) {
            return { error: result.error, status: 503 };
        }

        return { guild: result.guild, selection: result.selection };
    }

    async function getVoiceContext() {
        const guildResult = await getGuild();
        if ('error' in guildResult) {
            return guildResult;
        }

        const voiceResult = await resolveVoiceMember(guildResult.guild);
        if ('error' in voiceResult) {
            return { error: voiceResult.error, status: 409 };
        }

        return {
            member: voiceResult.member,
            guildId: guildResult.guild.id,
            voiceChannel: voiceResult.channel,
        };
    }

    async function getPlayContext() {
        const guildResult = await getGuild();
        if ('error' in guildResult) {
            return guildResult;
        }

        const voiceResult = await resolveVoiceMember(guildResult.guild);
        if ('error' in voiceResult) {
            return { error: voiceResult.error, status: 409 };
        }

        const textChannel = await resolveTextChannel(guildResult.guild);
        if (!textChannel) {
            return {
                error: 'No hay ningún canal de texto disponible para enviar mensajes',
                status: 503,
            };
        }

        return {
            member: voiceResult.member,
            guildId: guildResult.guild.id,
            voiceChannel: voiceResult.channel,
            textChannel,
        };
    }

    function countHumansInVoice(guild) {
        return [...guild.voiceStates.cache.values()].filter(
            (vs) => vs.channelId && !vs.member?.user?.bot
        ).length;
    }

    function getOtherGuildsVoiceHint(activeGuildId) {
        const hints = [];

        for (const id of guildIds) {
            if (id === activeGuildId) {
                continue;
            }
            const g = client.guilds.cache.get(id);
            if (!g) {
                continue;
            }
            const count = countHumansInVoice(g);
            if (count > 0) {
                hints.push(`${g.name} (${count} en voz)`);
            }
        }

        for (const g of client.guilds.cache.values()) {
            if (guildIds.includes(g.id) || g.id === activeGuildId) {
                continue;
            }
            const count = countHumansInVoice(g);
            if (count > 0) {
                hints.push(`${g.name} (no en GUILD_ID, ${count} en voz)`);
            }
        }

        if (!hints.length) {
            return null;
        }

        if (guildIds.length > 1) {
            return `También hay gente en voz en: ${hints.join(' · ')}. La web usará el servidor activo arriba.`;
        }

        return `Hay usuarios en voz en otro servidor: ${hints.join(' · ')}. Añádelo a GUILD_ID o cámbialo en .env.`;
    }

    async function getVoiceStatus() {
        const guildResult = await getGuild();
        if ('error' in guildResult) {
            return {
                hasVoice: false,
                voiceError: guildResult.error,
                voiceUser: null,
                configuredGuild: null,
                otherGuildsHint: null,
            };
        }

        const guild = guildResult.guild;
        const configuredGuild = { id: guild.id, name: guild.name };

        const voiceResult = await resolveVoiceMember(guild);
        if ('error' in voiceResult) {
            return {
                hasVoice: false,
                voiceError: voiceResult.error,
                voiceUser: null,
                configuredGuild,
                otherGuildsHint: getOtherGuildsVoiceHint(guild.id),
            };
        }

        return {
            hasVoice: true,
            voiceError: null,
            voiceUser: {
                id: voiceResult.member.user.id,
                tag: voiceResult.member.user.tag,
                channel: voiceResult.channel.name,
            },
            configuredGuild,
            otherGuildsHint: null,
        };
    }

    function listGuilds() {
        return [...client.guilds.cache.values()].map((g) => ({
            id: g.id,
            name: g.name,
            isConfigured: guildIds.includes(g.id),
            humansInVoice: countHumansInVoice(g),
        }));
    }

    function createReplyCollector() {
        /** @type {{ content?: string, embeds?: unknown[], ephemeral?: boolean }[]} */
        const messages = [];

        return {
            messages,
            reply: async (payload) => {
                messages.push(payload);
            },
        };
    }

    async function runPlayback(fn, label) {
        const guildResult = await getGuild();
        if ('error' in guildResult) {
            return guildResult;
        }

        const activeGuildId = guildResult.guild.id;
        const queue = player.queues.get(activeGuildId);
        if (!queue || queue.deleted) {
            return {
                ok: false,
                error: 'No hay música en reproducción',
                status: 404,
            };
        }

        const voiceCtx = await getVoiceContext();
        let member = 'error' in voiceCtx ? null : voiceCtx.member;

        if (!member) {
            const humans = queue.channel?.members?.filter((m) => !m.user.bot);
            member = humans?.first() ?? null;
        }

        if (!member?.user) {
            const requester = queue.currentTrack?.requestedBy;
            if (requester) {
                member = { user: requester };
            }
        }

        if (!member?.user) {
            return {
                ok: false,
                error: 'No hay contexto de usuario para controlar la cola',
                status: 503,
            };
        }

        status.setLastCommand(label);
        const { messages, reply } = createReplyCollector();

        await fn({
            member,
            guildId: activeGuildId,
            player,
            reply,
            fromWeb: true,
        });

        const formatted = messages.map(formatReply);
        const failure = formatted.find((m) => m.ephemeral);

        if (failure) {
            return {
                ok: false,
                error: failure.content ?? 'No se pudo ejecutar el comando',
                messages: formatted,
                status: 400,
            };
        }

        return {
            ok: true,
            messages: formatted,
            botSnapshot: status.getSnapshot(),
        };
    }

    return {
        async getStatus() {
            const snapshot = status.getSnapshot();
            const voiceCheck = await getVoiceStatus();
            const guildResult = await getGuild();
            const activeGuildId =
                'guild' in guildResult ? guildResult.guild.id : null;
            const queue = activeGuildId ? player.queues.get(activeGuildId) : null;

            let currentTrack = null;
            let upcoming = [];
            let isPaused = false;

            if (queue && !queue.deleted) {
                currentTrack = queue.currentTrack
                    ? {
                          title: queue.currentTrack.title,
                          duration: queue.currentTrack.duration,
                          url: queue.currentTrack.url,
                      }
                    : null;
                upcoming = getWaitingTracks(queue).map((t) => ({
                    title: t.title,
                    duration: t.duration,
                    url: t.url,
                }));
                isPaused = queue.node?.isPaused?.() ?? false;
            }

            return {
                ...snapshot,
                hasVoice: voiceCheck.hasVoice,
                hasQueue: Boolean(queue && !queue.deleted),
                voiceError: voiceCheck.voiceError,
                otherGuildsHint: voiceCheck.otherGuildsHint,
                configuredGuild: voiceCheck.configuredGuild,
                configuredGuildCount: guildIds.length,
                voiceUser: voiceCheck.voiceUser,
                currentTrack,
                upcomingTracks: upcoming,
                isPaused,
            };
        },

        listGuilds,

        async ping() {
            return { ok: true, message: 'pong' };
        },

        async play(query) {
            const ctx = await getPlayContext();
            if ('error' in ctx) {
                return ctx;
            }

            status.setLastCommand(`web play ${query}`);
            const { messages, reply } = createReplyCollector();

            try {
                await executePlay({
                    member: ctx.member,
                    textChannel: ctx.textChannel,
                    voiceChannel: ctx.voiceChannel,
                    query,
                    player,
                    reply,
                });
            } catch (error) {
                status.logError('web play', error);
                return {
                    ok: false,
                    error: error?.message ?? 'Error al reproducir',
                    status: 500,
                };
            }

            const formatted = messages.map(formatReply);
            const failure = formatted.find((m) => m.ephemeral);

            if (failure) {
                return {
                    ok: false,
                    error: failure.content ?? 'No se pudo reproducir',
                    messages: formatted,
                    status: 400,
                };
            }

            return {
                ok: true,
                messages: formatted,
                botSnapshot: status.getSnapshot(),
            };
        },

        async pause() {
            return runPlayback(executePause, 'web pause');
        },

        async replay() {
            return runPlayback(executeResume, 'web replay');
        },

        async skip() {
            return runPlayback(executeSkip, 'web skip');
        },

        async stop() {
            return runPlayback(executeStop, 'web stop');
        },

        async list() {
            const guildResult = await getGuild();
            if ('error' in guildResult) {
                return guildResult;
            }

            const activeGuildId = guildResult.guild.id;
            const queue = player.queues.get(activeGuildId);
            if (!queue || queue.deleted) {
                return { ok: true, queue: null };
            }

            try {
                const result = resolveQueueList(player, activeGuildId);
                if (result.error) {
                    return { ok: true, queue: null };
                }

                return {
                    ok: true,
                    queue: serializeQueue(queue),
                };
            } catch (error) {
                return {
                    ok: false,
                    error: error?.message ?? 'Error al leer la cola',
                    status: 500,
                };
            }
        },

        async help() {
            const payload = buildHelpPayload();
            const embed = payload.embeds[0];
            const data = embed.data ?? embed.toJSON?.() ?? embed;

            return {
                ok: true,
                title: data.title,
                fields: data.fields?.map((f) => ({
                    name: f.name,
                    value: f.value,
                })),
            };
        },
    };
}

function formatReply(payload) {
    if (payload.content) {
        return { type: 'text', content: payload.content, ephemeral: payload.ephemeral };
    }
    if (payload.embeds?.length) {
        const embed = payload.embeds[0];
        const data = embed.data ?? embed.toJSON?.() ?? embed;
        return {
            type: 'embed',
            title: data.title,
            description: data.description,
            ephemeral: payload.ephemeral,
        };
    }
    return { type: 'unknown', payload };
}

function serializeQueue(queue) {
    if (!queue || queue.deleted) {
        return null;
    }

    const current = queue.currentTrack;
    const waiting = getWaitingTracks(queue);

    return {
        isPaused: queue.node?.isPaused?.() ?? false,
        current: current
            ? {
                  title: current.title,
                  duration: current.duration,
                  url: current.url,
                  requestedBy: current.requestedBy?.tag,
              }
            : null,
        upcoming: waiting.map((t, i) => ({
            index: i + 1,
            title: t.title,
            duration: t.duration,
            url: t.url,
            requestedBy: t.requestedBy?.tag,
        })),
    };
}
