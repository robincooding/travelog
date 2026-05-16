import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  // httpOnly 쿠키가 모든 요청에 자동 첨부되도록 — 없으면 매번 401
  withCredentials: true,
});

// 401 응답 시 사용자 상태를 자동으로 정리하기 위한 hook
// (실제 store 가 등록한 핸들러를 stores/auth.js 가 setUnauthorizedHandler 로 주입)
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      // 라우트 가드 / 리다이렉트는 router 영역에서 (Step 8). 여기선 상태만 정리.
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ── 인증 ──────────────────────────────────────
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const fetchMe = () => api.get("/auth/me");
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) =>
  api.post("/auth/reset-password", { token, newPassword });

// ── 컬렉션 ─────────────────────────────────────
export const getCollections = () => api.get("/collections");
export const getCollection = (id) => api.get(`/collections/${id}`);
export const createCollection = (data) => api.post("/collections", data);
export const updateCollection = (id, data) =>
  api.put(`/collections/${id}`, data);
export const deleteCollection = (id) => api.delete(`/collections/${id}`);

// ── 장소 ──────────────────────────────────────
export const createPlace = (data) => api.post("/places", data);
export const updatePlace = (id, data) => api.put(`/places/${id}`, data);
export const deletePlace = (id) => api.delete(`/places/${id}`);

// ── 이미지 업로드 ──────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteImage = (key) => api.delete("/upload", { data: { key } });

// ── AI 프로필 ─────────────────────────────────
export const generateProfile = (collectionId) =>
  api.post(`/ai/profile/${collectionId}`);
