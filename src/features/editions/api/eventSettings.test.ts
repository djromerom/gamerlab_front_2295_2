import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { EventSettingError, RANKING_REQUIRES_FINAL_GRADE, updateEventSetting } from "@/features/editions/api/eventSettings";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => apiFetch.mockReset());

describe("updateEventSetting", () => {
  it("envía el campo con el valor", async () => {
    apiFetch.mockResolvedValue(json({ showRanking: false }));
    await updateEventSetting("/settings/show-ranking", "show", false);
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/settings/show-ranking");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ show: false });
  });

  it("BG-67: publicar sin la nota final liberada trae el mensaje y el código del back", async () => {
    apiFetch.mockResolvedValue(
      json({ statusCode: 400, code: RANKING_REQUIRES_FINAL_GRADE, message: "Primero libera la nota final; el ranking se publica después." }, 400),
    );
    const error = await updateEventSetting("/settings/show-ranking", "show", true).catch((e) => e);
    expect(error).toBeInstanceOf(EventSettingError);
    expect(error).toMatchObject({ status: 400, code: RANKING_REQUIRES_FINAL_GRADE, message: "Primero libera la nota final; el ranking se publica después." });
  });

  it("sin mensaje del back usa uno genérico con el código HTTP", async () => {
    apiFetch.mockResolvedValue(new Response("<html>", { status: 502 }));
    await expect(updateEventSetting("/settings/show-evaluations", "show", true)).rejects.toThrow("error 502");
  });
});
