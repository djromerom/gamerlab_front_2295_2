import { describe, it, expect, beforeEach } from "vitest";
import {
  buildRegistrationPayload,
  cleanApiMessage,
  clearRegistrationDraft,
  friendlyErrorMessage,
  loadRegistrationDraft,
  NETWORK_ERROR_MESSAGE,
  nameCheckUrl,
  nrcLabel,
  saveRegistrationDraft,
  REGISTRATION_DRAFT_KEY,
} from "./registration";
import { CombinedSchema, EMAIL_MISMATCH_MESSAGE, type CombinedFormValues } from "./schemas";

const form = (overrides: Partial<CombinedFormValues> = {}): CombinedFormValues => ({
  teamName: "Equipo QA",
  members: [
    { nombre: "Ana", apellido: "Pérez", correo: "ana@uninorte.edu.co", confirmarCorreo: "ana@uninorte.edu.co", codigoEstudiantil: "200190601", nrc: ["3501"] },
  ],
  gameName: "Juego QA",
  description: "Un juego",
  YoutubeUrl: "",
  RepoUrl: "",
  files: [new File(["logo"], "logo.png", { type: "image/png" })],
  additionalFiles: [],
  recaptcha: "token",
  dataConsent: true,
  ...overrides,
});

describe("registro de equipos: envío", () => {
  it("sin logo no envía logoUrl", () => {
    const payload = buildRegistrationPayload(form(), { additionalImages: [] });
    expect(payload.videogame).not.toHaveProperty("logoUrl");
  });

  it("con logo envía su URL", () => {
    const payload = buildRegistrationPayload(form(), { logoUrl: "https://x/logo.png", additionalImages: [] });
    expect(payload.videogame.logoUrl).toBe("https://x/logo.png");
  });

  it("recorta los textos y pasa el correo a minúsculas", () => {
    const payload = buildRegistrationPayload(
      form({
        teamName: "  Equipo  ",
        members: [{ nombre: " Ana ", apellido: " P ", correo: " Ana@Uninorte.edu.co ", confirmarCorreo: " Ana@Uninorte.edu.co ", codigoEstudiantil: " 1 ", nrc: ["1"] }],
      }),
      { additionalImages: [] },
    );
    expect(payload.teamName).toBe("Equipo");
    expect(payload.members[0]).toEqual({
      memberFirstName: "Ana",
      memberLastName: "P",
      memberEmail: "ana@uninorte.edu.co",
      studentCode: "1",
      nrc: ["1"],
    });
  });
});

describe("registro de equipos: mensajes y rutas", () => {
  it("codifica y recorta el nombre en la revisión", () => {
    expect(nameCheckUrl("http://api", "name", "  Equipo/Barra #1 ")).toBe(
      "http://api/teams/name/Equipo%2FBarra%20%231",
    );
    expect(nameCheckUrl("http://api", "videogame", "¿Qué tal?")).toBe(
      "http://api/teams/videogame/%C2%BFQu%C3%A9%20tal%3F",
    );
  });

  it("quita el prefijo del campo anidado en los mensajes de la API", () => {
    expect(cleanApiMessage(["videogame.La URL de YouTube debe ser válida"])).toBe(
      "La URL de YouTube debe ser válida",
    );
    expect(cleanApiMessage("members.0.El código de estudiante solo puede tener números")).toBe(
      "El código de estudiante solo puede tener números",
    );
    expect(cleanApiMessage("El correo a@b.co ya está en uso.")).toBe("El correo a@b.co ya está en uso.");
  });

  it("muestra la materia en cada NRC", () => {
    expect(nrcLabel({ code: 3501, subject: { name: "Programación I" } })).toBe("3501 · Programación I");
    expect(nrcLabel({
      code: 3501,
      subject: { name: "Programación I" },
      professorName: "Ana Pérez",
    })).toBe("3501 · Programación I · Ana Pérez");
    expect(nrcLabel({ code: 3501 })).toBe("3501");
  });
});

describe("registro de equipos: esquema", () => {
  const errorsOf = (values: CombinedFormValues) => {
    const result = CombinedSchema.safeParse(values);
    return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  };

  it("un registro normal pasa", () => {
    expect(errorsOf(form())).toEqual([]);
  });

  it("exige el logo", () => {
    expect(errorsOf(form({ files: [] }))).toContain("files: El logo del videojuego es obligatorio");
  });

  it("rechaza nombres de solo espacios y códigos con letras", () => {
    const errors = errorsOf(
      form({ members: [{ nombre: "   ", apellido: "P", correo: "a@b.co", confirmarCorreo: "a@b.co", codigoEstudiantil: "abc!", nrc: ["1"] }] }),
    );
    expect(errors).toContain("members.0.nombre: El nombre es obligatorio");
    expect(errors).toContain("members.0.codigoEstudiantil: El código estudiantil solo puede tener números");
  });

  it("rechaza el mismo correo o código en dos integrantes", () => {
    const errors = errorsOf(
      form({
        members: [
          { nombre: "A", apellido: "B", correo: "a@b.co", confirmarCorreo: "a@b.co", codigoEstudiantil: "1", nrc: ["1"] },
          { nombre: "C", apellido: "D", correo: "A@B.co", confirmarCorreo: "A@B.co", codigoEstudiantil: "1", nrc: ["1"] },
        ],
      }),
    );
    expect(errors).toContain("members.1.correo: Este correo ya está en el integrante 1");
    expect(errors).toContain("members.1.codigoEstudiantil: Este código ya está en el integrante 1");
  });

  it("valida las URLs opcionales de YouTube y del repositorio", () => {
    expect(errorsOf(form({ YoutubeUrl: "cualquier texto" }))).toContain(
      "YoutubeUrl: La URL de YouTube debe empezar por https:// y ser válida",
    );
    expect(errorsOf(form({ RepoUrl: "github.com/x" }))).toContain(
      "RepoUrl: La URL del repositorio debe empezar por https:// y ser válida",
    );
    expect(errorsOf(form({ YoutubeUrl: "https://youtu.be/abc", RepoUrl: "https://github.com/x/y" }))).toEqual([]);
  });
});

