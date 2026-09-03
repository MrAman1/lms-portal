import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("lms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      Cookies.remove("lms_token");
      Cookies.remove("lms_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
};

export function getCurrentUser(): User | null {
  const raw = Cookies.get("lms_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  Cookies.set("lms_token", token, { expires: 1 });
  Cookies.set("lms_user", JSON.stringify(user), { expires: 1 });
}

export function clearSession() {
  Cookies.remove("lms_token");
  Cookies.remove("lms_user");
}
