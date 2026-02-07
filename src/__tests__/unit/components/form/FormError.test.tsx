/**
 * Tests unitaires pour FormError
 */

import { render, screen } from "@testing-library/react";
import FormError from "@/components/form/FormError";

describe("FormError", () => {
  it("devrait afficher le message d'erreur quand error est fourni", () => {
    render(<FormError error="Email requis" />);
    expect(screen.getByText("Email requis")).toBeInTheDocument();
  });

  it("devrait ne rien afficher quand error est null", () => {
    const { container } = render(<FormError error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("devrait ne rien afficher quand error est undefined", () => {
    const { container } = render(<FormError />);
    expect(container.firstChild).toBeNull();
  });

  it("devrait appliquer les styles d'erreur", () => {
    const { container } = render(<FormError error="Erreur" />);
    const wrapper = container.querySelector(".bg-red-50");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("border-red-200");
  });
});
