/**
 * Tests unitaires pour Modal
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "@/components/modal/Modal";

jest.mock("../../../../hooks/useScrollLock", () => ({
  useScrollLock: jest.fn(),
}));

jest.mock("../../../../middleware", () => ({
  middleware: jest.fn(),
}));

describe("Modal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ne devrait rien rendre quand isOpen est false", () => {
    render(
      <Modal isOpen={false} onClose={onClose}>
        <p>Contenu</p>
      </Modal>
    );
    expect(screen.queryByText("Contenu")).not.toBeInTheDocument();
  });

  it("devrait afficher le contenu quand isOpen est true", () => {
    render(
      <Modal isOpen onClose={onClose}>
        <p>Contenu de la modale</p>
      </Modal>
    );
    expect(screen.getByText("Contenu de la modale")).toBeInTheDocument();
  });

  it("devrait afficher le titre quand fourni", () => {
    render(
      <Modal isOpen onClose={onClose} title="Titre modale">
        <p>Contenu</p>
      </Modal>
    );
    expect(
      screen.getByRole("heading", { name: "Titre modale" })
    ).toBeInTheDocument();
  });

  it("devrait appeler onClose au clic sur le bouton fermer", async () => {
    render(
      <Modal isOpen onClose={onClose} title="Titre">
        <p>Contenu</p>
      </Modal>
    );
    const closeButton = screen.getByRole("button", {
      name: "Fermer la modale",
    });
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("devrait appeler onClose à la touche Escape", () => {
    render(
      <Modal isOpen onClose={onClose}>
        <p>Contenu</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
