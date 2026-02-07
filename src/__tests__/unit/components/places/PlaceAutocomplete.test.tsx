/**
 * Tests unitaires pour PlaceAutocomplete
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaceAutocomplete from "@/components/places/PlaceAutocomplete";

describe("PlaceAutocomplete", () => {
  const onSelect = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("devrait afficher l'input de recherche avec le placeholder", () => {
    render(
      <PlaceAutocomplete onSelect={onSelect} placeholder="Rechercher un lieu..." />
    );

    expect(screen.getByPlaceholderText("Rechercher un lieu...")).toBeInTheDocument();
  });

  it("devrait accepter la saisie utilisateur", async () => {
    render(<PlaceAutocomplete onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(/Rechercher une adresse/);
    await userEvent.type(input, "Paris");

    expect(input).toHaveValue("Paris");
  });

  it("devrait afficher le placeholder par défaut", () => {
    render(<PlaceAutocomplete onSelect={onSelect} />);

    expect(screen.getByPlaceholderText("Rechercher une adresse ou un lieu...")).toBeInTheDocument();
  });
});
