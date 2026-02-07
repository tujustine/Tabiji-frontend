/**
 * Tests unitaires pour ShareModal
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareModal from "@/components/trip/ShareModal";
import { render as customRender } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../../hooks/useScrollLock", () => ({
  useScrollLock: jest.fn(),
}));

const mockOnClose = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  tripId: "trip-1",
  tripTitle: "Mon voyage",
};

describe("ShareModal", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetAuthStateForTests();
    document.cookie = "";
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("devrait ne rien afficher quand isOpen est false", () => {
    customRender(<ShareModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Partager")).not.toBeInTheDocument();
  });

  it("devrait afficher le contenu quand ouvert et données chargées", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shareLinks: [],
          collaborators: [],
        }),
    });

    customRender(<ShareModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Créer un lien de partage" })
      ).toBeInTheDocument();
    });
  });

  it("devrait appeler onClose au clic sur fermer", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shareLinks: [],
          collaborators: [],
        }),
    });

    customRender(<ShareModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Fermer la modale" })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Fermer la modale" })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