describe("registro de equipos: repetir el correo (ARK-168)", () => {
  const member = (correo: string, confirmarCorreo: string) => ({
    nombre: "Ana",
    apellido: "Pérez",
    correo,
    confirmarCorreo,
    codigoEstudiantil: "200190601",
    nrc: ["3501"],
  });
  const errorsOf = (members: CombinedFormValues["members"]) => {
    const result = CombinedSchema.safeParse(form({ members }));
    return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  };

  it("rechaza un correo repetido distinto", () => {
    expect(errorsOf([member("ana@uninorte.edu.co", "ana@uninrte.edu.co")])).toEqual([
      `members.0.confirmarCorreo: ${EMAIL_MISMATCH_MESSAGE}`,
    ]);
  });

  it("ignora mayúsculas y espacios al inicio y al final", () => {
    expect(errorsOf([member("Ana@Uninorte.edu.co", "  ana@UNINORTE.edu.co ")])).toEqual([]);
  });

  it("no ignora espacios en medio del correo", () => {
    expect(errorsOf([member("ana@uninorte.edu.co", "ana @uninorte.edu.co")])).toContain(
      `members.0.confirmarCorreo: ${EMAIL_MISMATCH_MESSAGE}`,
    );
  });

  it("exige repetir el correo de cada integrante", () => {
    const errors = errorsOf([
      member("ana@uninorte.edu.co", "ana@uninorte.edu.co"),
      { ...member("luis@uninorte.edu.co", "   "), codigoEstudiantil: "200190602" },
    ]);
    expect(errors).toEqual(["members.1.confirmarCorreo: Repite el correo"]);
  });

  it("marca el error solo en el integrante cuyo correo no coincide", () => {
    const errors = errorsOf([
      member("ana@uninorte.edu.co", "ana@uninorte.edu.co"),
      { ...member("luis@uninorte.edu.co", "luis@uninorte.edu"), codigoEstudiantil: "200190602" },
    ]);
    expect(errors).toEqual([`members.1.confirmarCorreo: ${EMAIL_MISMATCH_MESSAGE}`]);
  });

  it("no envía el correo repetido al backend", () => {
    const payload = buildRegistrationPayload(form(), { additionalImages: [] });
    expect(payload.members[0]).not.toHaveProperty("confirmarCorreo");
  });
});

describe("registro de equipos: borrador", () => {
  beforeEach(() => sessionStorage.clear());

  it("guarda y restaura el texto, sin archivos ni captcha", () => {
    saveRegistrationDraft(1, form());
    const raw = sessionStorage.getItem(REGISTRATION_DRAFT_KEY)!;
    expect(raw).not.toContain("token");
    expect(raw).not.toContain("logo.png");
    const draft = loadRegistrationDraft();
    expect(draft?.step).toBe(1);
    expect(draft?.values.teamName).toBe("Equipo QA");
    expect(draft?.values.members[0].codigoEstudiantil).toBe("200190601");
    expect(draft?.values.members[0].confirmarCorreo).toBe("ana@uninorte.edu.co");
  });

  it("un borrador sin el correo repetido vuelve al paso de integrantes", () => {
    // Borrador guardado antes de ARK-168: los integrantes no traen confirmarCorreo
    sessionStorage.setItem(
      REGISTRATION_DRAFT_KEY,
      JSON.stringify({
        step: 2,
        values: {
          teamName: "Equipo QA",
          members: [{ nombre: "Ana", apellido: "Pérez", correo: "ana@uninorte.edu.co", codigoEstudiantil: "1", nrc: ["1"] }],
        },
      }),
    );
    const draft = loadRegistrationDraft();
    expect(draft?.step).toBe(1);
    expect(draft?.values.members[0].confirmarCorreo).toBe("");
  });

  it("no vuelve directo al paso 4 (captcha y archivos)", () => {
    saveRegistrationDraft(3, form());
    expect(loadRegistrationDraft()?.step).toBe(2);
  });

  it("ignora un borrador dañado y se puede limpiar", () => {
    sessionStorage.setItem(REGISTRATION_DRAFT_KEY, "{no es json");
    expect(loadRegistrationDraft()).toBeNull();
    saveRegistrationDraft(0, form());
    clearRegistrationDraft();
    expect(loadRegistrationDraft()).toBeNull();
  });
});

describe("friendlyErrorMessage (BG-66)", () => {
  it("cambia el «Failed to fetch» del navegador por un mensaje en español", () => {
    expect(friendlyErrorMessage(new TypeError("Failed to fetch"))).toBe(NETWORK_ERROR_MESSAGE);
    expect(friendlyErrorMessage(new TypeError("NetworkError when attempting to fetch resource."))).toBe(NETWORK_ERROR_MESSAGE);
    expect(friendlyErrorMessage(new TypeError("Load failed"))).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("deja pasar los mensajes de la API y usa el respaldo si no hay mensaje", () => {
    expect(friendlyErrorMessage(new Error("Ya existe un videojuego con ese nombre"))).toBe("Ya existe un videojuego con ese nombre");
    expect(friendlyErrorMessage(null, "Error desconocido")).toBe("Error desconocido");
  });
});
