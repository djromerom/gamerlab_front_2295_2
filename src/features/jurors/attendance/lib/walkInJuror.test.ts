import { describe, expect, it } from "vitest";
import type { ExistingPerson, SuggestedTeam, TeamSuggestion } from "@/features/jurors/attendance/api/walkInJurors";
import {
  accountEmailHint,
  basisText,
  enrollHint,
  existingPersonAction,
  isUninorteEmail,
  missingText,
  splitFieldErrors,
  teamsOfLevel,
  toggleTeam,
  validateWalkInForm,
} from "@/features/jurors/attendance/lib/walkInJuror";

const person = (extra: Partial<ExistingPerson> = {}): ExistingPerson => ({
  id: "p1",
  name: "Laura Gómez",
  role: "Jurado",
  isActive: true,
  isJurorOfEdition: true,
  editionStatus: "CONFIRMED",
  checkedInAt: null,
  ...extra,
});

const team = (id: number, faltantes = 1): SuggestedTeam => ({
  id,
  codigo: `N1-T-${id}`,
  nombre: `Equipo ${id}`,
  videojuego: null,
  juradosContados: 3 - faltantes,
  faltantes,
});

describe("Qué ofrecer por cada persona que ya existe (HU-24)", () => {
  it("jurado de la edición sin llegada: marcar llegada", () => {
    expect(existingPersonAction(person())).toBe("CHECK_IN");
  });

  it("jurado de la edición que ya llegó: solo informar", () => {
    expect(existingPersonAction(person({ checkedInAt: "2026-11-26T14:00:00.000Z" }))).toBe("ALREADY_ARRIVED");
  });

  it("jurado o profesor que no es de la edición: inscribirlo en Jurados de la edición", () => {
    expect(existingPersonAction(person({ isJurorOfEdition: false, editionStatus: null }))).toBe("ENROLL");
    expect(existingPersonAction(person({ role: "Profesor", isJurorOfEdition: false }))).toBe("ENROLL");
  });

  it("otro rol: el correo no sirve para un jurado", () => {
    expect(existingPersonAction(person({ role: "Estudiante", isJurorOfEdition: false }))).toBe("NOT_A_JUROR");
    expect(existingPersonAction(person({ role: "Staff", isJurorOfEdition: false }))).toBe("NOT_A_JUROR");
  });

  it("la ayuda para inscribir depende de su fila en la edición", () => {
    expect(enrollHint(person({ editionStatus: null }))).toMatch(/inscríbelo por correo/);
    expect(enrollHint(person({ editionStatus: "PENDING" }))).toMatch(/Pendiente/);
    expect(enrollHint(person({ editionStatus: "DECLINED" }))).toMatch(/Declinó/);
  });
});

describe("Formulario de alta", () => {
  it("reparte los textos del back por campo y deja el resto como generales", () => {
    expect(
      splitFieldErrors(["El nombre es obligatorio", "El apellido solo puede contener letras y espacios", "El correo electrónico no es válido", "Otro"]),
    ).toEqual({
      fields: {
        firstName: "El nombre es obligatorio",
        lastName: "El apellido solo puede contener letras y espacios",
        email: "El correo electrónico no es válido",
      },
      general: ["Otro"],
    });
  });

  it("valida como el back: obligatorio, sin números y correo válido", () => {
    expect(validateWalkInForm({ firstName: "José", lastName: "Núñez O'Neil-Peña", email: "jose@ejemplo.com" })).toEqual({});
    expect(validateWalkInForm({ firstName: " ", lastName: "R2D2", email: "malo" })).toEqual({
      firstName: "El nombre es obligatorio",
      lastName: "El apellido solo puede contener letras y espacios",
      email: "El correo electrónico no es válido",
    });
  });

  it("con correo de Uninorte entra con Microsoft; con uno externo, con el enlace", () => {
    expect(isUninorteEmail("ana@UNINORTE.edu.co")).toBe(true);
    expect(isUninorteEmail("ana@gmail.com")).toBe(false);
    expect(accountEmailHint("ana@uninorte.edu.co")).toMatch(/Microsoft/);
    expect(accountEmailHint("ana@gmail.com")).toMatch(/enlace/);
  });
});

describe("Propuesta de grupos", () => {
  it("antes de las 11:00 cuenta asignados; desde las 11:00, presentes", () => {
    expect(basisText("ASSIGNED")).toMatch(/asignados.*antes de las 11:00/);
    expect(basisText("PRESENT")).toMatch(/presentes.*11:00/);
  });

  it("al editar se eligen los propuestos y los demás del nivel, sin repetir", () => {
    const suggestion = { teams: [team(1), team(2)], otherTeamsOfLevel: [team(2), team(3)] } as TeamSuggestion;
    expect(teamsOfLevel(suggestion).map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("marcar y desmarcar sin pasar del tope", () => {
    expect(toggleTeam([1, 2], 2)).toEqual([1]);
    expect(toggleTeam([1], 2)).toEqual([1, 2]);
    expect(toggleTeam([1, 2, 3], 4, 3)).toEqual([1, 2, 3]);
  });
});

describe("Texto de faltantes", () => {
  it("dice cuántos faltan y cuántos jurados tiene de 3", () => {
    expect(missingText(team(1, 2))).toBe("Faltan 2 · tiene 1 de 3 jurados");
  });
});
