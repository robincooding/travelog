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
        :key="s.place_id"
        class="suggestion-item"
        @click="handleSelect(s)"
      >
        <p class="suggestion-main">{{ s.structured_formatting?.main_text || s.description }}</p>
        <p class="suggestion-sub">{{ s.structured_formatting?.secondary_text || '' }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select'])
const query = ref('')
const suggestions = ref([])
let debounceTimer = null
let autocompleteService = null
let placesService = null

function loadGoogleMaps() {
  return new Promise((resolve) => {
    if (window.google) return resolve()
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places`
    script.onload = resolve
    document.head.appendChild(script)
  })
}

async function handleInput() {
  clearTimeout(debounceTimer)
  if (!query.value || query.value.length < 2) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    await loadGoogleMaps()
    if (!autocompleteService) {
      autocompleteService = new window.google.maps.places.AutocompleteService()
    }
    autocompleteService.getPlacePredictions(
      { input: query.value },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          suggestions.value = predictions || []
        }
      }
    )
  }, 300)
}

async function handleSelect(suggestion) {
  await loadGoogleMaps()
  if (!placesService) {
    const div = document.createElement('div')
    placesService = new window.google.maps.places.PlacesService(div)
  }
  placesService.getDetails(
    { placeId: suggestion.place_id, fields: ['name', 'geometry', 'formatted_address', 'address_components', 'types'] },
    (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const addressComponents = place.address_components || []
        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name || ''
        const country = addressComponents.find(c => c.types.includes('country'))?.long_name || ''
        const category = getCategory(place.types || [])

        emit('select', {
          name: place.name,
          googlePlaceId: suggestion.place_id,
          address: place.formatted_address,
          city,
          country,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          category,
        })
        query.value = place.name
        suggestions.value = []
      }
    }
  )
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
