<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <p class="font-medium text-gray-800 text-sm">{{ place.name }}</p>
          <span v-if="place.mood" class="text-xs text-gray-400">{{ moodEmoji }}</span>
        </div>
        <p v-if="place.address" class="text-xs text-gray-400 mb-1">
          📍 {{ place.city ? `${place.city}, ` : '' }}{{ place.country || place.address }}
        </p>
        <p v-if="place.curatorNote" class="text-sm text-gray-500 mt-1 italic">"{{ place.curatorNote }}"</p>
        <div class="flex items-center gap-3 mt-2">
          <span v-if="place.category" class="text-xs border border-gray-100 rounded-full px-2 py-0.5 text-gray-400">{{ place.category }}</span>
          <span v-if="place.travelContext" class="text-xs text-gray-300">{{ place.travelContext }}</span>
          <span class="text-xs text-gray-300">{{ formatDate(place.visitedAt) }}</span>
        </div>
      </div>
      <button @click="$emit('delete', place.id)"
        class="text-gray-200 hover:text-red-400 transition-colors ml-3 text-sm mt-0.5">✕</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ place: Object })
defineEmits(['delete'])

const moodEmoji = computed(() => ({
  '설렘': '✨', '감동': '🥹', '여유': '☕', '아쉬움': '🌧️'
})[props.place.mood] || '')

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>