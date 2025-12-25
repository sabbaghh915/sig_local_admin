const API_BASE_URL =
  (import.meta.env.VITE_API_URL?.replace(/\/$/, "")) || "http://localhost:3000/api";

const getToken = () =>
  localStorage.getItem("authToken") || localStorage.getItem("token");

const unwrapArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.vehicles)) return res.vehicles;
  if (Array.isArray(res?.payments)) return res.payments;
  return res; // إذا مو Array خليه كما هو (مفيد للـ create/update)
};

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = getToken();

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  
  if (!options.method || options.method === "GET") return unwrapArray(data);

  return data;
};

export const adminApi = {
  getSyrianVehicles: () => apiFetch("/vehicles?vehicleType=syrian"),
  getForeignVehicles: () => apiFetch("/vehicles?vehicleType=foreign"),
  getPayments: () => apiFetch("/payments?populate=1"),
  getUsers: () => apiFetch("/admin/users"),
  createUser: (form: any) =>
    apiFetch("/admin/users", { method: "POST", body: JSON.stringify(form) }),
  deleteUser: (id: string) =>
    apiFetch(`/admin/users/${id}`, { method: "DELETE" }),
};
