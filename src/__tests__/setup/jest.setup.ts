import '@testing-library/jest-dom';

// Définir les variables d'environnement pour les tests
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
process.env.NEXT_PUBLIC_API_URL_FALLBACK = process.env.NEXT_PUBLIC_API_URL_FALLBACK || "http://localhost:4000";

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  }));
});

// Configuration globale pour les tests
beforeAll(() => {
  // Configuration initiale avant tous les tests
});

afterAll(() => {
  // Nettoyage après tous les tests
});

beforeEach(() => {
  // Configuration avant chaque test
});

afterEach(() => {
  // Nettoyage après chaque test
  jest.clearAllMocks();
});
