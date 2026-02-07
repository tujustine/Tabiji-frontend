/**
 * Tests unitaires pour MemoriesCanvas
 */

import { screen } from "@testing-library/react";
import MemoriesCanvas from "@/components/memories/MemoriesCanvas";
import { render as customRender } from "@/__tests__/setup/test-utils";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), pathname: "/" }),
}));

jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("react-draggable", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="draggable">{children}</div>
  ),
}));

jest.mock("../../../../hooks/useSocket", () => ({
  useSocket: () => ({
    socket: null,
    isConnected: false,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/useScrollLock", () => ({
  useScrollLock: jest.fn(),
}));

beforeAll(() => {
  globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

const mockOnSave = jest.fn().mockResolvedValue(undefined);

const defaultProps = {
  tripId: "trip-1",
  memories: [],
  onSave: mockOnSave,
  tripTitle: "Mon voyage",
  canEdit: true,
};

describe("MemoriesCanvas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher le titre du voyage", () => {
    customRender(<MemoriesCanvas {...defaultProps} />);

    const titleInput = screen.getByDisplayValue("Mon voyage");
    expect(titleInput).toBeInTheDocument();
  });

  it("devrait afficher le bouton sauvegarder", () => {
    customRender(<MemoriesCanvas {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /Sauvegarder/ })
    ).toBeInTheDocument();
  });

  it("devrait afficher le bouton retour", () => {
    customRender(<MemoriesCanvas {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Retour/ })).toBeInTheDocument();
  });

  it("devrait afficher des boutons d'ajout quand canEdit est true", () => {
    customRender(<MemoriesCanvas {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Texte/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vidéo/ })).toBeInTheDocument();
  });
});
