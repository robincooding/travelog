import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// 컬렉션
export const getCollections = () => api.get("/collections");
export const getCollection = (id) => api.get(`/collections/${id}`);
export const createCollection = (data) => api.post("/collections", data);
export const updateCollection = (id, data) =>
  api.put(`/collections/${id}`, data);
export const deleteCollection = (id) => api.delete(`/collections/${id}`);

// 장소
export const createPlace = (data) => api.post("/places", data);
export const updatePlace = (id, data) => api.put(`/places/${id}`, data);
export const deletePlace = (id) => api.delete(`/places/${id}`);

// 이미지 업로드
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteImage = (key) => api.delete("/upload", { data: { key } });

// AI 프로필 생성
export const generateProfile = (collectionId) =>
  api.post(`/ai/profile/${collectionId}`);
