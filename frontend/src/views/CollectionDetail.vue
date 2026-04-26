<template>
  <div v-if="collection">
    <!-- 헤더 -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <RouterLink to="/collections" class="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">← 아카이브</RouterLink>
        <h1 class="text-2xl font-semibold text-gray-800">{{ collection.title }}</h1>
        <p class="text-sm text-gray-500 mt-1">
          <span class="border border-gray-200 rounded-full px-2 py-0.5 text-xs mr-2">{{ collection.theme }}</span>
          {{ collection.places?.length || 0 }}개 장소
        </p>
        <p v-if="collection.description" class="text-sm text-gray-400 mt-1">{{ collection.description }}</p>
      </div>
      <div class="flex gap-2">
        <RouterLink :to="`/collections/${collection.id}/edit`"
          class="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">수정</RouterLink>
        <button @click="handleOrder"
          class="text-sm px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700">📚 책 주문</button>
      </div>
    </div>

    <!-- 지도 -->
    <MapView v-if="collection.places?.length" :places="collection.places" class="mb-6" />

    <!-- 장소 추가 -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-medium text-gray-700">장소 목록</h2>
        <button @click="showPlaceForm = !showPlaceForm"
          class="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          {{ showPlaceForm ? '닫기' : '+ 장소 추가' }}
        </button>
      </div>

      <!-- 장소 추가 폼 -->
      <div v-if="showPlaceForm" class="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
        <!-- Google Places 검색 -->
        <PlaceSearch @select="handlePlaceSelect" />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">방문일</label>
            <input v-model="placeForm.visitedAt" type="date"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">방문 맥락</label>
            <input v-model="placeForm.travelContext" type="text" placeholder="2025 도쿄 봄 여행"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
        </div>

        <div>
          <label class="text-xs text-gray-500 mb-1 block">큐레이션 메모</label>
          <textarea v-model="placeForm.curatorNote" placeholder="왜 좋았는지 한 줄로" rows="2"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>

        <div>
          <label class="text-xs text-gray-500 mb-2 block">감정 태그</label>
          <div class="flex gap-2">
            <button v-for="m in moods" :key="m.value" type="button"
              @click="placeForm.mood = m.value"
              :class="placeForm.mood === m.value ? 'bg-gray-800 text-white' : 'border border-gray-200 text-gray-600'"
              class="text-xs px-3 py-1.5 rounded-full transition-colors">
              {{ m.label }}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="handleAddPlace"
            :disabled="!placeForm.name"
            class="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40">추가</button>
          <button @click="showPlaceForm = false"
            class="text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600">취소</button>
        </div>
      </div>

      <!-- 장소 카드 목록 -->
      <div v-if="collection.places?.length" class="space-y-3">
        <PlaceCard
          v-for="place in collection.places"
          :key="place.id"
          :place="place"
          @delete="handleDeletePlace"
        />
      </div>
      <div v-else class="text-center py-10 text-gray-400 text-sm">
        아직 추가된 장소가 없어요.
      </div>
    </div>

    <!-- AI 분석 -->
    <AiProfile :collection-id="collection.id" :initial-profile="collection.profile" />
  </div>
  <div v-else class="text-center py-20 text-gray-400">불러오는 중...</div>
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

const moods = [
  { value: '설렘', label: '✨ 설렘' },
  { value: '감동', label: '🥹 감동' },
  { value: '여유', label: '☕ 여유' },
  { value: '아쉬움', label: '🌧️ 아쉬움' },
]

const placeForm = ref({
  name: '', googlePlaceId: '', address: '',
  city: '', country: '', lat: null, lng: null,
  category: '', curatorNote: '', mood: '', visitedAt: '', travelContext: ''
})

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
  placeForm.value = {
    name: '', googlePlaceId: '', address: '',
    city: '', country: '', lat: null, lng: null,
    category: '', curatorNote: '', mood: '', visitedAt: '', travelContext: ''
  }
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