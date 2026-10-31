import { describe, expect, it } from "vitest";
import { routes } from "./RoutesConfiguration";

describe("routes", () => {
  it("declara cada ruta una sola vez (/materias incluida)", () => {
    const paths = routes.map((r) => r.path);
    const duplicated = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(duplicated).toEqual([]);
    expect(paths.filter((p) => p === "/materias")).toHaveLength(1);
  });
});
