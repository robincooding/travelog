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

// 주문
export const getOrders = () => api.get("/orders");
export const createOrder = (data) => api.post("/orders", data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// AI 프로필 생성
export const generateProfile = (collectionId) =>
  api.post(`/ai/profile/${collectionId}`);

// Exporting orders
export const exportOrder = (orderId) => api.get(`/export/${orderId}`);
