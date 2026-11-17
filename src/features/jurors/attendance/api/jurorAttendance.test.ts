import { afterEach, describe, expect, it, vi } from "vitest";
import {
  JurorAttendanceError,
  attendanceQueryString,
  fetchJurorAttendance,
  formatArrival,
  sortAttendanceRows,
  type JurorAttendanceItem,
} from "@/features/jurors/attendance/api/jurorAttendance";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Asistencia de jurados: llamadas a la API (HU-29)", () => {
  afterEach(() => apiFetch.mockReset());

  it("sin filtros pide la primera página de 50", async () => {
    apiFetch.mockResolvedValue(json(200, { data: [] }));
    await fetchJurorAttendance();
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/juror-attendance?limit=50");
  });

  it("manda estado, búsqueda y página", () => {
    expect(attendanceQueryString({ status: "MISSING", search: "  José Pérez ", page: 2 })).toBe(
      "status=MISSING&search=Jos%C3%A9+P%C3%A9rez&page=2&limit=50",
    );
  });

  it("no manda búsquedas de menos de 2 letras y corta a 50", () => {
    expect(attendanceQueryString({ search: "a" })).toBe("limit=50");
    expect(new URLSearchParams(attendanceQueryString({ search: "x".repeat(80) })).get("search")).toHaveLength(50);
  });

  it.each([
    [403, "No tienes permiso para ver la asistencia de los jurados."],
    [404, "No hay una feria activa."],
  ])("%s se traduce a un mensaje fijo", async (status, message) => {
    apiFetch.mockResolvedValue(json(status, { message: "Forbidden resource", code: "NO_ACTIVE_EDITION" }));
    const error = await fetchJurorAttendance().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(JurorAttendanceError);
    expect((error as JurorAttendanceError).status).toBe(status);
    expect((error as Error).message).toBe(message);
  });

  it("un 400 muestra los textos de validación del back", async () => {
    apiFetch.mockResolvedValue(json(400, { message: ["search must be shorter", "limit must not be greater than 100"] }));
    await expect(fetchJurorAttendance()).rejects.toThrow("search must be shorter, limit must not be greater than 100");
  });

  it("la hora de llegada sale en hora de Colombia", () => {
    // 13:05 UTC = 8:05 a. m. en Bogotá; el mismo día solo se ve la hora
    expect(formatArrival("2026-11-26T13:05:12.000Z", "2026-11-26T20:00:00.000Z")).toMatch(/^8:05/);
    expect(formatArrival(null)).toBe("—");
  });

  it("una llegada de otro día se ve con su fecha (ARK-261)", () => {
    // 05:17 UTC del 11-nov = 12:17 a. m. del 11-nov en Bogotá
    expect(formatArrival("2026-11-11T05:17:00.000Z", "2026-11-16T15:00:00.000Z")).toMatch(/^11\/11, 12:17/);
  });
});

describe("orden de la tabla de asistencia (ARK-261)", () => {
  const row = (jurorId: string, checkedInAt: string | null): JurorAttendanceItem => ({
    jurorId,
    name: jurorId,
    category: "Junior",
    isProfessor: false,
    hasBadge: true,
    status: checkedInAt ? "PRESENT" : "MISSING",
    checkedInAt,
    method: checkedInAt ? "QR" : null,
    checkedInBy: null,
  });

  it("primero los que faltan y luego los presentes por fecha y hora reales, el último arriba", () => {
    const rows = [
      row("hoy-temprano", "2026-11-16T13:05:00.000Z"), // hoy 8:05 a. m.
      row("06-nov-tarde", "2026-11-06T22:00:00.000Z"), // 06/11 5:00 p. m.
      row("falta-a", null),
      row("11-nov-madrugada", "2026-11-11T05:17:00.000Z"), // 11/11 12:17 a. m.
      row("falta-b", null),
    ];
    expect(sortAttendanceRows(rows).map((r) => r.jurorId)).toEqual([
      "falta-a",
      "falta-b",
      "hoy-temprano",
      "11-nov-madrugada",
      "06-nov-tarde",
    ]);
    // No muta la lista recibida
    expect(rows[0].jurorId).toBe("hoy-temprano");
  });
});
