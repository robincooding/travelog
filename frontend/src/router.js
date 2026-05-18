import { createRouter, createWebHistory } from "vue-router";
import Landing from "./views/Landing.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import ForgotPassword from "./views/ForgotPassword.vue";
import ResetPassword from "./views/ResetPassword.vue";
import CollectionList from "./views/CollectionList.vue";
import CollectionDetail from "./views/CollectionDetail.vue";
import CollectionForm from "./views/CollectionForm.vue";
import AccountSettings from "./views/AccountSettings.vue";
import { useAuth } from "./stores/auth";

const routes = [
  { path: "/", component: Landing },
  { path: "/login", component: Login, meta: { guestOnly: true } },
  { path: "/register", component: Register, meta: { guestOnly: true } },
  { path: "/forgot-password", component: ForgotPassword, meta: { guestOnly: true } },
  { path: "/reset-password", component: ResetPassword, meta: { guestOnly: true } },
  { path: "/collections", component: CollectionList, meta: { requiresAuth: true } },
  { path: "/collections/new", component: CollectionForm, meta: { requiresAuth: true } },
  { path: "/collections/:id", component: CollectionDetail, meta: { requiresAuth: true } },
  { path: "/collections/:id/edit", component: CollectionForm, meta: { requiresAuth: true } },
  { path: "/account", component: AccountSettings, meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

// 인증 가드 — 모든 라우트 이동 전 실행
router.beforeEach(async (to) => {
  const auth = useAuth();

  // 첫 페이지 진입 시 fetchMe 가 끝날 때까지 대기 (쿠키 기반 자동 복원)
  if (!auth.initialized.value) {
    await auth.bootstrap();
  }

  // 인증 필요 페이지인데 비로그인 → 로그인 페이지로 + 원래 가려던 경로를 query 에 보존
  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // 게스트 전용 페이지(/login, /register) 인데 이미 로그인 → 컬렉션으로
  if (to.meta.guestOnly && auth.isAuthenticated.value) {
    return { path: "/collections" };
  }
});

export default router;
