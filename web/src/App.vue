<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { api, getToken, clearToken, eventsWebSocket, waitForApi } from './api.js';
import AuthGate from './components/AuthGate.vue';
import ControlPanel from './components/ControlPanel.vue';
import NowPlaying from './components/NowPlaying.vue';
import QueueList from './components/QueueList.vue';
import LogViewer from './components/LogViewer.vue';

const authenticated = ref(Boolean(getToken()));
const status = ref({
    botStatus: 'Conectando…',
    nowPlaying: '—',
    lastCommand: '—',
    upcoming: [],
    hasVoice: false,
    hasQueue: false,
    voiceError: null,
    otherGuildsHint: null,
    configuredGuild: null,
    configuredGuildCount: 1,
    voiceUser: null,
    isPaused: false,
    currentTrack: null,
});
const queue = ref(null);
const queueError = ref(null);
const loading = ref(false);
const toast = ref('');
const toastType = ref('info');
let pollTimer = null;
let eventsWs = null;

function showToast(message, type = 'info') {
    toast.value = message;
    toastType.value = type;
}

async function refresh() {
    try {
        const data = await api.status();
        status.value = { ...status.value, ...data };
    } catch (e) {
        if (e.message.includes('401') || e.message.includes('No autorizado')) {
            clearToken();
            authenticated.value = false;
        }
    }
}

async function refreshQueue() {
    if (!status.value.hasQueue) {
        queue.value = null;
        queueError.value = null;
        return;
    }
    try {
        const data = await api.list();
        queue.value = data.queue;
        queueError.value = null;
    } catch (e) {
        queue.value = null;
        if (!e.message.includes('No hay música')) {
            queueError.value = e.message;
        } else {
            queueError.value = null;
        }
    }
}

async function runCommand(fn, successMsg) {
    loading.value = true;
    try {
        const r = await fn();
        const msg =
            r.message ??
            r.messages?.find((m) => m.content && !m.ephemeral)?.content ??
            r.messages?.find((m) => m.description)?.description ??
            successMsg;
        if (msg) {
            showToast(msg.replace(/\*\*/g, ''), 'success');
        }
        await refresh();
        await refreshQueue();
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        loading.value = false;
    }
}

async function onAuthenticated() {
    authenticated.value = true;
    await waitForApi();
    refresh();
    refreshQueue();
    connectEvents();
    pollTimer = setInterval(() => {
        refresh();
        refreshQueue();
    }, 2500);
}

function connectEvents() {
    eventsWs?.close();
    eventsWs = eventsWebSocket((data) => {
        if (data.type === 'status') {
            status.value = { ...status.value, ...data.data };
        }
    });
}

function logout() {
    clearToken();
    authenticated.value = false;
    eventsWs?.close();
    clearInterval(pollTimer);
}

onMounted(() => {
    if (authenticated.value) {
        onAuthenticated();
    }
});

onUnmounted(() => {
    clearInterval(pollTimer);
    eventsWs?.close();
});
</script>

<template>
    <AuthGate v-if="!authenticated" @authenticated="onAuthenticated" />

    <div v-else class="app">
        <header class="header">
            <div class="brand">
                <span class="brand-icon">♫</span>
                <div>
                    <h1>Music Bot</h1>
                    <p class="brand-sub">Control desde CasaOS</p>
                </div>
            </div>
            <button class="btn-ghost" @click="logout">Salir</button>
        </header>

        <div class="layout">
            <section class="left">
                <ControlPanel
                    :has-voice="status.hasVoice"
                    :has-queue="status.hasQueue"
                    :is-paused="status.isPaused"
                    :voice-error="status.voiceError"
                    :other-guilds-hint="status.otherGuildsHint"
                    :configured-guild="status.configuredGuild"
                    :configured-guild-count="status.configuredGuildCount"
                    :loading="loading"
                    @play="(q) => runCommand(() => api.play(q))"
                    @pause="() => runCommand(() => api.pause(), 'Pausado')"
                    @replay="() => runCommand(() => api.replay(), 'Reanudado')"
                    @skip="() => runCommand(() => api.skip(), 'Saltado')"
                    @stop="() => runCommand(() => api.stop(), 'Detenido')"
                    @ping="() => runCommand(() => api.ping(), 'pong')"
                    @refresh="
                        () => {
                            refresh();
                            refreshQueue();
                        }
                    "
                />
                <NowPlaying :status="status" />
                <QueueList :queue="queue" :error="queueError" />
            </section>

            <section class="right">
                <LogViewer />
            </section>
        </div>

        <Transition name="toast">
            <p v-if="toast" class="toast" :class="toastType">{{ toast }}</p>
        </Transition>
    </div>
</template>

<style scoped>
.app {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1.25rem 1.5rem 3rem;
    min-height: 100vh;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.brand-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.brand h1 {
    font-size: 1.25rem;
    font-weight: 700;
}

.brand-sub {
    font-size: 0.8rem;
    color: var(--muted);
}

.layout {
    display: grid;
    grid-template-columns: minmax(300px, 380px) 1fr;
    gap: 1.25rem;
    align-items: start;
}

.left {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.right {
    min-height: 560px;
    display: flex;
    flex-direction: column;
}

.toast-enter-active,
.toast-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
}

@media (max-width: 900px) {
    .layout {
        grid-template-columns: 1fr;
    }

    .right {
        min-height: 400px;
    }
}
</style>
