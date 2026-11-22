import { describe, expect, it } from "vitest";
import { verificationCodesChangeMessage } from "@/features/editions/lib/verificationCodes";

describe("verificationCodesChangeMessage (HU-50, ARK-311)", () => {
  it("dice quién y cuándo, en hora de Colombia", () => {
    const text = verificationCodesChangeMessage({
      verificationCodesEnabled: false,
      changedAt: "2026-11-21T20:10:00.000Z",
      changedBy: { id: "a1", name: "Allison Ruiz" },
    });
    expect(text).toMatch(/^Último cambio: Allison Ruiz, el 21\/11\/2026, 3:10/);
    expect(text).toContain("(hora de Colombia).");
  });

  it("sin autor dice solo cuándo; sin fecha (o inválida) no dice nada", () => {
    expect(
      verificationCodesChangeMessage({ verificationCodesEnabled: true, changedAt: "2026-11-21T20:10:00.000Z", changedBy: null }),
    ).toMatch(/^Último cambio: el 21\/11\/2026/);
    expect(verificationCodesChangeMessage({ verificationCodesEnabled: true, changedAt: null, changedBy: null })).toBeNull();
    expect(verificationCodesChangeMessage({ verificationCodesEnabled: true, changedAt: "x", changedBy: null })).toBeNull();
  });
});
