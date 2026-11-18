import { describe, expect, it } from "vitest";
import { describeReviewReasons, teamEditReviewReasons } from "@/features/teams/lib/editNeedsReview";

const base = { isAdmin: false, originalTeamName: "Pixel Pioneers", teamName: "Pixel Pioneers", newLogo: false };

describe("teamEditReviewReasons (BG-38)", () => {
  it("cambiar descripción, video, repositorio o fotos no devuelve el juego a pendiente", () => {
    expect(teamEditReviewReasons(base)).toEqual([]);
  });

  it("cambiar el nombre del equipo sí", () => {
    expect(teamEditReviewReasons({ ...base, teamName: "Pixel Pioneers 2" })).toEqual(["teamName"]);
  });

  it("los espacios de los extremos no cuentan como cambio, igual que en el back", () => {
    expect(teamEditReviewReasons({ ...base, teamName: "  Pixel Pioneers " })).toEqual([]);
  });

  it("un logo nuevo también lo devuelve, como en el back", () => {
    expect(teamEditReviewReasons({ ...base, newLogo: true })).toEqual(["logo"]);
    expect(teamEditReviewReasons({ ...base, teamName: "Otro", newLogo: true })).toEqual(["teamName", "logo"]);
  });

  it("lo que edita el Administrador nunca vuelve a revisión", () => {
    expect(teamEditReviewReasons({ ...base, isAdmin: true, teamName: "Otro", newLogo: true })).toEqual([]);
  });
});

describe("describeReviewReasons", () => {
  it("nombra lo que cambió", () => {
    expect(describeReviewReasons(["teamName"])).toBe("el nombre del equipo");
    expect(describeReviewReasons(["logo"])).toBe("el logo");
    expect(describeReviewReasons(["teamName", "logo"])).toBe("el nombre del equipo y el logo");
  });
});
