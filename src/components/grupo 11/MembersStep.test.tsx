import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MembersStep from "@/components/grupo 11/MembersStep";
import { Form } from "@/components/ui/form";
import {
  CombinedSchema,
  EMAIL_MISMATCH_MESSAGE,
  NO_PASTE_MESSAGE,
  type CombinedFormValues,
} from "@/lib/schemas";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const next = vi.fn();
vi.mock("@/contexts/MultiFormContext", () => ({
  useMultiForm: () => ({ step: 1, next, back: vi.fn(), reset: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const NRC_OPTIONS = [
  { code: "3501", subjectId: 1, subject: { id: 1, name: "Programación I", abrevName: "Prog I" } },
];

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

function Harness({ correo = "", confirmarCorreo = "" }: { correo?: string; confirmarCorreo?: string }) {
  const methods = useForm<CombinedFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CombinedSchema) as any,
    defaultValues: {
      members: [
        { nombre: "Ana", apellido: "Pérez", correo, confirmarCorreo, codigoEstudiantil: "200190601", nrc: ["3501"] },
      ],
    },
  });
  return (
    <Form {...methods}>
      <MembersStep />
    </Form>
  );
}

const renderStep = async (values?: { correo?: string; confirmarCorreo?: string }) => {
  render(<Harness {...values} />);
  await waitFor(() => expect(screen.queryByText("Cargando NRCs...")).toBeNull());
  return {
    correo: screen.getByLabelText("Correo Institucional") as HTMLInputElement,
    confirmar: screen.getByLabelText("Repite tu correo") as HTMLInputElement,
  };
};

const calledPaths = () => vi.mocked(apiFetch).mock.calls.map(([url]) => String(url));

describe("MembersStep: repetir el correo sin pegar (ARK-168)", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockImplementation(async (url) =>
      String(url).includes("/nrcs/") ? jsonResponse(NRC_OPTIONS) : jsonResponse({}),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra el campo «Repite tu correo» para cada integrante", async () => {
    await renderStep();
    expect(screen.getAllByLabelText("Repite tu correo")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Agregar integrante/ }));
    expect(screen.getAllByLabelText("Repite tu correo")).toHaveLength(2);
  });

  it.each(["Correo Institucional", "Repite tu correo"])(
    "«%s» no deja pegar texto y avisa por qué",
    async (label) => {
      await renderStep();
      const input = screen.getByLabelText(label);

      // fireEvent devuelve false cuando el componente cancela el evento
      expect(fireEvent.paste(input, { clipboardData: { getData: () => "ana@uninorte.edu.co" } })).toBe(false);
      expect((input as HTMLInputElement).value).toBe("");
      expect(toast.info).toHaveBeenCalledWith(NO_PASTE_MESSAGE, expect.anything());
    },
  );

  it.each(["Correo Institucional", "Repite tu correo"])(
    "«%s» no deja soltar texto arrastrado",
    async (label) => {
      await renderStep();
      expect(fireEvent.drop(screen.getByLabelText(label))).toBe(false);
    },
  );

  it("si los correos no coinciden muestra el error y no avanza ni consulta la API", async () => {
    const { confirmar } = await renderStep({ correo: "ana@uninorte.edu.co" });
    fireEvent.change(confirmar, { target: { value: "ana@uninrte.edu.co" } });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText(EMAIL_MISMATCH_MESSAGE)).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
    expect(calledPaths().some((path) => path.includes("validate-emails"))).toBe(false);
  });

  it("si falta repetir el correo pide escribirlo y no avanza", async () => {
    await renderStep({ correo: "ana@uninorte.edu.co" });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Repite el correo")).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  it("avanza cuando coinciden aunque cambien mayúsculas y espacios en los extremos", async () => {
    const { correo, confirmar } = await renderStep();
    fireEvent.change(correo, { target: { value: "Ana@Uninorte.edu.co" } });
    fireEvent.change(confirmar, { target: { value: "  ana@UNINORTE.edu.co " } });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(EMAIL_MISMATCH_MESSAGE)).toBeNull();
  });
});

