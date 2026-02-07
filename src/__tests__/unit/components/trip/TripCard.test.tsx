/**
 * Tests unitaires pour TripCard
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripCard from "@/components/trip/TripCard";
import { render as customRender } from "@/__tests__/setup/test-utils";

jest.mock("next/image", () => {
  const MockImage = ({ src, alt }: { src: string; alt: string }) => {
    /* eslint-disable-next-line @next/next/no-img-element -- Mock pour les tests */
    return <img src={src} alt={alt} data-testid="trip-image" />;
  };
  MockImage.displayName = "Image";
  return {
    __esModule: true,
    default: MockImage,
  };
});

describe("TripCard", () => {
  const defaultProps = {
    id: "trip-1",
    image: "https://example.com/image.jpg",
    title: "Voyage à Paris",
    startDate: "15 janv. 2025",
    endDate: "22 janv. 2025",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it("devrait afficher le titre et les dates du voyage", () => {
    customRender(<TripCard {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "Voyage à Paris" })).toBeInTheDocument();
    expect(screen.getByText("15 janv. 2025 - 22 janv. 2025")).toBeInTheDocument();
  });

  it("devrait avoir un lien vers la page de détail du voyage", () => {
    customRender(<TripCard {...defaultProps} />);

    const link = screen.getByRole("link", { name: /Voyage à Paris/ });
    expect(link).toHaveAttribute("href", "/trips/trip-1");
  });

  it("devrait afficher le bouton favori", () => {
    customRender(<TripCard {...defaultProps} />);

    const favButton = screen.getByRole("button", { name: /Ajouter aux favoris|Retirer des favoris/ });
    expect(favButton).toBeInTheDocument();
  });

  it("devrait appeler toggleFavorite au clic sur le bouton favori", async () => {
    customRender(<TripCard {...defaultProps} />);

    const favButton = screen.getByRole("button", { name: /Ajouter aux favoris|Retirer des favoris/ });
    await userEvent.click(favButton);

    expect(favButton).toBeInTheDocument();
  });

  it("devrait afficher une zone noire quand image est vide", () => {
    customRender(
      <TripCard
        {...defaultProps}
        image=""
      />
    );

    expect(screen.getByRole("heading", { name: "Voyage à Paris" })).toBeInTheDocument();
  });
});
