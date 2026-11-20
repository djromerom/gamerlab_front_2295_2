import { describe, expect, it } from "vitest";
import {
  emailsMatch,
  formatSentAt,
  parsePresentersTable,
  validatePresenter,
} from "@/features/external-presenters/lib/externalPresenters";

const VALID = {
  email: "ana@empresa.com",
  confirmEmail: "ana@empresa.com",
  firstName: "Ana María",
  lastName: "Pérez-Núñez",
};

describe("Presentadores externos: validación del formulario (HU-33)", () => {
  it("acepta un registro válido sin organización ni título", () => {
    expect(validatePresenter(VALID)).toEqual({});
  });

  it("compara los correos sin distinguir mayúsculas ni espacios (HU-32)", () => {
    expect(emailsMatch("Ana@Empresa.com ", "ana@empresa.com")).toBe(true);
    expect(emailsMatch("ana@empresa.com", "ana@empresa.co")).toBe(false);
    expect(validatePresenter({ ...VALID, confirmEmail: " ANA@EMPRESA.COM" })).toEqual({});
  });

  it("marca correos distintos, vacíos o mal escritos", () => {
    expect(validatePresenter({ ...VALID, confirmEmail: "otra@empresa.com" }).confirmEmail).toBe(
      "Los correos no coinciden",
    );
    expect(validatePresenter({ ...VALID, confirmEmail: "" }).confirmEmail).toBe("Repite el correo");
    expect(validatePresenter({ ...VALID, email: "ana@", confirmEmail: "ana@" }).email).toBe(
      "El correo no es válido",
    );
  });

  it("exige nombre y apellido con letras, números o espacios y hasta 50 caracteres", () => {
    expect(validatePresenter({ ...VALID, firstName: "  " }).firstName).toBe("El nombre es obligatorio");
    expect(validatePresenter({ ...VALID, lastName: "Pérez!" }).lastName).toBe(
      "El apellido solo puede contener letras, números y espacios",
    );
    expect(validatePresenter({ ...VALID, firstName: "a".repeat(51) }).firstName).toMatch(/50 caracteres/);
  });

  it("acepta números en el nombre y el apellido, igual que el back (ARK-247 / BG-57)", () => {
    expect(validatePresenter({ ...VALID, firstName: "DJ 2Pac", lastName: "Pérez 3" })).toEqual({});
  });

  it("limita la organización a 150 y el título a 200 caracteres", () => {
    const errors = validatePresenter({
      ...VALID,
      organization: "o".repeat(151),
      presentationTitle: "t".repeat(201),
    });
    expect(errors.organization).toMatch(/150/);
    expect(errors.presentationTitle).toMatch(/200/);
  });

  it("al editar (sin correos) solo revisa nombre y datos del certificado", () => {
    expect(validatePresenter({ firstName: "Ana", lastName: "Pérez" })).toEqual({});
  });
});

describe("Presentadores externos: carga por lote", () => {
  it("lee una tabla pegada de Excel (tabuladores) e ignora el encabezado", () => {
    const { rows, tooMany } = parsePresentersTable(
      "Correo\tNombre\tApellido\tOrganización\tTítulo\n" +
        "ana@empresa.com\tAna\tPérez\tEstudio Indie\tNiveles\n" +
        "\n" +
        "luis@empresa.com\tLuis\tGómez\n",
    );
    expect(tooMany).toBe(false);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      line: 2,
      errors: [],
      input: {
        email: "ana@empresa.com",
        confirmEmail: "ana@empresa.com",
        firstName: "Ana",
        lastName: "Pérez",
        organization: "Estudio Indie",
        presentationTitle: "Niveles",
      },
    });
    expect(rows[1].line).toBe(4);
    expect(rows[1].input.organization).toBeUndefined();
    expect(rows[1].input.presentationTitle).toBeUndefined();
  });

  it("lee CSV con «;» (Excel en español) y con «,» respetando comillas", () => {
    // Excel guarda los «CSV UTF-8» con la marca U+FEFF al inicio
    const bom = String.fromCharCode(0xfeff);
    const semicolon = parsePresentersTable(`${bom}ana@empresa.com;Ana;Pérez;Estudio;Diseño, niveles`);
    expect(semicolon.rows[0].input.email).toBe("ana@empresa.com");
    expect(semicolon.rows[0].errors).toEqual([]);
    expect(semicolon.rows[0].input.presentationTitle).toBe("Diseño, niveles");

    const comma = parsePresentersTable('ana@empresa.com,Ana,Pérez,"Estudio, S.A.","Título ""largo"""');
    expect(comma.rows[0].input.organization).toBe("Estudio, S.A.");
    expect(comma.rows[0].input.presentationTitle).toBe('Título "largo"');
  });

  it("marca por fila los errores de formato y los correos repetidos", () => {
    const { rows } = parsePresentersTable(
      "ana@empresa.com;Ana;Pérez\nmal-correo;Luis;Gómez\nANA@empresa.com;Ana;Otra\nluz@empresa.com;;Ruiz",
    );
    expect(rows[0].errors).toEqual([]);
    expect(rows[1].errors).toContain("El correo no es válido");
    expect(rows[2].errors).toContain("Correo repetido (también en la línea 1)");
    expect(rows[3].errors).toContain("El nombre es obligatorio");
  });

  it("avisa si hay más de 100 filas", () => {
    const text = Array.from({ length: 101 }, (_, i) => `p${i}@empresa.com;Ana;Pérez`).join("\n");
    expect(parsePresentersTable(text).tooMany).toBe(true);
  });

  it("un texto vacío no produce filas", () => {
    expect(parsePresentersTable("  \n\n")).toEqual({ rows: [], tooMany: false });
  });
});

describe("Presentadores externos: fecha de envío del certificado", () => {
  it("se muestra en hora de Colombia", () => {
    // 07:47 UTC = 02:47 a. m. en Bogotá (UTC-5)
    const text = formatSentAt("2026-11-08T07:47:16.279Z");
    expect(text).toMatch(/8 de noviembre de 2026/);
    expect(text).toMatch(/2:47/);
  });
});