const SUBJECT_OPTIONS = [
  { code: "3031", subjectId: 3, subject: { id: 3, name: "Estructura de Datos I", abrevName: "EDI" }, professorName: "Ana Ruiz" },
  { code: "3032", subjectId: 3, subject: { id: 3, name: "Estructura de Datos I", abrevName: "EDI" }, professorName: "Pedro Lara" },
  { code: "3041", subjectId: 4, subject: { id: 4, name: "Programación Orientada a Objetos", abrevName: "POO" }, professorName: "Sofía Mejía" },
];

const member = (n: number, nrc: string[]) => ({
  nombre: `Nombre${n}`,
  apellido: `Apellido${n}`,
  correo: `persona${n}@uninorte.edu.co`,
  confirmarCorreo: `persona${n}@uninorte.edu.co`,
  codigoEstudiantil: `20019060${n}`,
  nrc,
});

function TeamHarness({ members }: { members: CombinedFormValues["members"] }) {
  const methods = useForm<CombinedFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CombinedSchema) as any,
    defaultValues: { members },
  });
  return (
    <Form {...methods}>
      <MembersStep />
    </Form>
  );
}

const renderTeam = async (members: CombinedFormValues["members"]) => {
  render(<TeamHarness members={members} />);
  await waitFor(() => expect(screen.queryByText("Cargando NRCs...")).toBeNull());
};

const chip = (abrev: string, index = 0) => screen.getAllByRole("button", { name: abrev })[index];

describe("MembersStep: materias como botones y un NRC por materia (HU-31, ARK-193)", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockImplementation(async (url) =>
      String(url).includes("/nrcs/") ? jsonResponse(SUBJECT_OPTIONS) : jsonResponse({}),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra las materias como botones y ningún desplegable hasta marcar una", async () => {
    await renderTeam([member(1, [])]);

    expect(screen.getByText("¿Por qué materias participa?")).toBeTruthy();
    expect(chip("EDI").getAttribute("aria-pressed")).toBe("false");
    expect(chip("POO").getAttribute("title")).toBe("Programación Orientada a Objetos");
    expect(screen.queryByText(/^NRC de/)).toBeNull();

    fireEvent.click(chip("POO"));

    expect(chip("POO").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("NRC de Programación Orientada a Objetos").textContent).toContain(
      "Selecciona el NRC",
    );
  });

  it("muestra el NRC elegido con su profesor", async () => {
    await renderTeam([member(1, ["3032"])]);

    expect(chip("EDI").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("NRC de Estructura de Datos I").textContent).toContain(
      "3032 · Prof. Pedro Lara",
    );
  });

  it("sin materias pide marcar una y no avanza", async () => {
    await renderTeam([member(1, [])]);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Marca al menos una materia y elige su NRC")).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  it("una materia marcada sin NRC pide su NRC y no avanza", async () => {
    await renderTeam([member(1, ["3031"])]);
    fireEvent.click(chip("POO"));

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Elige el NRC de Programación Orientada a Objetos")).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  it("al desmarcar una materia se quita su NRC", async () => {
    await renderTeam([member(1, ["3031", "3041"])]);

    fireEvent.click(chip("POO"));

    expect(chip("POO").getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByLabelText("NRC de Programación Orientada a Objetos")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
  });

  it.each([
    ["1 materia, 1 integrante", [member(1, ["3031"])]],
    ["2 materias, 1 integrante", [member(1, ["3031", "3041"])]],
    [
      "2 materias, 5 integrantes con NRC distintos",
      [
        member(1, ["3031", "3041"]),
        member(2, ["3032", "3041"]),
        member(3, ["3031"]),
        member(4, ["3041"]),
        member(5, ["3032", "3041"]),
      ],
    ],
  ])("avanza con %s", async (_label, members) => {
    await renderTeam(members);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    // Con 5 integrantes ya no se pueden agregar más
    if (members.length === 5) expect(screen.queryByRole("button", { name: /Agregar integrante/ })).toBeNull();
  });

  it("copia las materias y NRC del integrante anterior", async () => {
    await renderTeam([member(1, ["3032", "3041"]), member(2, [])]);

    expect(chip("EDI", 1).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Copiar del integrante anterior" }));

    expect(chip("EDI", 1).getAttribute("aria-pressed")).toBe("true");
    expect(chip("POO", 1).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByLabelText("NRC de Estructura de Datos I")[1].textContent).toContain(
      "3032 · Prof. Pedro Lara",
    );
  });
});

