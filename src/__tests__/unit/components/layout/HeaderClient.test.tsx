/**
 * Tests unitaires pour HeaderClient (Header)
 */

import { screen } from "@testing-library/react";
import HeaderClient from "@/components/layout/HeaderClient";
import { render as customRender } from "@/__tests__/setup/test-utils";

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

jest.mock("../../../../components/layout/NavigationSuspense", () => ({
  __esModule: true,
  default: () => <nav data-testid="navigation">Navigation</nav>,
}));

describe("HeaderClient", () => {
  it("devrait afficher le logo", () => {
    customRender(<HeaderClient />);

    const logos = screen.getAllByAltText("Tabiji Logo");
    expect(logos).toHaveLength(2); // One for desktop, one for mobile
  });

  it("devrait avoir un lien vers la page d'accueil", () => {
    customRender(<HeaderClient />);

    const links = screen.getAllByRole("link", { name: /Tabiji Logo/i });
    expect(links).toHaveLength(2);
    links.forEach(link => {
      expect(link).toHaveAttribute("href", "/");
    });
  });

  it("devrait afficher la navigation", () => {
    customRender(<HeaderClient />);

    const navs = screen.getAllByTestId("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it("devrait avoir un élément header", () => {
    customRender(<HeaderClient />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
