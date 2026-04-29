<template>
  <div
    class="place-card"
    role="button"
    tabindex="0"
    @click="$emit('view', place)"
    @keydown.enter="$emit('view', place)"
    @keydown.space.prevent="$emit('view', place)"
  >
    <!-- 액션 버튼 (수정 / 삭제) — 카드 클릭과 분리되도록 stopPropagation -->
    <div class="place-actions" @click.stop>
      <button
        class="place-action-btn"
        aria-label="수정"
        @click.stop="$emit('edit', place)"
      >✎</button>
      <button
        class="place-action-btn place-action-btn--delete"
        aria-label="삭제"
        @click.stop="$emit('delete', place.id)"
      >✕</button>
    </div>

    <!-- 대표 사진 -->
    <div v-if="firstPhoto" class="place-photo">
      <img :src="firstPhoto" :alt="place.name" class="place-photo-img" />
    </div>

    <div class="place-main">
      <div class="place-head">
        <h3 class="place-name">{{ place.name }}</h3>
      </div>

      <p v-if="place.address" class="place-loc">
        <span class="place-loc-dot">◎</span>
        {{ place.city ? `${place.city}, ` : '' }}{{ place.country || place.address }}
      </p>

      <p v-if="place.curatorNote" class="place-note">"{{ place.curatorNote }}"</p>
      <p v-if="place.highlight" class="place-highlight">◈ {{ place.highlight }}</p>
      <p v-if="place.feeling" class="place-feeling">{{ place.feeling }}</p>

      <div class="place-meta">
        <span v-if="place.category" class="tag">{{ place.category }}</span>
        <span v-if="place.travelContext" class="meta-text">{{ place.travelContext }}</span>
        <span v-if="place.visitedAt" class="meta-text">{{ formatDate(place.visitedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ place: Object })
defineEmits(['delete', 'edit', 'view'])

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

const firstPhoto = computed(() => {
  try {
    const photos = JSON.parse(props.place.photos || '[]')
    return photos[0]?.url || null
  } catch {
    return null
  }
})

</script>

<style scoped>
.place-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  gap: 1rem;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.place-card:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

/* 우상단 액션 — 사진이 있어도 그 위에 떠 있도록 absolute */
.place-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  z-index: 1;
}
.place-action-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  font-size: 12px;
  color: var(--soft);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.place-action-btn:hover {
  color: var(--ink);
  border-color: var(--hairline-strong);
  background: #fff;
}
.place-action-btn--delete:hover {
  color: #e57373;
  border-color: #e57373;
}
.place-card:hover {
  border-color: var(--hairline-strong);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.place-photo {
  width: 100%;
  aspect-ratio: 3 / 2;
  max-height: 360px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  background: var(--hairline);
}
.place-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.place-card:hover .place-photo-img {
  transform: scale(1.02);
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
.place-highlight {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}
.place-feeling {
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--faint);
  font-style: italic;
  margin-bottom: 0.5rem;
}
.place-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.meta-text {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--faint);
  letter-spacing: 0.02em;
}
</style>
