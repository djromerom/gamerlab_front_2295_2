import { afterEach, describe, expect, it, vi } from "vitest";
import { updateRegistrationsOpen } from "./registrations";

afterEach(() => {
  vi.unstubAllGlobals();
});

const respondWith = (body: BodyInit | null, status: number) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));

describe("updateRegistrationsOpen", () => {
  it("devuelve el estado nuevo cuando el back acepta el cambio", async () => {
    respondWith(JSON.stringify({ registrationsOpen: true }), 200);
    await expect(updateRegistrationsOpen(true)).resolves.toBe(true);
  });

  it("lanza el mensaje del back con el código HTTP (ARK-123)", async () => {
    respondWith(
      JSON.stringify({ statusCode: 404, message: "A configuration for the active edition was not found" }),
      404,
    );
    await expect(updateRegistrationsOpen(true)).rejects.toThrow(
      "A configuration for the active edition was not found (404)",
    );
  });

  it("une los mensajes cuando el back manda una lista (validación)", async () => {
    respondWith(JSON.stringify({ statusCode: 400, message: ["open must be a boolean", "open should not be empty"] }), 400);
    await expect(updateRegistrationsOpen(true)).rejects.toThrow(
      "open must be a boolean, open should not be empty (400)",
    );
  });

  it("usa un texto genérico con el código cuando el cuerpo no es JSON", async () => {
    respondWith("<html>Bad Gateway</html>", 502);
    await expect(updateRegistrationsOpen(true)).rejects.toThrow("Error en la actualización (502)");
  });
});
