<template>
  <div ref="mapEl" class="map-container" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({ places: Array })
const mapEl = ref(null)
let map = null
let markers = []

const categoryConfig = {
  '카페':      { emoji: '☕', color: '#6F4E37', bg: '#FFF8F0' },
  '미술관':    { emoji: '🖼️', color: '#5C6BC0', bg: '#F3F0FF' },
  '식당':      { emoji: '🍽️', color: '#E53935', bg: '#FFF0F0' },
  '숙소':      { emoji: '🏨', color: '#00897B', bg: '#F0FFFE' },
  '쇼핑':      { emoji: '🛍️', color: '#F06292', bg: '#FFF0F5' },
  '자연':      { emoji: '🌿', color: '#43A047', bg: '#F0FFF0' },
  '골목 산책': { emoji: '👣', color: '#8D6E63', bg: '#FFF5F0' },
  'default':   { emoji: '📍', color: '#1B2A4A', bg: '#F0F4FF' },
}

function getConfig(category) {
  return categoryConfig[category] || categoryConfig['default']
}

function moodEmoji(mood) {
  return { '설렘': '✨', '감동': '🥹', '여유': '☕', '아쉬움': '🌧️' }[mood] || ''
}

function createMarkerEl(place) {
  const config = getConfig(place.category)
  const el = document.createElement('div')
  el.className = 'loci-marker'
  el.innerHTML = `
    <div class="marker-pin" style="background:${config.bg}; border-color:${config.color}">
      <span class="marker-emoji">${config.emoji}</span>
    </div>
    <div class="marker-card">
      <p class="marker-name">${place.name}</p>
      ${place.city || place.country ? `<p class="marker-loc">${[place.city, place.country].filter(Boolean).join(', ')}</p>` : ''}
      ${place.curatorNote ? `<p class="marker-note">"${place.curatorNote}"</p>` : ''}
      ${place.mood ? `<span class="marker-mood">${moodEmoji(place.mood)} ${place.mood}</span>` : ''}
    </div>
  `
  return el
}

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

async function initMap() {
  if (!props.places?.length || !mapEl.value) return

  await loadGoogleMaps()

  const { Map } = await google.maps.importLibrary('maps')
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')


  const center = { lat: props.places[0].lat, lng: props.places[0].lng }

  // Note: when mapId is set, map styling is controlled via Google Cloud Console
  // (Map Styles associated with the mapId), not via the styles property here.
  map = new Map(mapEl.value, {
    center,
    zoom: 13,
    mapId: 'loci_map',
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  })

  markers = props.places.map(place => {
    const content = createMarkerEl(place)
    const marker = new AdvancedMarkerElement({
      map,
      position: { lat: place.lat, lng: place.lng },
      content,
      title: place.name,
    })

    content.addEventListener('mouseenter', () => content.classList.add('is-hovered'))
    content.addEventListener('mouseleave', () => content.classList.remove('is-hovered'))

    return marker
  })

  if (props.places.length > 1) {
    const bounds = new google.maps.LatLngBounds()
    props.places.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
    map.fitBounds(bounds, { padding: 60 })
  }
}

onMounted(initMap)

watch(() => props.places, initMap, { deep: true })

onUnmounted(() => {
  markers.forEach(m => m.map = null)
  markers = []
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 340px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.07);
  margin-bottom: 1.5rem;
}
</style>

<style>
.loci-marker {
  position: relative;
  cursor: pointer;
}

.marker-pin {
  width: 40px;
  height: 40px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.marker-emoji {
  transform: rotate(45deg);
  font-size: 18px;
  line-height: 1;
}

.marker-card {
  position: absolute;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 160px;
  max-width: 220px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.07);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  white-space: nowrap;
}

.is-hovered .marker-card {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

.is-hovered .marker-pin {
  transform: rotate(-45deg) scale(1.1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.marker-name {
  font-family: 'Georgia', serif;
  font-size: 13px;
  font-weight: 500;
  color: #111;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.marker-loc {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 11px;
  color: #bbb;
  margin-bottom: 3px;
}

.marker-note {
  font-family: 'Georgia', serif;
  font-size: 11px;
  color: #888;
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 4px;
  white-space: normal;
}

.marker-mood {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 10px;
  color: #aaa;
}
</style>