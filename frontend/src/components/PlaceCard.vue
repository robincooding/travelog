<template>
  <div class="place-card">
    <div class="place-main">
      <div class="place-head">
        <h3 class="place-name">{{ place.name }}</h3>
        <span v-if="place.mood" class="place-mood" :title="place.mood">{{ moodEmoji }}</span>
      </div>

      <p v-if="place.address" class="place-loc">
        <span class="place-loc-dot">◎</span>
        {{ place.city ? `${place.city}, ` : '' }}{{ place.country || place.address }}
      </p>

      <p v-if="place.curatorNote" class="place-note">"{{ place.curatorNote }}"</p>

      <div class="place-meta">
        <span v-if="place.category" class="tag">{{ place.category }}</span>
        <span v-if="place.travelContext" class="meta-text">{{ place.travelContext }}</span>
        <span v-if="place.visitedAt" class="meta-text">{{ formatDate(place.visitedAt) }}</span>
      </div>
    </div>

    <button
      class="place-delete"
      aria-label="삭제"
      @click="$emit('delete', place.id)"
    >✕</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ place: Object })
defineEmits(['delete'])

const moodEmoji = computed(() => ({
  '설렘': '✨', '감동': '🥹', '여유': '☕', '아쉬움': '🌧️'
})[props.place.mood] || '')

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.place-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.place-card:hover {
  border-color: var(--hairline-strong);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.place-main {
  flex: 1;
  min-width: 0;
}
.place-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.4rem;
}
.place-name {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
  line-height: 1.4;
}
.place-mood { font-size: 13px; }
.place-loc {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.5rem;
}
.place-loc-dot {
  font-size: 9px;
  color: var(--faint);
}
.place-note {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 0.65rem;
  padding-left: 0.65rem;
  border-left: 2px solid var(--hairline);
}
.place-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.meta-text {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--faint);
  letter-spacing: 0.02em;
}
.place-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #d4d4d0;
  padding: 2px 6px;
  line-height: 1;
  transition: color 0.2s;
  flex-shrink: 0;
}
.place-delete:hover { color: #e57373; }
</style>
