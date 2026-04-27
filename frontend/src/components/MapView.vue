<template>
  <div ref="mapEl" class="map-view" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({ places: Array })
const mapEl = ref(null)
let map = null

onMounted(() => {
  if (!props.places?.length) return

  map = L.map(mapEl.value).setView(
    [props.places[0].lat, props.places[0].lng], 12
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)

  props.places.forEach((place, i) => {
    L.marker([place.lat, place.lng])
      .addTo(map)
      .bindPopup(`<b>${i + 1}. ${place.name}</b><br>${place.curatorNote || ''}`)
  })

  if (props.places.length > 1) {
    const coords = props.places.map(p => [p.lat, p.lng])
    L.polyline(coords, { color: '#1a1a1a', weight: 1.5, dashArray: '4 6' }).addTo(map)
    map.fitBounds(coords, { padding: [30, 30] })
  }
})
</script>

<style scoped>
.map-view {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  border: 1px solid var(--hairline);
  overflow: hidden;
  z-index: 0;
}
</style>
