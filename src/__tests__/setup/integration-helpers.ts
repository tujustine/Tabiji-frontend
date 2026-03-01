/**
 * Helpers pour les tests d'intégration.
 * Crée des mocks fetch configurables pour simuler les réponses API.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type FetchMock = (
  url: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export function createFetchMock(
  handlers: Array<{
    url: string | RegExp;
    method?: string;
    response: { ok?: boolean; status?: number; json?: unknown };
  }>
): FetchMock {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    let url: string;
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }
    const method = (init?.method || "GET").toUpperCase();

    for (const h of handlers) {
      const matchesUrl =
        typeof h.url === "string"
          ? url.includes(h.url) || url === h.url || url === `${API_URL}${h.url}`
          : h.url.test(url);
      const matchesMethod = !h.method || h.method.toUpperCase() === method;

      if (matchesUrl && matchesMethod) {
        const { ok = true, status = 200, json } = h.response;
        return {
          ok,
          status,
          json: () => Promise.resolve(json ?? {}),
          text: () => Promise.resolve(JSON.stringify(json ?? {})),
          headers: new Headers(),
        } as Response;
      }
    }

    return {
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Not found" }),
      headers: new Headers(),
    } as Response;
  }) as FetchMock;
}

export function setupAuthFetchMock(
  mockFetch: jest.Mock,
  overrides: {
    userId?: string;
    username?: string;
    email?: string;
    token?: string;
  } = {}
) {
  const user = {
    id: overrides.userId ?? "user-1",
    _id: overrides.userId ?? "user-1",
    username: overrides.username ?? "TestUser",
    email: overrides.email ?? "test@example.com",
    admin: false,
    profilePhoto: undefined,
  };
  const token = overrides.token ?? "mock-token-123";

  mockFetch.mockImplementation((url: string | URL | Request) => {
    let urlStr: string;
    if (typeof url === "string") {
      urlStr = url;
    } else if (url instanceof URL) {
      urlStr = url.toString();
    } else {
      urlStr = url.url;
    }

    if (urlStr.includes("/user/me")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(user),
        headers: new Headers(),
      });
    }
    if (urlStr.includes("/user/favorites") || urlStr.includes("/favorites")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Headers(),
      });
    }
    return Promise.resolve({ ok: false });
  });

  return { user, token };
}
