<template>
  <div class="app-root">
    <nav v-if="!isLanding" class="app-nav">
      <div class="app-nav-inner">
        <RouterLink to="/" class="app-nav-logo-link" aria-label="Loci 홈으로">
          <LociLogo class="app-nav-logo" />
        </RouterLink>
        <div class="app-nav-links">
          <RouterLink to="/collections" class="app-nav-link" active-class="is-active">아카이브</RouterLink>
          <RouterLink to="/orders" class="app-nav-link" active-class="is-active">주문</RouterLink>
        </div>
      </div>
    </nav>

    <main :class="['app-main', { 'app-main--padded': !isLanding }]">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LociLogo from './components/LociLogo.vue'

const route = useRoute()
const isLanding = computed(() => route.path === '/')
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-serif);
}

.app-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(250, 250, 248, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.app-nav-inner {
  max-width: 920px;
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.app-nav-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--ink);
  transition: opacity 0.2s;
}
.app-nav-logo-link:hover { opacity: 0.7; }
.app-nav-logo {
  display: inline-block;
  height: 22px;
}
.app-nav-links {
  display: flex;
  gap: 1.5rem;
}
.app-nav-link {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}
.app-nav-link:hover { color: var(--ink); }
.app-nav-link.is-active { color: var(--ink); }

.app-main {
  width: 100%;
}
.app-main--padded {
  padding-top: 0.5rem;
}
</style>
