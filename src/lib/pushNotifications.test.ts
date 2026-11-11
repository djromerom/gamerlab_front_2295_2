import { describe, expect, it } from "vitest";
import { base64UrlToUint8Array } from "./pushNotifications";

describe("base64UrlToUint8Array", () => {
  it("decodifica una clave VAPID base64url", () => {
    const bytes = base64UrlToUint8Array("AQID");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });

  it("acepta guiones y guiones bajos de base64url", () => {
    const bytes = base64UrlToUint8Array("-w");
    expect(Array.from(bytes)).toEqual([251]);
  });
});
