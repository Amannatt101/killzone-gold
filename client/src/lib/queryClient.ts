import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { clearStoredAuthToken, getStoredAuthToken } from "./authToken";
import { getAccessToken, supabase } from "./supabase";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

async function authHeaders(): Promise<Record<string, string>> {
  const localToken = getStoredAuthToken();
  if (localToken) return { Authorization: `Bearer ${localToken}` };
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function redirectIfAuthFailed(res: Response) {
  if (res.status !== 401 && res.status !== 403) return;
  clearStoredAuthToken();
  await supabase.auth.signOut();
  const h = window.location.hash || "";
  if (!h.includes("login")) {
    window.location.hash = "#/login";
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    await redirectIfAuthFailed(res);
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const auth = await authHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      ...auth,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const auth = await authHeaders();
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      headers: auth,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
