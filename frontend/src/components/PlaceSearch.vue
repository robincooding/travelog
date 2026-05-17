<template>
  <div class="place-search">
    <label class="form-label">장소 검색</label>
    <input
      v-model="query"
      type="text"
      placeholder="장소명으로 검색 (예: Tim Hortons, 루브르 박물관)"
      class="form-input"
      @input="handleInput"
    />
    <ul v-if="suggestions.length" class="suggestion-list">
      <li
        v-for="s in suggestions"
        :key="s.placeId"
        class="suggestion-item"
        @click="handleSelect(s)"
      >
        <p class="suggestion-main">{{ s.mainText || s.fullText }}</p>
        <p class="suggestion-sub">{{ s.secondaryText }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'

const emit = defineEmits(['select'])
const query = ref('')
const suggestions = ref([])
let debounceTimer = null
// 같은 사용자 세션 안에서 token 을 공유해야 자동완성 + 상세 조회가 1건 청구로 묶임 (비용 절감)
let sessionToken = null

function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve()
  if (!window.__lociMapsLoader) {
    window.__lociMapsLoader = new Promise((resolve) => {
      // With loading=async, only the `callback` param reliably signals
      // that google.maps.importLibrary is ready. script.onload is too early.
      window.__lociMapsInit = resolve
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=maps,marker,places&v=beta&callback=__lociMapsInit&loading=async`
      document.head.appendChild(script)
    })
  }
  return window.__lociMapsLoader
}

async function ensurePlacesLib() {
  await loadGoogleMaps()
  return window.google.maps.importLibrary('places')
}

async function handleInput() {
  clearTimeout(debounceTimer)
  if (!query.value || query.value.length < 2) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const { AutocompleteSuggestion, AutocompleteSessionToken } = await ensurePlacesLib()
      if (!sessionToken) sessionToken = new AutocompleteSessionToken()

      const { suggestions: results } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query.value,
          sessionToken,
        })

      // SDK 의 PlacePrediction 객체는 내부 getter (placeId 등) 가 minified
      // 내부 상태에 의존 → Vue 의 reactive proxy 가 감싸면 깨짐.
      // ① 표시용 텍스트는 plain string 으로 추출
      // ② toPlace() 호출에 필요한 SDK 객체는 markRaw 로 reactive 변환을 skip
      // ③ 일반 검색어만 있는 queryPrediction (placePrediction 없음) 은 거름
      suggestions.value = (results || [])
        .filter((s) => s.placePrediction)
        .map((s) => ({
          placeId: s.placePrediction.placeId,
          mainText: s.placePrediction.structuredFormat?.mainText?.text || '',
          secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
          fullText: s.placePrediction.text?.text || '',
          _prediction: markRaw(s.placePrediction),
        }))
    } catch (e) {
      console.error('[PlaceSearch] fetchAutocompleteSuggestions failed:', e)
      suggestions.value = []
    }
  }, 300)
}

async function handleSelect(suggestion) {
  try {
    await ensurePlacesLib()

    // 1) markRaw 로 보관한 원본 PlacePrediction 으로부터 Place 객체 생성
    //    (sessionToken 이 embedded 되어 있어 자동완성+상세조회가 1건 청구로 묶임)
    const place = suggestion._prediction.toPlace()

    // 2) 필요한 필드만 명시해서 가져오기 (field mask — 청구 단위 통제)
    await place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'types'],
    })

    // 자동완성 + 상세 조회가 한 세션 묶음으로 청구되었으므로 토큰 재사용 종료
    sessionToken = null

    const addressComponents = place.addressComponents || []
    const city = addressComponents.find((c) => c.types.includes('locality'))?.longText || ''
    const country = addressComponents.find((c) => c.types.includes('country'))?.longText || ''
    const category = getCategory(place.types || [])

    emit('select', {
      name: place.displayName,
      googlePlaceId: place.id,
      address: place.formattedAddress,
      city,
      country,
      lat: place.location.lat(),
      lng: place.location.lng(),
      category,
    })
    query.value = place.displayName
    suggestions.value = []
  } catch (e) {
    console.error('[PlaceSearch] place.fetchFields failed:', e)
  }
}

function getCategory(types) {
  if (types.includes('cafe') || types.includes('bakery')) return '카페'
  if (types.includes('restaurant') || types.includes('food')) return '식당'
  if (types.includes('museum') || types.includes('art_gallery')) return '미술관'
  if (types.includes('lodging')) return '숙소'
  if (types.includes('store') || types.includes('shopping_mall')) return '쇼핑'
  if (types.includes('park') || types.includes('natural_feature')) return '자연'
  return '장소'
}
</script>

<style scoped>
.place-search { position: relative; }

.suggestion-list {
  position: absolute;
  z-index: 10;
  width: 100%;
  margin-top: 4px;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-height: 240px;
  overflow-y: auto;
  list-style: none;
}
.suggestion-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--hairline);
  transition: background 0.15s;
}
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: rgba(0, 0, 0, 0.02); }

.suggestion-main {
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 2px;
}
.suggestion-sub {
  font-family: var(--font-sans);
  font-size: 11.5px;
  color: var(--soft);
}
</style>
