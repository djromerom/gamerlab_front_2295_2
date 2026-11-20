import { afterEach, describe, expect, it, vi } from "vitest";
import type { MySubstituteNotices } from "@/features/jurors/substitutes/api/substituteNotices";
import {
  acknowledgeGuide,
  groupsLabel,
  guideStorageKey,
  hasAcknowledgedGuide,
  isSubstituteJuror,
  unreadNotices,
} from "@/features/jurors/substitutes/lib/substituteGuide";

const result = (extra: Partial<MySubstituteNotices> = {}): MySubstituteNotices => ({
  edition: { id: 3, title: "Feria" },
  serverTime: "2026-11-14T15:00:00.000Z",
  unreadCount: 0,
  data: [],
  ...extra,
});

const notice = (id: number, readAt: string | null) => ({
  id,
  createdAt: "2026-11-14T15:00:00.000Z",
  readAt,
  message: "Te asignaron grupos",
  teams: [],
});

describe("Explicación para suplentes (HU-22)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("el «Entendido» se guarda por usuario y por edición", () => {
    expect(hasAcknowledgedGuide("u1", 3)).toBe(false);
    expect(acknowledgeGuide("u1", 3)).toBe(true);

    expect(hasAcknowledgedGuide("u1", 3)).toBe(true);
    expect(hasAcknowledgedGuide("u1", 4)).toBe(false); // otra edición
    expect(hasAcknowledgedGuide("u2", 3)).toBe(false); // otro usuario en el mismo navegador
    expect(guideStorageKey("u1", 3)).toBe("arkad:substitute-guide:u1:3");
  });

  it("si el navegador no deja guardar, no rompe", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(acknowledgeGuide("u1", 3)).toBe(false);
    expect(hasAcknowledgedGuide("u1", 3)).toBe(false);
  });

  it("con isSubstitute del back manda ese valor", () => {
    expect(isSubstituteJuror(result({ isSubstitute: true }))).toBe(true);
    expect(isSubstituteJuror(result({ isSubstitute: false, data: [notice(1, null)] }))).toBe(false);
  });

  it("sin isSubstitute, es suplente si tiene algún aviso, leído o no", () => {
    expect(isSubstituteJuror(null)).toBe(false);
    expect(isSubstituteJuror(result())).toBe(false); // oficial o suplente sin avisos
    expect(isSubstituteJuror(result({ data: [notice(1, "2026-11-14T16:00:00.000Z")] }))).toBe(true);
    expect(isSubstituteJuror(result({ unreadCount: 1 }))).toBe(true);
  });

  it("filtra los sin leer y nombra los grupos en singular o plural", () => {
    expect(unreadNotices([notice(1, null), notice(2, "x")]).map((n) => n.id)).toEqual([1]);
    expect(groupsLabel(1)).toBe("1 grupo");
    expect(groupsLabel(3)).toBe("3 grupos");
  });
});