const CHAIN_OPTIONS = [
  { code: "3011", subjectId: 2, subject: { id: 2, name: "Algoritmia y Programación I", abrevName: "AYP" } },
  { code: "3021", subjectId: 3, subject: { id: 3, name: "Algoritmia y Programación II", abrevName: "AYP" } },
  { code: "3041", subjectId: 4, subject: { id: 4, name: "Programación Orientada a Objetos", abrevName: "POO" } },
  { code: "3042", subjectId: 4, subject: { id: 4, name: "Programación Orientada a Objetos", abrevName: "POO" } },
  { code: "3051", subjectId: 5, subject: { id: 5, name: "Estructuras de Datos I", abrevName: "EDD" } },
  { code: "3061", subjectId: 1, subject: { id: 1, name: "Estructuras de Datos II", abrevName: "EDD" } },
];

describe("MembersStep: prerrequisitos y materia compartida (ARK-193)", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockImplementation(async (url) =>
      String(url).includes("/nrcs/") ? jsonResponse(CHAIN_OPTIONS) : jsonResponse({}),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const pressed = (abrev: string) => chip(abrev).getAttribute("aria-pressed");
  const blocked = (abrev: string) => chip(abrev).getAttribute("aria-disabled") === "true";

  it("con Algoritmia I marcada no deja marcar ninguna otra", async () => {
    await renderTeam([member(1, [])]);
    fireEvent.click(chip("AYP · I"));

    for (const other of ["AYP · II", "POO", "EDD · I", "EDD · II"]) {
      expect(blocked(other)).toBe(true);
      fireEvent.click(chip(other));
      expect(pressed(other)).toBe("false");
    }
    expect(chip("POO").getAttribute("title")).toContain("Algoritmia y Programación I");
  });

  it("deja POO con una Estructura de Datos, pero no las dos Estructuras juntas", async () => {
    await renderTeam([member(1, [])]);
    fireEvent.click(chip("POO"));
    expect(blocked("EDD · I")).toBe(false);
    expect(blocked("EDD · II")).toBe(false);
    expect(blocked("AYP · II")).toBe(true);

    fireEvent.click(chip("EDD · II"));
    expect(pressed("EDD · II")).toBe("true");
    expect(blocked("EDD · I")).toBe(true);
  });

  it("al desmarcar se vuelven a habilitar las demás", async () => {
    await renderTeam([member(1, [])]);
    fireEvent.click(chip("AYP · I"));
    fireEvent.click(chip("AYP · I"));
    expect(blocked("POO")).toBe(false);
  });

  it("no avanza si una combinación inválida llega ya guardada", async () => {
    await renderTeam([member(1, ["3051", "3061"])]);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText(/no se pueden marcar juntas/)).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  it("no avanza si un integrante no comparte ninguna materia con los anteriores", async () => {
    // 1: POO · 2: EDD II
    await renderTeam([member(1, ["3041"]), member(2, ["3061"])]);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText(/Debe compartir al menos una materia/)).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  it("avanza si comparten la materia aunque tengan NRC distintos", async () => {
    // los dos en POO, uno en el NRC 3041 y otro en el 3042
    await renderTeam([member(1, ["3041"]), member(2, ["3042"])]);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
  });

  it("avanza con un equipo encadenado por materia", async () => {
    // 1: EDD I + POO · 2: solo POO · 3: POO + EDD II
    await renderTeam([member(1, ["3051", "3041"]), member(2, ["3041"]), member(3, ["3041", "3061"])]);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
  });

  it("la lista de integrantes no tiene un scroll propio", async () => {
    await renderTeam([member(1, [])]);
    const list = screen.getByTestId("members-list");
    expect(list.style.maxHeight).toBe("");
    expect(list.style.overflowY).toBe("");
    expect(list.className).not.toContain("overflow");
  });
});
