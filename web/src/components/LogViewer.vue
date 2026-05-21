<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { logsWebSocket, waitForApi } from '../api.js';

const entries = ref([]);
const filter = ref('all');
const search = ref('');
const autoScroll = ref(true);
const logEl = ref(null);
let ws = null;
let reconnectTimer = null;

const levelClass = {
    info: 'log-info',
    warn: 'log-warn',
    error: 'log-error',
};

const filtered = computed(() => {
    let list = entries.value;
    if (filter.value !== 'all') {
        list = list.filter((e) => e.level === filter.value);
    }
    if (search.value.trim()) {
        const q = search.value.toLowerCase();
        list = list.filter((e) => e.message.toLowerCase().includes(q));
    }
    return list;
});

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('es', { hour12: false });
}

function handleMessage(data) {
    if (data.type === 'history') {
        entries.value = data.entries ?? [];
    } else if (data.type === 'append') {
        entries.value = [...entries.value, data.entry];
        if (entries.value.length > 5000) {
            entries.value = entries.value.slice(-5000);
        }
    }
}

function connect() {
    if (ws) {
        ws.close();
    }
    ws = logsWebSocket(handleMessage);
    ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws?.close();
}

watch(filtered, async () => {
    if (!autoScroll.value || !logEl.value) {
        return;
    }
    await nextTick();
    logEl.value.scrollTop = logEl.value.scrollHeight;
});

onMounted(async () => {
    await waitForApi();
    connect();
});

onUnmounted(() => {
    clearTimeout(reconnectTimer);
    ws?.close();
});
</script>

<template>
    <div class="card log-viewer">
        <div class="toolbar">
            <p class="card-title">Logs en vivo</p>
            <div class="controls">
                <select v-model="filter">
                    <option value="all">Todos</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                </select>
                <input v-model="search" type="text" placeholder="Buscar…" />
                <label>
                    <input v-model="autoScroll" type="checkbox" />
                    Auto-scroll
                </label>
            </div>
        </div>
        <pre ref="logEl" class="log-output"><code
            v-for="(entry, i) in filtered"
            :key="`${entry.ts}-${i}`"
            :class="levelClass[entry.level] ?? 'log-info'"
        ><span class="ts">[{{ formatTime(entry.ts) }}]</span>
<span class="lvl">{{ entry.level.toUpperCase().padEnd(5) }}</span>
{{ entry.message }}
</code></pre>
    </div>
</template>

<style scoped>
.log-viewer {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.controls select,
.controls input[type='text'] {
    width: auto;
    min-width: 100px;
    font-size: 0.85rem;
    padding: 0.35rem 0.6rem;
}

.controls label {
    font-size: 0.8rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.log-output {
    flex: 1;
    overflow: auto;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.85rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    line-height: 1.5;
    min-height: 480px;
    max-height: calc(100vh - 12rem);
}

code {
    display: block;
    white-space: pre-wrap;
    word-break: break-word;
}

.ts {
    color: var(--muted);
}

.lvl {
    margin-right: 0.35rem;
}

.log-info .lvl {
    color: #6eb5ff;
}

.log-warn {
    color: var(--warn);
}

.log-error {
    color: var(--error);
}
</style>
