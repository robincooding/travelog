<template>
  <div class="min-h-screen bg-white">
    <!-- Hero -->
    <div class="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <img :src="logo" alt="Travelog" class="h-16 mb-6" />
      <p class="text-sm text-gray-400 tracking-widest uppercase mb-4">Travel Archive</p>
      <h1 class="text-5xl font-semibold text-gray-900 mb-6 leading-tight">
        여행의 발견을<br>아카이빙하세요
      </h1>
      <p class="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
        카페, 전시, 미식, 성지순례.<br>
        테마를 정하고, 장소를 모으고,<br>
        나만의 컬렉션북으로 만들어보세요.
      </p>
      <RouterLink
        to="/collections"
        class="bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        아카이브 시작하기
      </RouterLink>

      <!-- 테마 예시 태그 -->
      <div class="flex flex-wrap gap-2 justify-center mt-12">
        <span v-for="tag in themes" :key="tag"
          class="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 특징 섹션 -->
    <div class="bg-gray-50 py-20 px-6">
      <div class="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div v-for="feature in features" :key="feature.title" class="text-center">
          <div class="text-3xl mb-4">{{ feature.icon }}</div>
          <h3 class="font-medium text-gray-800 mb-2">{{ feature.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="py-20 px-6 text-center">
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">지금 첫 컬렉션을 만들어보세요</h2>
      <p class="text-gray-500 text-sm mb-8">기록이 쌓이면, 책이 됩니다.</p>
      <RouterLink
        to="/collections/new"
        class="bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        컬렉션 만들기
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import logo from '../assets/logo.png'

const themes = ['카페 아카이브', '전시·미술관', '미식 탐구', '애니 성지순례', '골목 산책', '야경 컬렉션', '서점 투어', '온천 여행']

const features = [
  { icon: '🗂️', title: '테마별 아카이빙', desc: '취향에 맞는 테마를 정하고 여행마다 장소를 쌓아가세요.' },
  { icon: '📍', title: '장소 큐레이션', desc: '왜 좋았는지, 어떤 감정이었는지를 함께 기록하세요.' },
  { icon: '📚', title: '컬렉션북 주문', desc: '쌓인 기록을 나만의 한 권의 책으로 만들어보세요.' },
]
</script>