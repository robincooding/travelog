<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="!isLanding" class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <RouterLink to="/">
          <img :src="logo" alt="Travelog" class="h-8" />
        </RouterLink>
        <div class="flex gap-6 text-sm">
          <RouterLink to="/collections" class="text-gray-600 hover:text-gray-900 transition-colors">아카이브</RouterLink>
          <RouterLink to="/orders" class="text-gray-600 hover:text-gray-900 transition-colors">주문</RouterLink>
        </div>
      </div>
    </nav>
    <main :class="isLanding ? '' : 'max-w-4xl mx-auto px-6 py-8'">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import logo from './assets/logo.png'

const route = useRoute()
const isLanding = computed(() => route.path === '/')
</script>