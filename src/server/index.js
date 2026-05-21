import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { webPort, webApiToken } from '../config/env.js';
import * as logBus from '../lib/logging/logBus.js';
import * as status from '../lib/console/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.join(__dirname, '../../web/dist');

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord-player').Player} player
 */
export async function startWebServer(client, player) {
    const { createCommandBridge } = await import('../web/commandBridge.js');
    const bridge = createCommandBridge(client, player);

    const app = Fastify({ logger: false });

    app.setErrorHandler((error, request, reply) => {
        const message = error?.message ?? 'Error interno';
        logBus.append('error', `${request.method} ${request.url}: ${message}`, 'api');
        return reply.code(500).send({ error: message });
    });

    async function handleRoute(handler) {
        try {
            return await handler();
        } catch (error) {
            throw error;
        }
    }

    function isAuthorized(request) {
        const auth = request.headers.authorization;
        if (auth === `Bearer ${webApiToken}`) {
            return true;
        }
        const queryToken = request.query?.token;
        return queryToken === webApiToken;
    }

    app.addHook('onRequest', async (request, reply) => {
        const url = request.url.split('?')[0];
        if (
            url.startsWith('/api/') &&
            url !== '/api/health' &&
            !url.includes('/api/logs') &&
            !url.includes('/api/events')
        ) {
            if (!isAuthorized(request)) {
                return reply.code(401).send({ error: 'No autorizado' });
            }
        }
    });

    app.get('/api/health', async () => {
        return { ok: true, uptime: process.uptime() };
    });

    app.get('/api/status', async () => handleRoute(() => bridge.getStatus()));

    app.get('/api/guilds', async () => handleRoute(() => ({ guilds: bridge.listGuilds() })));

    app.get('/api/commands/ping', async () => bridge.ping());

    app.post('/api/commands/play', async (request, reply) => {
        const { query } = request.body ?? {};
        if (!query?.trim()) {
            return reply.code(400).send({ error: 'query requerido' });
        }
        const result = await bridge.play(query.trim());
        if (result.error || result.ok === false) {
            const code =
                typeof result.status === 'number' ? result.status : 400;
            return reply
                .code(code)
                .send({ error: result.error, messages: result.messages });
        }
        return result;
    });

    for (const action of ['pause', 'replay', 'skip', 'stop']) {
        app.post(`/api/commands/${action}`, async (request, reply) => {
            const result = await bridge[action]();
            if (result.error || result.ok === false) {
                const code =
                    typeof result.status === 'number' ? result.status : 400;
                return reply
                    .code(code)
                    .send({ error: result.error, messages: result.messages });
            }
            return result;
        });
    }

    app.get('/api/commands/list', async () => handleRoute(() => bridge.list()));

    app.get('/api/commands/help', async () => bridge.help());

    await app.register(fastifyWebsocket);

    app.get('/api/logs', { websocket: true }, (socket, request) => {
        if (!isAuthorized(request)) {
            socket.close(1008, 'No autorizado');
            return;
        }

        socket.send(
            JSON.stringify({ type: 'history', entries: logBus.getHistory() })
        );

        const unsubscribe = logBus.onAppend((entry) => {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify({ type: 'append', entry }));
            }
        });

        socket.on('close', unsubscribe);
    });

    app.get('/api/events', { websocket: true }, (socket, request) => {
        if (!isAuthorized(request)) {
            socket.close(1008, 'No autorizado');
            return;
        }

        let statusPushTimer = null;
        const pushStatus = async () => {
            if (socket.readyState !== 1) {
                return;
            }
            try {
                const data = await bridge.getStatus();
                socket.send(JSON.stringify({ type: 'status', data }));
            } catch (error) {
                logBus.append('error', `WS status: ${error?.message}`, 'api');
            }
        };

        const scheduleStatusPush = () => {
            if (statusPushTimer) {
                return;
            }
            statusPushTimer = setTimeout(() => {
                statusPushTimer = null;
                pushStatus();
            }, 300);
        };

        pushStatus();

        const unsubStatus = status.onStatusChange(scheduleStatusPush);

        const unsubLogs = logBus.onAppend((entry) => {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify({ type: 'log', entry }));
            }
        });

        socket.on('close', () => {
            clearTimeout(statusPushTimer);
            unsubStatus();
            unsubLogs();
        });
    });

    const hasWebDist =
        fs.existsSync(webDist) && fs.existsSync(path.join(webDist, 'index.html'));

    if (hasWebDist) {
        await app.register(fastifyStatic, {
            root: webDist,
            prefix: '/',
        });

        app.setNotFoundHandler((request, reply) => {
            if (request.url.split('?')[0].startsWith('/api/')) {
                return reply.code(404).send({ error: 'No encontrado' });
            }
            return reply.sendFile('index.html');
        });
    }

    await app.listen({ port: webPort, host: '0.0.0.0' });
    console.log(`Interfaz web en http://0.0.0.0:${webPort}`);
}
