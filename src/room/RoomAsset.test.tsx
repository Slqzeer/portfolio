import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomAsset } from "./RoomAsset";

describe("RoomAsset", () => {
  it("keeps a labeled fallback in place when artwork fails", () => {
    render(<RoomAsset src="/missing.png" label="Chambre interactive" />);

    fireEvent.error(screen.getByRole("img", { name: "Chambre interactive" }));

    expect(
      screen.getByRole("img", { name: "Chambre interactive indisponible" }),
    ).toBeInTheDocument();
  });
});
