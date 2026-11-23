import { describe, expect, it } from "vitest";
import { EDIT_GRADES_BLOCK_MESSAGE, editGradesBlock } from "./editGradesBlock";

const ready = { isLoading: false, showHistorical: false, selectedNRC: "7", hasEditableTeams: true };

describe("editGradesBlock (HU-45, ARK-296)", () => {
  it("con NRC y equipos editables se puede editar", () => {
    expect(editGradesBlock(ready)).toBeNull();
  });

  it("sin NRC pide elegir uno", () => {
    expect(editGradesBlock({ ...ready, selectedNRC: "" })).toBe("noNrc");
  });

  it("en históricos pide volver a la feria actual, aunque no haya NRC", () => {
    expect(editGradesBlock({ ...ready, showHistorical: true })).toBe("historical");
    expect(editGradesBlock({ ...ready, showHistorical: true, selectedNRC: "" })).toBe("historical");
  });

  it("un NRC sin equipos editables lo dice", () => {
    expect(editGradesBlock({ ...ready, hasEditableTeams: false })).toBe("noEditable");
  });

  it("mientras carga queda bloqueado sin aviso, sea cual sea lo demás", () => {
    expect(editGradesBlock({ ...ready, isLoading: true, showHistorical: true, selectedNRC: "" })).toBe("loading");
    expect(EDIT_GRADES_BLOCK_MESSAGE).not.toHaveProperty("loading");
  });

  it("los avisos dicen qué hacer", () => {
    expect(EDIT_GRADES_BLOCK_MESSAGE).toEqual({
      noNrc: "Elige un NRC para editar sus notas",
      historical: "Estás viendo históricos: vuelve a la feria actual",
      noEditable: "Este NRC no tiene notas editables",
    });
  });
});
