<template>
  <div class="app-root">
    <nav v-if="!hideNav" class="app-nav">
      <div class="app-nav-inner">
        <RouterLink to="/" class="app-nav-logo-link" aria-label="Loci 홈으로">
          <LociLogo class="app-nav-logo" />
        </RouterLink>

        <div class="app-nav-links">
          <template v-if="isAuthenticated">
            <RouterLink to="/collections" class="app-nav-link" active-class="is-active">아카이브</RouterLink>
            <span class="app-nav-user" :title="user.email">
              {{ user.displayName || user.email }}
            </span>
            <button class="app-nav-link app-nav-link-btn" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="app-nav-link" active-class="is-active">로그인</RouterLink>
            <RouterLink to="/register" class="app-nav-link app-nav-link-cta" active-class="is-active">회원가입</RouterLink>
          </template>
        </div>
      </div>
    </nav>

    <main :class="['app-main', { 'app-main--padded': !hideNav }]">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LociLogo from './components/LociLogo.vue'
import { useAuth } from './stores/auth'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

// Landing / 인증 페이지 자체에 nav 가 있거나 디자인상 글로벌 nav 가 겹쳐서 안 보여야 하는 경로
const hideNav = computed(() => ['/', '/login', '/register'].includes(route.path))

async function handleLogout() {
  await logout()
  router.replace('/login')
}
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
  padding: 0.65rem 1.5rem;
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
  height: 28px;
}
.app-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.app-nav-link {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--soft);
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}
.app-nav-link:hover { color: var(--ink); }
.app-nav-link.is-active { color: var(--ink); }

/* 사용자 표시 이름 — 디스플레이만 */
.app-nav-user {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  padding-left: 0.5rem;
  border-left: 1px solid var(--hairline);
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* button 요소를 a 처럼 보이도록 reset */
.app-nav-link-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* 회원가입 CTA — 살짝 강조 */
.app-nav-link-cta {
  padding: 6px 14px;
  border: 1px solid var(--hairline-strong);
  border-radius: 100px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.app-nav-link-cta:hover {
  color: var(--ink);
  border-color: var(--ink);
}

.app-main {
  width: 100%;
}
.app-main--padded {
  padding-top: 0.5rem;
}
</style>
