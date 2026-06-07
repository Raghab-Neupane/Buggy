const API_BASE_URL = "http://localhost:8000";

class ApiClient {
  private static handleUnauthorized() {
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    // Redirect if we are not already on the login page to avoid redirect loops
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Try parsing as JSON. If empty body or text, return as typed T or text
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  public static async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  public static async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers || {});
    let requestBody = body;

    if (body && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }

    return this.request<T>(path, {
      ...options,
      method: "POST",
      headers,
      body: requestBody,
    });
  }
}

export default ApiClient;
