import { describe, expect, it } from "vitest";
import { MAX_ZIP_BYTES, reachableBlobUrl, uploadErrorMessage } from "@/features/teams/lib/azureFile";

describe("uploadErrorMessage (F8)", () => {
  it("un 413 del back muestra su mensaje", async () => {
    const res = new Response(JSON.stringify({ statusCode: 413, message: "El archivo supera el máximo de 200 MB." }), { status: 413 });
    await expect(uploadErrorMessage(res, "200 MB")).resolves.toBe("El archivo supera el máximo de 200 MB.");
  });

  it("un 413 del nginx (HTML) usa el límite real", async () => {
    const res = new Response("<html>413 Request Entity Too Large</html>", { status: 413 });
    await expect(uploadErrorMessage(res, "200 MB")).resolves.toBe(
      "El archivo es demasiado grande. El tamaño máximo permitido es 200 MB.",
    );
  });

  it("un 400 muestra el mensaje del back (zip dañado)", async () => {
    const res = new Response(JSON.stringify({ message: "El archivo .zip está dañado o no se pudo leer." }), { status: 400 });
    await expect(uploadErrorMessage(res, "200 MB")).resolves.toBe("El archivo .zip está dañado o no se pudo leer.");
  });

  it("el máximo es el del back: 200 MB", () => {
    expect(MAX_ZIP_BYTES).toBe(200 * 1024 * 1024);
  });
});

describe("reachableBlobUrl", () => {
  it("solo cambia el host azurite", () => {
    expect(new URL(reachableBlobUrl("http://azurite:10000/a/b.zip")).hostname).toBe("api.test");
    expect(reachableBlobUrl("https://x.blob.core.windows.net/a.zip")).toBe("https://x.blob.core.windows.net/a.zip");
    expect(reachableBlobUrl("")).toBe("");
  });
});
