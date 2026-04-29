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
        <button class="btn-tiny" @click="showPlaceForm ? handleCancelForm() : (showPlaceForm = true)">
          {{ showPlaceForm ? (isEditing ? '편집 취소' : '닫기') : '+ 장소 추가' }}
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
        
        <div>
          <label class="form-label">대표 사진 (선택)</label>
          <div class="photo-upload">
            <div v-if="placeForm.photoUrl" class="photo-preview">
              <img :src="placeForm.photoUrl" alt="미리보기" class="photo-img" />
              <button type="button" class="photo-remove" @click="handleRemovePhoto">✕</button>
            </div>
            <label v-else class="photo-input-label">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="photo-input"
                :disabled="photoUploading"
                @change="handlePhotoUpload"
              />
              <span class="photo-input-text">
                {{ photoUploading ? '업로드 중...' : '+ 사진 추가' }}
              </span>
            </label>
          </div>
        </div>
        
        <div class="place-form-actions">
          <button class="btn-primary" :disabled="!placeForm.name" @click="handleSubmitPlace">
            {{ isEditing ? '저장' : '추가' }}
          </button>
          <button class="btn-secondary" @click="handleCancelForm">취소</button>
        </div>
      </div>

      <!-- 장소 카드 목록 -->
      <div v-if="collection.places?.length" class="places-list">
        <PlaceCard
          v-for="place in collection.places"
          :key="place.id"
          :place="place"
          @delete="handleDeletePlace"
          @edit="handleEditPlace"
          @view="handleViewPlace"
        />
      </div>
      <div v-else class="state-block">
        <span class="state-icon">◎</span>
        <p>아직 추가된 장소가 없어요.</p>
      </div>
    </section>

    <!-- AI 분석 -->
    <AiProfile :collection-id="collection.id" :initial-profile="collection.profile" />

    <!-- 장소 상세 모달 -->
    <PlaceModal
      v-if="viewingPlace"
      :place="viewingPlace"
      @close="viewingPlace = null"
      @edit="handleModalEdit"
      @delete="handleModalDelete"
    />
  </div>

  <div v-else class="page">
    <div class="state-block">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCollection, createPlace, updatePlace, deletePlace, createOrder } from '../api/index.js'
import { uploadImage, deleteImage } from '../api/index.js'
import MapView from '../components/MapView.vue'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceSearch from '../components/PlaceSearch.vue'
import AiProfile from '../components/AiProfile.vue'
import PlaceModal from '../components/PlaceModal.vue'

const route = useRoute()
const router = useRouter()
const collection = ref(null)
const showPlaceForm = ref(false)
const photoUploading = ref(false)

// 편집 모드 상태
const editingPlaceId = ref(null)
const originalPhotoKey = ref(null) // 편집 진입 시 원본 사진 key (저장 시 교체 판단용)
const sessionUploadKey = ref(null) // 이번 세션에서 새로 업로드한 photo key (취소 시 정리용)

// 상세 보기 모달
const viewingPlace = ref(null)

const isEditing = computed(() => editingPlaceId.value !== null)

