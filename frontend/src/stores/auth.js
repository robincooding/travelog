import { ref, computed } from "vue";
import * as api from "../api";

/**
 * 전역 인증 상태 — 모듈 스코프 ref 라서 모든 컴포넌트가 같은 인스턴스 공유.
 *
 * 사용법:
 *   import { useAuth } from '@/stores/auth'
 *   const { user, isAuthenticated, login, logout } = useAuth()
 */

const user = ref(null);
// 첫 페이지 로드 시 /me 호출이 끝나기 전까지 라우트 가드가 잘못 redirect 하지 않도록
// "아직 초기 인증 상태 확인 안 됨" 을 표현하는 플래그
const initialized = ref(false);

const isAuthenticated = computed(() => user.value !== null);

// 부팅 시 호출 — 쿠키가 살아 있으면 사용자 정보 복원.
// 라우트 가드 / App.vue / 어디서 동시에 호출되어도 fetchMe 는 1번만 (promise 캐시).
let bootstrapPromise = null;
function bootstrap() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const { data } = await api.fetchMe();
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      initialized.value = true;
    }
  })();
  return bootstrapPromise;
}

async function login(email, password) {
  const { data } = await api.login({ email, password });
  user.value = data.user;
  return data.user;
}

async function register({ email, password, displayName }) {
  const { data } = await api.register({ email, password, displayName });
  user.value = data.user;
  return data.user;
}

async function logout() {
  try {
    await api.logout();
  } finally {
    // 서버 호출 실패해도 클라이언트 상태는 무조건 비움
    user.value = null;
  }
}

// 계정 설정 — 응답으로 갱신된 user 를 그대로 store 에 반영
async function updateDisplayName(displayName) {
  const { data } = await api.updateDisplayName(displayName);
  user.value = data.user;
  return data.user;
}

async function changePassword(currentPassword, newPassword) {
  await api.changePassword(currentPassword, newPassword);
}

async function deleteAccount(password) {
  await api.deleteAccount(password);
  user.value = null;
}

// axios 인터셉터에서 401 만나면 호출 — 만료 / 강제 로그아웃 등 케이스
function clearOnUnauthorized() {
  user.value = null;
}

// 인터셉터에 핸들러 등록 (모듈 로드 시 1회)
api.setUnauthorizedHandler(clearOnUnauthorized);

export function useAuth() {
  return {
    user,
    initialized,
    isAuthenticated,
    bootstrap,
    login,
    register,
    logout,
    updateDisplayName,
    changePassword,
    deleteAccount,
  };
}
