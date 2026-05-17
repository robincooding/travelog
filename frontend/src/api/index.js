import axios from "axios";
import { compressImage } from "../lib/imageCompress";

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

// ── 이미지 업로드 (압축 → S3 presigned URL 패턴) ─
// 1) 클라이언트에서 리사이즈 / WebP 변환 / EXIF strip
// 2) 백엔드에 presign URL 요청
// 3) 클라이언트가 S3 에 직접 PUT
//    → 백엔드는 파일을 안 들고, AWS 자격증명도 절대 노출되지 않음
//    → 업로드 트래픽 ↓, EXIF GPS 정보 노출 차단
//
// 호환성을 위해 기존 시그니처 그대로 — 호출부 (CollectionDetail.vue) 는 손대지 않음.
export async function uploadImage(file) {
  // 1) 클라이언트 사이드 최적화 (WebP + 리사이즈 + EXIF strip)
  const compressed = await compressImage(file);

  // 2) presigned PUT URL 발급 — 압축 결과의 ContentType 으로
  const { data } = await api.post("/upload/presign", {
    contentType: compressed.type,
  });

  // 3) S3 에 직접 PUT — 백엔드 경유하지 않음
  //    Content-Type 헤더는 서명 시점과 정확히 일치해야 함 (다르면 SignatureDoesNotMatch)
  const putRes = await fetch(data.uploadUrl, {
    method: "PUT",
    body: compressed,
    headers: { "Content-Type": compressed.type },
  });
  if (!putRes.ok) {
    throw new Error(`S3 업로드 실패: ${putRes.status}`);
  }

  // 사용처가 res.data.url / res.data.key 를 기대 → 같은 형식으로 반환
  return { data: { url: data.publicUrl, key: data.key } };
}

export const deleteImage = (key) => api.delete("/upload", { data: { key } });

// ── AI 프로필 ─────────────────────────────────
export const generateProfile = (collectionId) =>
  api.post(`/ai/profile/${collectionId}`);
