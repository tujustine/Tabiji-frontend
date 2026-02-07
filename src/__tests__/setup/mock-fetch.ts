/**
 * Helper pour mocker les appels fetch dans les tests
 */

export type MockFetchResponse = {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  headers?: Headers;
};

/**
 * Crée un mock global pour fetch avec des réponses configurables
 */
export function createMockFetch() {
  const responses: Map<string, MockFetchResponse> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockFetch = jest.fn((url: string | URL | Request, _init?: RequestInit) => {
    let urlStr: string;
    if (typeof url === "string") urlStr = url;
    else if (url instanceof URL) urlStr = url.toString();
    else urlStr = url.url;
    const response = responses.get(urlStr);

    if (response) {
      return Promise.resolve({
        ok: response.ok ?? true,
        status: response.status ?? 200,
        json: response.json ?? (() => Promise.resolve({})),
        text: response.text ?? (() => Promise.resolve("")),
        headers: response.headers ?? new Headers(),
      });
    }

    // Réponse par défaut si pas de mock configuré
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      headers: new Headers(),
    });
  });

  return {
    mockFetch,
    mockResponse(url: string | RegExp, response: MockFetchResponse) {
      const key = url instanceof RegExp ? url.source : url;
      responses.set(key, response);
      return this;
    },
    mockJson(url: string | RegExp, data: unknown, options: { ok?: boolean; status?: number } = {}) {
      this.mockResponse(url, {
        ok: options.ok ?? true,
        status: options.status ?? 200,
        json: () => Promise.resolve(data),
      });
      return this;
    },
    clear() {
      responses.clear();
      mockFetch.mockClear();
    },
  };
}

/**
 * Mock fetch pour une URL exacte avec un body JSON
 */
export function mockFetchJson(url: string, data: unknown, options: { ok?: boolean; status?: number } = {}) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = jest.fn((input: string | URL | Request) => {
    let urlStr: string;
    if (typeof input === "string") urlStr = input;
    else if (input instanceof URL) urlStr = input.toString();
    else urlStr = input.url;
    if (urlStr.includes(url) || urlStr === url) {
      return Promise.resolve({
        ok: options.ok ?? true,
        status: options.status ?? 200,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Headers(),
      } as Response);
    }
    return originalFetch(input);
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}
