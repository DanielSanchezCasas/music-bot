<script setup>
defineProps({
    queue: { type: Object, default: null },
    error: { type: String, default: null },
});
</script>

<template>
    <div class="queue-card card">
        <p class="card-title">Cola</p>

        <p v-if="error" class="empty">{{ error }}</p>
        <p v-else-if="!queue?.current && !queue?.upcoming?.length" class="empty">
            Cola vacía
        </p>

        <ol v-else class="track-list">
            <li v-if="queue.current" class="track current">
                <span class="num">▶</span>
                <div class="info">
                    <span class="name">{{ queue.current.title }}</span>
                    <span class="meta">{{ queue.current.duration }}</span>
                </div>
            </li>
            <li v-for="item in queue.upcoming" :key="item.index" class="track">
                <span class="num">{{ item.index }}</span>
                <div class="info">
                    <span class="name">{{ item.title }}</span>
                    <span class="meta">{{ item.duration }}</span>
                </div>
            </li>
        </ol>
    </div>
</template>

<style scoped>
.empty {
    color: var(--muted);
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem 0;
}

.track-list {
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
}

.track {
    display: flex;
    gap: 0.65rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--border);
    align-items: flex-start;
}

.track:last-child {
    border-bottom: none;
}

.track.current .num {
    color: var(--success);
}

.num {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 700;
    min-width: 1.25rem;
}

.name {
    display: block;
    font-size: 0.88rem;
    font-weight: 500;
    line-height: 1.3;
}

.meta {
    font-size: 0.75rem;
    color: var(--muted);
}
</style>
