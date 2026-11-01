import { describe, it, expect, beforeEach } from "vitest";
import {
  buildRegistrationPayload,
  cleanApiMessage,
  clearRegistrationDraft,
  loadRegistrationDraft,
  nameCheckUrl,
  nrcLabel,
  saveRegistrationDraft,
  REGISTRATION_DRAFT_KEY,
} from "./registration";
import { CombinedSchema, type CombinedFormValues } from "./schemas";

const form = (overrides: Partial<CombinedFormValues> = {}): CombinedFormValues => ({
  teamName: "Equipo QA",
  members: [
    { nombre: "Ana", apellido: "Pérez", correo: "ana@uninorte.edu.co", codigoEstudiantil: "200190601", nrc: ["3501"] },
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
        members: [{ nombre: " Ana ", apellido: " P ", correo: " Ana@Uninorte.edu.co ", codigoEstudiantil: " 1 ", nrc: ["1"] }],
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
      form({ members: [{ nombre: "   ", apellido: "P", correo: "a@b.co", codigoEstudiantil: "abc!", nrc: ["1"] }] }),
    );
    expect(errors).toContain("members.0.nombre: El nombre es obligatorio");
    expect(errors).toContain("members.0.codigoEstudiantil: El código estudiantil solo puede tener números");
  });

  it("rechaza el mismo correo o código en dos integrantes", () => {
    const errors = errorsOf(
      form({
        members: [
          { nombre: "A", apellido: "B", correo: "a@b.co", codigoEstudiantil: "1", nrc: ["1"] },
          { nombre: "C", apellido: "D", correo: "A@B.co", codigoEstudiantil: "1", nrc: ["1"] },
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