const emptyForm = () => ({
  name: '', googlePlaceId: '', address: '',
  city: '', country: '', lat: null, lng: null,
  category: '', curatorNote: '', highlight: '',
  feeling: '', mood: '', visitedAt: '', travelContext: '',
  photoUrl: '', photoKey: ''
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

async function handleSubmitPlace() {
  const photos = placeForm.value.photoUrl
    ? JSON.stringify([{ url: placeForm.value.photoUrl, key: placeForm.value.photoKey }])
    : '[]'
  const payload = { ...placeForm.value, photos, collectionId: collection.value.id }

  if (isEditing.value) {
    const res = await updatePlace(editingPlaceId.value, payload)
    const idx = collection.value.places.findIndex(p => p.id === editingPlaceId.value)
    if (idx !== -1) collection.value.places.splice(idx, 1, res.data)
    // 사진이 교체됐으면 원본을 S3 에서 정리
    if (originalPhotoKey.value && originalPhotoKey.value !== placeForm.value.photoKey) {
      deleteImage(originalPhotoKey.value).catch(() => {})
    }
  } else {
    const res = await createPlace(payload)
    collection.value.places.push(res.data)
  }

  resetForm()
}

function handleEditPlace(place) {
  let photoUrl = ''
  let photoKey = ''
  try {
    const photos = JSON.parse(place.photos || '[]')
    photoUrl = photos[0]?.url || ''
    photoKey = photos[0]?.key || ''
  } catch { /* malformed photos json — 무시 */ }

  placeForm.value = {
    name: place.name || '',
    googlePlaceId: place.googlePlaceId || '',
    address: place.address || '',
    city: place.city || '',
    country: place.country || '',
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    category: place.category || '',
    curatorNote: place.curatorNote || '',
    highlight: place.highlight || '',
    feeling: place.feeling || '',
    mood: place.mood || '',
    visitedAt: place.visitedAt ? place.visitedAt.slice(0, 10) : '',
    travelContext: place.travelContext || '',
    photoUrl,
    photoKey,
  }
  editingPlaceId.value = place.id
  originalPhotoKey.value = photoKey || null
  sessionUploadKey.value = null
  showPlaceForm.value = true

  nextTick(() => {
    document.querySelector('.place-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function resetForm() {
  showPlaceForm.value = false
  editingPlaceId.value = null
  originalPhotoKey.value = null
  sessionUploadKey.value = null
  placeForm.value = emptyForm()
}

function handleCancelForm() {
  // 이번 세션에서 업로드한 새 사진이 원본과 다르면 orphan 정리
  if (sessionUploadKey.value && sessionUploadKey.value !== originalPhotoKey.value) {
    deleteImage(sessionUploadKey.value).catch(() => {})
  }
  resetForm()
}

function handleViewPlace(place) {
  viewingPlace.value = place
}

function handleModalEdit(place) {
  viewingPlace.value = null
  handleEditPlace(place)
}

async function handleModalDelete(id) {
  if (!confirm('이 장소를 삭제할까요?')) return
  await deletePlace(id)
  collection.value.places = collection.value.places.filter(p => p.id !== id)
  viewingPlace.value = null
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

async function handlePhotoUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  photoUploading.value = true
  try {
    const res = await uploadImage(file)
    // 같은 세션에서 이미 새 사진을 올렸었다면 그 임시본은 orphan 이므로 즉시 정리
    // (단, 원본과 동일한 키라면 보호)
    if (sessionUploadKey.value && sessionUploadKey.value !== originalPhotoKey.value) {
      deleteImage(sessionUploadKey.value).catch(() => {})
    }
    placeForm.value.photoUrl = res.data.url
    placeForm.value.photoKey = res.data.key
    sessionUploadKey.value = res.data.key
  } catch (err) {
    alert('이미지 업로드에 실패했어요.')
  } finally {
    photoUploading.value = false
  }
}

function handleRemovePhoto() {
  // 폼 상태만 비움. 실제 S3 삭제는 저장 시점(원본 교체) 또는 취소 시점(orphan 정리)에 처리.
  // 단, 이번 세션에서 새로 올렸고 원본과 다른 경우엔 즉시 정리해도 안전 → orphan 즉시 제거.
  if (sessionUploadKey.value && sessionUploadKey.value !== originalPhotoKey.value) {
    deleteImage(sessionUploadKey.value).catch(() => {})
    sessionUploadKey.value = null
  }
  placeForm.value.photoUrl = ''
  placeForm.value.photoKey = ''
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

.photo-upload { margin-top: 0.25rem; }

.photo-preview {
  position: relative;
  width: 120px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--hairline);
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-input { display: none; }

.photo-input-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 90px;
  border: 1px dashed var(--hairline-strong);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.photo-input-label:hover {
  border-color: var(--ink);
  background: rgba(0,0,0,0.02);
}

.photo-input-text {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--soft);
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
