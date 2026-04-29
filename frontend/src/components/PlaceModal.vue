<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div
        class="modal-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`place-modal-title-${place.id}`"
      >
        <button class="modal-close" aria-label="닫기" @click="$emit('close')">✕</button>

        <!-- 대표 사진 -->
        <div v-if="firstPhoto" class="modal-photo">
          <img :src="firstPhoto" :alt="place.name" class="modal-photo-img" />
        </div>

        <div class="modal-body">
          <p v-if="place.category" class="modal-eyebrow">
            <span class="tag">{{ place.category }}</span>
          </p>

          <h2 :id="`place-modal-title-${place.id}`" class="modal-title">
            {{ place.name }}
          </h2>

          <p v-if="locationLine" class="modal-location">
            <span class="modal-loc-dot">◎</span> {{ locationLine }}
          </p>

          <div class="modal-meta">
            <span v-if="place.visitedAt" class="modal-meta-item">
              <span class="modal-meta-label">방문일</span>
              <span class="modal-meta-value">{{ formatDate(place.visitedAt) }}</span>
            </span>
            <span v-if="place.travelContext" class="modal-meta-item">
              <span class="modal-meta-label">여행</span>
              <span class="modal-meta-value">{{ place.travelContext }}</span>
            </span>
            <span v-if="place.mood" class="modal-meta-item">
              <span class="modal-meta-label">무드</span>
              <span class="modal-meta-value">{{ place.mood }}</span>
            </span>
          </div>

          <div class="modal-sections">
            <section v-if="place.curatorNote" class="modal-section">
              <h3 class="modal-section-title">왜 좋았나요</h3>
              <p class="modal-section-body modal-section-body--quote">
                "{{ place.curatorNote }}"
              </p>
            </section>

            <section v-if="place.highlight" class="modal-section">
              <h3 class="modal-section-title">가장 기억에 남는 것</h3>
              <p class="modal-section-body">◈ {{ place.highlight }}</p>
            </section>

            <section v-if="place.feeling" class="modal-section">
              <h3 class="modal-section-title">그 순간의 감정</h3>
              <p class="modal-section-body modal-section-body--feeling">
                {{ place.feeling }}
              </p>
            </section>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="$emit('edit', place)">수정</button>
            <button class="modal-action-delete" @click="$emit('delete', place.id)">삭제</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ place: Object })
const emit = defineEmits(['close', 'edit', 'delete'])

const firstPhoto = computed(() => {
  try {
    const photos = JSON.parse(props.place.photos || '[]')
    return photos[0]?.url || null
  } catch {
    return null
  }
})

const locationLine = computed(() => {
  const parts = [props.place.city, props.place.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return props.place.address || ''
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ESC 로 닫기 + body 스크롤 잠금
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  animation: modalFadeIn 0.2s ease;
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-dialog {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--card);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: modalSlideUp 0.25s ease;

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}
/* WebKit (Chrome / Safari) — 둥근 border-radius 와 어울리는 얇고 은은한 스크롤바 */
.modal-dialog::-webkit-scrollbar {
  width: 6px;
}
.modal-dialog::-webkit-scrollbar-track {
  background: transparent;
}
.modal-dialog::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 100px;
}
.modal-dialog::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.32);
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  font-size: 13px;
  color: var(--soft);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.modal-close:hover {
  color: var(--ink);
  border-color: var(--hairline-strong);
  background: #fff;
}

.modal-photo {
  width: 100%;
  aspect-ratio: 3 / 2;
  max-height: 420px;
  overflow: hidden;
  background: var(--hairline);
  border-radius: 16px 16px 0 0;
}
.modal-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-body {
  padding: 2rem 2rem 1.75rem;
}
@media (max-width: 600px) {
  .modal-body { padding: 1.5rem 1.25rem 1.25rem; }
}

.modal-eyebrow {
  margin-bottom: 0.65rem;
}

.modal-title {
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 2.8vw, 1.8rem);
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.modal-location {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 1.25rem;
}
.modal-loc-dot {
  font-size: 9px;
  color: var(--faint);
}

.modal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 1.5rem;
}
.modal-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.modal-meta-label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
}
.modal-meta-value {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
}

.modal-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.modal-section-title {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.5rem;
}
.modal-section-body {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text);
  line-height: 1.75;
}
.modal-section-body--quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
  padding-left: 0.75rem;
  border-left: 2px solid var(--hairline);
}
.modal-section-body--feeling {
  font-family: var(--font-sans);
  font-style: italic;
  font-size: 13.5px;
  color: var(--soft);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--hairline);
}
.modal-action-delete {
  font-family: var(--font-sans);
  font-size: 13px;
  background: transparent;
  color: #c66;
  padding: 9px 18px;
  border-radius: 100px;
  border: 1px solid #f0d0d0;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.modal-action-delete:hover {
  color: #b04848;
  border-color: #e0a8a8;
  background: rgba(220, 100, 100, 0.04);
}
</style>
