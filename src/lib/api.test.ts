import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

const okResponse = () => new Response("{}", { status: 200 });

describe("apiFetch resilience policy", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renews a 401 once and retries with the new token", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(okResponse());
    const refreshAccessToken = vi.fn().mockResolvedValue("renewed-token");
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("https://api.example.test/grades", {}, { refreshAccessToken });

    expect(response.status).toBe(200);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer renewed-token");
  });

  it("retries a network failure with increasing delay for GET", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiFetch("https://api.example.test/grades");
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a clear error after exhausting network retries", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiFetch("https://api.example.test/grades");
    const assertion = expect(pending).rejects.toThrow("No pudimos completar la acción, inténtalo de nuevo");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries a 5xx response for GET and returns the successful response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiFetch("https://api.example.test/grades");
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a POST without an idempotency key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("https://api.example.test/evaluations", { method: "POST", body: "{}" });

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a POST only when the request carries an idempotency key", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiFetch("https://api.example.test/evaluations", {
      method: "POST",
      headers: { "Idempotency-Key": "submission-123" },
      body: "{}",
    });
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("makes at most three safe-method attempts for 5xx responses", async () => {
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiFetch("https://api.example.test/grades");
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(timeoutSpy.mock.calls.map(([, delay]) => delay)).toEqual([1_000, 2_000]);
  });
});
