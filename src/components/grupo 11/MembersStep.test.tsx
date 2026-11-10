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
