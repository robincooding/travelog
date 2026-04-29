<template>
  <div v-if="collection" class="page">
    <RouterLink to="/collections" class="page-back">← 아카이브</RouterLink>

    <!-- 헤더 -->
    <header class="detail-header">
      <div class="header-text">
        <span class="tag">{{ collection.theme }}</span>
        <h1 class="page-title">{{ collection.title }}</h1>
        <p v-if="collection.description" class="header-desc">{{ collection.description }}</p>
        <p class="header-meta">
          <span class="header-meta-dot">◎</span>
          {{ collection.places?.length || 0 }}개 장소
        </p>
      </div>

      <div class="header-actions">
        <RouterLink :to="`/collections/${collection.id}/edit`" class="btn-secondary">수정</RouterLink>
        <button class="btn-primary" @click="handleOrder">책 주문</button>
      </div>
    </header>

    <!-- 지도 -->
    <MapView v-if="collection.places?.length" :places="collection.places" class="detail-map" />

    <!-- 장소 섹션 -->
    <section class="places-section">
      <div class="places-head">
        <h2 class="section-heading">장소 목록</h2>
        <button class="btn-tiny" @click="showPlaceForm = !showPlaceForm">
          {{ showPlaceForm ? '닫기' : '+ 장소 추가' }}
        </button>
      </div>

      <!-- 장소 추가 폼 -->
      <div v-if="showPlaceForm" class="place-form">
        <PlaceSearch @select="handlePlaceSelect" />

        <div class="form-row">
          <div>
            <label class="form-label">방문일</label>
            <input v-model="placeForm.visitedAt" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">여행 태그</label>
            <input v-model="placeForm.travelContext" type="text" placeholder="예: 2025 도쿄 봄 여행" class="form-input" />
          </div>
        </div>

        <div>
          <label class="form-label">왜 좋았나요?</label>
          <textarea v-model="placeForm.curatorNote" placeholder="이 장소가 특별했던 이유" rows="2" class="form-textarea" />
        </div>

        <div>
          <label class="form-label">가장 기억에 남는 것</label>
          <textarea v-model="placeForm.highlight" placeholder="눈을 감으면 떠오르는 한 장면" rows="2" class="form-textarea" />
        </div>

        <div>
          <label class="form-label">그 순간의 감정</label>
          <input v-model="placeForm.feeling" type="text" placeholder="설레는, 따뜻한, 조용한, 벅찬..." class="form-input" />
        </div>

        <div class="place-form-actions">
          <button class="btn-primary" :disabled="!placeForm.name" @click="handleAddPlace">추가</button>
          <button class="btn-secondary" @click="showPlaceForm = false">취소</button>
        </div>
      </div>

      <!-- 장소 카드 목록 -->
      <div v-if="collection.places?.length" class="places-list">
        <PlaceCard
          v-for="place in collection.places"
          :key="place.id"
          :place="place"
          @delete="handleDeletePlace"
        />
      </div>
      <div v-else class="state-block">
        <span class="state-icon">◎</span>
        <p>아직 추가된 장소가 없어요.</p>
      </div>
    </section>

    <!-- AI 분석 -->
    <AiProfile :collection-id="collection.id" :initial-profile="collection.profile" />
  </div>

  <div v-else class="page">
    <div class="state-block">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCollection, createPlace, deletePlace, createOrder } from '../api/index.js'
import MapView from '../components/MapView.vue'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceSearch from '../components/PlaceSearch.vue'
import AiProfile from '../components/AiProfile.vue'

const route = useRoute()
const router = useRouter()
const collection = ref(null)
const showPlaceForm = ref(false)

const emptyForm = () => ({
  name: '', googlePlaceId: '', address: '',
  city: '', country: '', lat: null, lng: null,
  category: '', curatorNote: '', highlight: '',
  feeling: '', mood: '', visitedAt: '', travelContext: ''
})

const placeForm = ref(emptyForm())

onMounted(async () => {
  const res = await getCollection(route.params.id)
  collection.value = res.data
})

function handlePlaceSelect(place) {
  placeForm.value = {
    ...placeForm.value,
    name: place.name,
    googlePlaceId: place.googlePlaceId,
    address: place.address,
    city: place.city,
    country: place.country,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
  }
}

async function handleAddPlace() {
  const res = await createPlace({ ...placeForm.value, collectionId: collection.value.id })
  collection.value.places.push(res.data)
  showPlaceForm.value = false
  placeForm.value = emptyForm()
}

async function handleDeletePlace(id) {
  if (!confirm('이 장소를 삭제할까요?')) return
  await deletePlace(id)
  collection.value.places = collection.value.places.filter(p => p.id !== id)
}

async function handleOrder() {
  const bookTitle = prompt('책 제목을 입력해주세요', `${collection.value.title} 컬렉션북`)
  if (!bookTitle) return
  await createOrder({ collectionId: collection.value.id, bookTitle, size: 'A5' })
  router.push('/orders')
}
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--hairline);
}
.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.header-text .tag { align-self: flex-start; }
.header-desc {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--muted);
  line-height: 1.7;
  max-width: 60ch;
}
.header-meta {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 5px;
}
.header-meta-dot { font-size: 10px; color: var(--faint); }
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.detail-map { margin-bottom: 2.5rem; }

.places-section { margin-bottom: 2.5rem; }
.places-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.place-form {
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.place-form-actions {
  display: flex;
  gap: 8px;
  padding-top: 0.25rem;
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

@media (max-width: 600px) {
  .detail-header {
    flex-direction: column;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions > * { flex: 1; text-align: center; }
}
</style>
