<template>
  <div class="collections-page">

    <div class="page-header">
      <div class="header-left">
        <p class="header-label">Archive</p>
        <h1 class="header-title">내 아카이브</h1>
      </div>
      <RouterLink to="/collections/new" class="btn-new">+ 새 컬렉션</RouterLink>
    </div>

    <!-- 검색 + 필터 -->
    <div class="filters">
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="search"
          type="search"
          placeholder="제목 / 설명으로 검색"
          class="search-input"
          aria-label="컬렉션 검색"
        />
      </div>

      <div v-if="availableThemes.length" class="theme-chips" role="radiogroup" aria-label="테마 필터">
        <button
          class="chip"
          :class="{ 'is-active': !themeFilter }"
          role="radio"
          :aria-checked="!themeFilter"
          @click="themeFilter = ''"
        >전체</button>
        <button
          v-for="t in availableThemes"
          :key="t"
          class="chip"
          :class="{ 'is-active': themeFilter === t }"
          role="radio"
          :aria-checked="themeFilter === t"
          @click="themeFilter = t"
        >{{ t }}</button>
      </div>
    </div>

    <!-- 첫 페이지 로딩 중 -->
    <div v-if="initialLoading" class="state-empty">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>

    <!-- 결과 없음 -->
    <div v-else-if="collections.length === 0" class="state-empty">
      <p class="empty-icon">◎</p>
      <p class="empty-title">{{ isFiltering ? '조건에 맞는 컬렉션이 없어요' : '아직 컬렉션이 없어요' }}</p>
      <p class="empty-sub">
        {{ isFiltering ? '검색어 / 필터를 바꿔보세요.' : '좋았던 장소들을 첫 컬렉션에 담아보세요.' }}
      </p>
      <RouterLink v-if="!isFiltering" to="/collections/new" class="btn-new">첫 컬렉션 만들기</RouterLink>
    </div>

    <!-- 결과 그리드 -->
    <div v-else class="collections-grid">
      <CollectionCard
        v-for="c in collections"
        :key="c.id"
        :collection="c"
        @delete="handleDelete"
      />
    </div>

    <!-- 무한 스크롤 sentinel — viewport 에 들어오면 다음 페이지 fetch -->
    <div ref="sentinel" class="sentinel" aria-hidden="true">
      <div v-if="loadingMore" class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p v-else-if="!nextCursor && collections.length > 0" class="end-mark">— 끝 —</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getCollections, deleteCollection } from '../api/index.js'
import CollectionCard from '../components/CollectionCard.vue'

const PAGE_SIZE = 12
// hardcoded — 향후 사용자 customize / 동적 추출 가능
const availableThemes = ['카페', '전시', '미식', '미술관', '건축', '자연', '쇼핑', '기타']

const collections = ref([])
const nextCursor = ref(null)
const initialLoading = ref(true)
const loadingMore = ref(false)
const search = ref('')
const themeFilter = ref('')

const sentinel = ref(null)
let observer = null
let searchDebounce = null

const isFiltering = computed(() => Boolean(search.value || themeFilter.value))

// 첫 페이지 / 필터 변경 시 호출 — collections 리셋 후 다시 fetch
async function loadFirstPage() {
  initialLoading.value = true
  collections.value = []
  nextCursor.value = null
  try {
    const { data } = await getCollections({
      limit: PAGE_SIZE,
      search: search.value || undefined,
      theme: themeFilter.value || undefined,
    })
    collections.value = data.items
    nextCursor.value = data.nextCursor
  } finally {
    initialLoading.value = false
  }
}

// sentinel 이 보일 때 다음 페이지 — IntersectionObserver 콜백
async function loadMore() {
  if (loadingMore.value || !nextCursor.value) return
  loadingMore.value = true
  try {
    const { data } = await getCollections({
      cursor: nextCursor.value,
      limit: PAGE_SIZE,
      search: search.value || undefined,
      theme: themeFilter.value || undefined,
    })
    collections.value.push(...data.items)
    nextCursor.value = data.nextCursor
  } finally {
    loadingMore.value = false
  }
}

async function handleDelete(id) {
  if (!confirm('이 컬렉션을 삭제할까요?')) return
  await deleteCollection(id)
  collections.value = collections.value.filter(c => c.id !== id)
}

// 검색 — 입력 멈춘 300ms 후에만 호출 (debounce)
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(loadFirstPage, 300)
})

// theme 필터는 즉시
watch(themeFilter, loadFirstPage)

onMounted(async () => {
  await loadFirstPage()

  // IntersectionObserver — sentinel 이 viewport 에 들어오면 loadMore
  await nextTick()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore()
    },
    { rootMargin: '200px' }, // 200px 전에 미리 fetch — 사용자가 끝에 닿기 전 도착
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<style scoped>
.collections-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 3rem 1.5rem 6rem;
  font-family: var(--font-serif);
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}
.header-label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.5rem;
}
.header-title {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
}

/* ── 검색 / 필터 ── */
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 2rem;
}
.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  opacity: 0.5;
  pointer-events: none;
}
.search-input {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 11px 14px 11px 38px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.search-input::placeholder { color: var(--faint); }

.theme-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ── 결과 그리드 ── */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* ── 무한 스크롤 sentinel ── */
.sentinel {
  margin-top: 2rem;
  padding: 1.5rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}
.end-mark {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--faint);
}

/* ── 빈 상태 / 로딩 ── */
.state-empty {
  padding: 6rem 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.empty-icon {
  font-size: 2rem;
  color: #d4d4d0;
  margin-bottom: 0.5rem;
}
.empty-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--muted);
}
.empty-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  margin-bottom: 0.75rem;
}
.loading-dots {
  display: flex;
  gap: 6px;
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1); }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
