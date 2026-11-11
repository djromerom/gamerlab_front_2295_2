import { beforeEach, describe, expect, it } from "vitest";
import { backupKey } from "@/lib/evaluationDrafts";
import { GRADE_DRAFT_KEY } from "@/lib/gradeDrafts";
import { claimLocalDrafts, clearAllLocalDrafts, LOCAL_DRAFTS_OWNER_KEY } from "@/lib/localDraftsOwner";

const seed = () => {
  localStorage.setItem(backupKey(5), JSON.stringify({ scores: { 1: "4" }, comments: "", savedAt: 1 }));
  localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ grades: {}, teams: {} }));
  localStorage.setItem("theme", "dark");
};

beforeEach(() => localStorage.clear());

describe("localDraftsOwner (BG-27 / BG-08)", () => {
  it("el mismo usuario conserva lo que dejó sin guardar (recarga o sesión vencida)", () => {
    localStorage.setItem(LOCAL_DRAFTS_OWNER_KEY, "user-a");
    seed();
    claimLocalDrafts("user-a");
    expect(localStorage.getItem(backupKey(5))).not.toBeNull();
    expect(localStorage.getItem(GRADE_DRAFT_KEY)).not.toBeNull();
  });

  it("otro usuario en el mismo navegador no ve lo del anterior", () => {
    localStorage.setItem(LOCAL_DRAFTS_OWNER_KEY, "user-a");
    seed();
    claimLocalDrafts("user-b");
    expect(localStorage.getItem(backupKey(5))).toBeNull();
    expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(LOCAL_DRAFTS_OWNER_KEY)).toBe("user-b");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("si no se sabe de quién es, se borra", () => {
    seed();
    claimLocalDrafts("user-a");
    expect(localStorage.getItem(backupKey(5))).toBeNull();
    expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(LOCAL_DRAFTS_OWNER_KEY)).toBe("user-a");
  });

  it("al cerrar sesión se borra todo, incluido el dueño", () => {
    localStorage.setItem(LOCAL_DRAFTS_OWNER_KEY, "user-a");
    seed();
    clearAllLocalDrafts();
    expect(localStorage.getItem(backupKey(5))).toBeNull();
    expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(LOCAL_DRAFTS_OWNER_KEY)).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
