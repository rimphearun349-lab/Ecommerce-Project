import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const saved = JSON.parse(localStorage.getItem("auth") || "null");
      if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`;
    } catch {
      
    }
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !isAuthCall &&
      localStorage.getItem("auth")
    ) {
      localStorage.removeItem("auth");
      window.location.assign(`/login?expired=1&next=${encodeURIComponent(window.location.pathname)}`);
    }
    return Promise.reject(error);
  }
);


function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

export function getErrorMessage(error) {
  const response = error?.response;
  if (response) {
    if (response.data?.message) return response.data.message;
    if (response.status === 401) return "Please log in to continue.";
    if (response.status === 403) return "You do not have permission to perform this action.";
    return `Server error (${response.status}).`;
  }
  if (error?.code === "ECONNABORTED") return "The server took too long to respond.";
  return "Cannot reach the server. Is the Spring Boot API running?";
}

export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors ?? {};
}

// ----- Products -----
export async function getProducts() {
  const response = await api.get("/products", { params: { size: 100 } });
  return toList(response.data);
}

export async function getProduct(id) {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

// ----- Categories -----
export async function getCategories() {
  const response = await api.get("/categories");
  return toList(response.data);
}

// ----- Reviews -----
export async function getReviews(productId) {
  const response = await api.get(`/products/${productId}/reviews`);
  return toList(response.data);
}

// ----- Auth -----
export async function loginRequest(usernameOrEmail, password) {
  const response = await api.post("/auth/login", { usernameOrEmail, password });
  return response.data; 
}

export async function registerRequest(username, email, password) {
  const response = await api.post("/auth/register", { username, email, password });
  return response.data;
}

// ----- Customer: orders & payments -----
export async function createOrder(items) {
  return (await api.post("/orders", { items })).data;
}

export async function payOrder(orderId, method) {
  return (await api.post("/payments", { orderId, method })).data;
}

export async function getAbaStatus() {
  return (await api.get("/payments/aba/status")).data;
}

export async function startAbaCheckout(orderId) {
  return (await api.post("/payments/aba/checkout", { orderId })).data;
}

export async function startKhqr(orderId) {
  return (await api.post("/payments/aba/khqr", { orderId })).data;
}

export async function confirmAbaPayment(orderId) {
  return (await api.post("/payments/aba/confirm", { orderId })).data;
}

export async function cancelOrder(id) {
  return (await api.put(`/orders/${id}/cancel`)).data;
}

// ----- Admin: dashboard & users -----
export async function getAdminStats() {
  return (await api.get("/admin/stats")).data;
}

export async function getUsers() {
  return toList((await api.get("/admin/users")).data);
}

// ----- Admin: products & categories -----
export async function saveProduct(id, product) {
  const response = id ? await api.put(`/products/${id}`, product) : await api.post("/products", product);
  return response.data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}

export async function saveCategory(id, name) {
  const response = id ? await api.put(`/categories/${id}`, { name }) : await api.post("/categories", { name });
  return response.data;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}

// ----- Admin: orders & payments -----
export async function getOrders() {
  return toList((await api.get("/orders")).data);
}

export async function updateOrderStatus(id, status) {
  return (await api.put(`/orders/${id}/status`, { status })).data;
}

export async function getPayments() {
  return toList((await api.get("/payments")).data);
}

export async function updatePaymentStatus(id, status) {
  return (await api.put(`/payments/${id}/status`, { status })).data;
}

export default api;