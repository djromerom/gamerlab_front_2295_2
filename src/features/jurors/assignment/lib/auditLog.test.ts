import { describe, expect, it } from "vitest";
import {
  AUDIT_PAGE_SIZE,
  AUDIT_UNAVAILABLE,
  auditLogPath,
  auditNoteText,
  auditPersonLabel,
  auditTeamLabel,
  mergeAuditLogs,
  parseAuditPage,
} from "./auditLog";

describe("auditLog (ARK-262)", () => {
  it("pide el historial por páginas del tamaño acordado", () => {
    expect(AUDIT_PAGE_SIZE).toBe(50);
    expect(auditLogPath(3)).toBe("/juror/assignments/audit?page=3&limit=50");
  });

  describe("parseAuditPage", () => {
    it("lee los registros y el total del back", () => {
      const page = parseAuditPage(
        { data: [{ id: 1 }, { id: 2 }], metadata: { totalItems: 287, currentPage: 2 } },
        1
      );
      expect(page.logs).toHaveLength(2);
      expect(page.totalItems).toBe(287);
      expect(page.page).toBe(2);
    });

    it("sin metadata usa la página pedida y los registros recibidos", () => {
      expect(parseAuditPage({ data: [{ id: 1 }] }, 4)).toMatchObject({ page: 4, totalItems: 1 });
      expect(parseAuditPage([{ id: 1 }, { id: 2 }], 1)).toMatchObject({ page: 1, totalItems: 2 });
    });

    it("una respuesta vacía o rara no rompe", () => {
      expect(parseAuditPage(null, 1)).toEqual({ logs: [], page: 1, totalItems: 0 });
      expect(parseAuditPage({ data: "x", metadata: { totalItems: "no" } }, 1)).toEqual({
        logs: [],
        page: 1,
        totalItems: 0,
      });
    });
  });

  describe("mergeAuditLogs", () => {
    it("agrega al final y no repite registros por id", () => {
      const merged = mergeAuditLogs([{ id: 3 }, { id: 2 }], [{ id: 2 }, { id: 1 }]);
      expect(merged.map((log) => log.id)).toEqual([3, 2, 1]);
    });

    it("conserva los registros sin id", () => {
      expect(mergeAuditLogs([{}], [{}, { id: 1 }])).toHaveLength(3);
    });
  });

  describe("nombres: nunca el identificador interno", () => {
    it("usa el nombre del back, luego el de las listas, luego «no disponible»", () => {
      expect(auditPersonLabel("u1", "Admin Romero", "Otro", AUDIT_UNAVAILABLE.actor)).toBe("Admin Romero");
      expect(auditPersonLabel("u1", null, "Ana Gómez", AUDIT_UNAVAILABLE.juror)).toBe("Ana Gómez");
      expect(auditPersonLabel("eec17349-02c7-4c57", null, null, AUDIT_UNAVAILABLE.actor)).toBe(
        "Usuario no disponible"
      );
    });

    it("sin identificador dice N/A", () => {
      expect(auditPersonLabel(null, null, null, AUDIT_UNAVAILABLE.juror)).toBe("N/A");
      expect(auditPersonLabel(undefined, "x", "y", AUDIT_UNAVAILABLE.juror)).toBe("N/A");
    });

    it("el equipo sale como «Equipo (Juego)», o «no disponible», nunca el número", () => {
      expect(auditTeamLabel({ teamId: 10, teamName: "Los Pixeles", gameName: "Juego Uno" }, null)).toBe(
        "Los Pixeles (Juego Uno)"
      );
      expect(auditTeamLabel({ teamId: 10, teamName: "Los Pixeles", gameName: null }, null)).toBe("Los Pixeles");
      expect(auditTeamLabel({ teamId: 10 }, "Del listado (Juego)")).toBe("Del listado (Juego)");
      expect(auditTeamLabel({ teamId: 10 }, null)).toBe("Equipo no disponible");
      expect(auditTeamLabel({ teamId: null }, null)).toBe("N/A");
    });
  });

  describe("auditNoteText", () => {
    it("prefiere la nota con los códigos traducidos", () => {
      expect(
        auditNoteText({
          notes: "Asignación manual. Advertencias aceptadas: TEAM_UNDER_MIN.",
          notesText: "Asignación manual. Advertencias aceptadas: El grupo quedaría con menos de 3 jurados.",
        })
      ).toContain("El grupo quedaría con menos de 3 jurados");
    });

    it("sin la traducción usa la nota guardada, y sin nota es null", () => {
      expect(auditNoteText({ notes: "Asignación manual." })).toBe("Asignación manual.");
      expect(auditNoteText({ notes: null })).toBeNull();
    });
  });
});
