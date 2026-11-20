import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { juryManagement } from "@/features/jurors/management/api/juryManagement";
import { JuryManagementTable } from "./JuryManagementTable";
import type { JurorRowData } from "@/features/jurors/management/lib/utils";

const fetchMock = vi.fn();

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchMock }));
vi.mock("@/features/jurors/management/api/juryManagement", () => ({
  juryManagement: {
    getIncompleteJurors: vi.fn().mockResolvedValue([]),
    getAllJuries: vi.fn().mockResolvedValue([]),
  },
}));
// Los diálogos de asignar/quitar tienen sus propias pruebas; aquí solo importa que avisen a la tabla.
vi.mock("./ManualAssignTeamDialog", () => ({
  ManualAssignTeamDialog: ({ juror, onAssigned }: { juror: JurorRowData; onAssigned: () => void }) => (
    <button onClick={onAssigned}>{`Asignar a ${juror.firstName}`}</button>
  ),
}));
vi.mock("./RemoveTeamDialog", () => ({
  RemoveTeamDialog: ({ juror, onRemoved }: { juror: JurorRowData; onRemoved: () => void }) => (
    <button onClick={onRemoved}>{`Quitar a ${juror.firstName}`}</button>
  ),
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    loading: vi.fn(),
  },
}));

const baseJuror: JurorRowData = {
  id: "j-1",
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@test.com",
  confirmationStatusId: "Confirmado",
  lastSignInAt: "Nunca",
  jurorCategory: "SENIOR",
  jurorType: "BACKUP",
  evaluatedCount: 0,
  evaluatedGameNames: [],
  unevaluatedCount: 0,
  unevaluatedGameNames: [],
};

const legacyJuror: JurorRowData = {
  ...baseJuror,
  id: "j-2",
  firstName: "Luis",
  lastName: "Gómez",
  email: "luis@test.com",
  jurorCategory: null,
  jurorType: null,
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const renderTable = (jurors: JurorRowData[] = [baseJuror]) => {
  const onPageChange = vi.fn();
  const refreshData = vi.fn();
  render(
    <JuryManagementTable
      jurors={jurors}
      paginationMeta={{ totalItems: jurors.length, itemsOnCurrentPage: jurors.length, currentPage: 1, itemsPerPage: 10, totalPages: 1 }}
      apiBaseUrl="http://api.test"
      onPageChange={onPageChange}
      onLimitChange={vi.fn()}
      refreshData={refreshData}
    />,
  );
  return { onPageChange, refreshData };
};

const openAddDialog = () => {
  fireEvent.click(screen.getByRole("button", { name: "Agregar nuevo jurado" }));
  fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Carla" } });
  fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Ruiz" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "carla@test.com" } });
};

const openEditDialog = (rowIndex: number) => {
  fireEvent.keyDown(screen.getAllByRole("button", { name: "Abrir menú" })[rowIndex], { key: "Enter" });
  fireEvent.click(screen.getByText("Editar"));
};

const sentBody = (callIndex = 0) => JSON.parse(fetchMock.mock.calls[callIndex][1].body as string);

describe("JuryManagementTable (Personal → Jurados)", () => {
  beforeAll(() => {
    // Radix (menú desplegable) usa ResizeObserver, que jsdom no trae.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  afterEach(cleanup);

  it("muestra la categoría y el tipo de cada jurado en el listado", () => {
    renderTable([baseJuror, legacyJuror]);

    expect(screen.getByRole("columnheader", { name: "Categoría" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Tipo" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Senior" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Suplente" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Sin categoría" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Sin tipo" })).toBeTruthy();
  });

  it("el buscador consulta todos los jurados y filtra por nombre", async () => {
    const otherPageJuror = { ...baseJuror, id: "j-9", firstName: "Marta", lastName: "Díaz", email: "marta@test.com" };
    vi.mocked(juryManagement.getAllJuries).mockResolvedValueOnce([baseJuror, legacyJuror, otherPageJuror] as never);
    renderTable([baseJuror]);

    fireEvent.change(screen.getByPlaceholderText("Buscar jurado por nombre o email..."), { target: { value: "marta" } });

    await waitFor(() => expect(screen.getByRole("cell", { name: "Marta Díaz" })).toBeTruthy());
    expect(screen.queryByRole("cell", { name: "Ana Pérez" })).toBeNull();
    expect(juryManagement.getAllJuries).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  describe("ARK-244: con el buscador activo", () => {
    const search = (text: string) =>
      fireEvent.change(screen.getByPlaceholderText("Buscar jurado por nombre o email..."), { target: { value: text } });

    // Así llega un jurado del backend: estado numérico y fecha ISO en UTC
    const rawJuror = {
      ...baseJuror,
      confirmationStatusId: 1,
      lastSignInAt: "2026-11-16T18:39:54.423Z",
      evaluatedCount: 5, // distinto de los pendientes, para ubicar el botón por su número
      unevaluatedCount: 1,
    } as JurorRowData;

    beforeEach(() => {
      vi.mocked(juryManagement.getAllJuries).mockReset();
    });

    it("al asignar un equipo, vuelve a pedir la lista completa y la fila se actualiza", async () => {
      vi.mocked(juryManagement.getAllJuries)
        .mockResolvedValueOnce([rawJuror] as never)
        .mockResolvedValueOnce([{ ...rawJuror, unevaluatedCount: 2 }] as never);
      const { refreshData } = renderTable([baseJuror]);

      search("ana");
      await waitFor(() => expect(screen.getByRole("button", { name: "1" })).toBeTruthy());

      fireEvent.click(screen.getByRole("button", { name: "Asignar a Ana" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "2" })).toBeTruthy());
      expect(juryManagement.getAllJuries).toHaveBeenCalledTimes(2);
      expect(refreshData).toHaveBeenCalledTimes(1);
    });

    it("al quitar un equipo, vuelve a pedir la lista completa", async () => {
      vi.mocked(juryManagement.getAllJuries)
        .mockResolvedValueOnce([rawJuror] as never)
        .mockResolvedValueOnce([{ ...rawJuror, unevaluatedCount: 0 }] as never);
      const { refreshData } = renderTable([baseJuror]);

      search("ana");
      await waitFor(() => expect(screen.getByRole("button", { name: "1" })).toBeTruthy());

      fireEvent.click(screen.getByRole("button", { name: "Quitar a Ana" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "0" })).toBeTruthy());
      expect(juryManagement.getAllJuries).toHaveBeenCalledTimes(2);
      expect(refreshData).toHaveBeenCalledTimes(1);
    });

    it("no vuelve a pedir la lista completa en cada tecla", async () => {
      vi.mocked(juryManagement.getAllJuries).mockResolvedValue([rawJuror] as never);
      renderTable([baseJuror]);

      search("a");
      await waitFor(() => expect(screen.getByRole("cell", { name: "Ana Pérez" })).toBeTruthy());
      search("an");
      search("ana");

      expect(juryManagement.getAllJuries).toHaveBeenCalledTimes(1);
    });

    it("sin búsqueda, asignar solo recarga la página actual", () => {
      const { refreshData } = renderTable([baseJuror]);

      fireEvent.click(screen.getByRole("button", { name: "Asignar a Ana" }));

      expect(refreshData).toHaveBeenCalledTimes(1);
      expect(juryManagement.getAllJuries).not.toHaveBeenCalled();
    });

    it("«Última conexión» y «Estado» salen con el mismo formato que sin buscador (hora de Bogotá)", async () => {
      vi.mocked(juryManagement.getAllJuries).mockResolvedValueOnce([rawJuror] as never);
      renderTable([baseJuror]);

      search("ana");

      // 18:39 UTC = 13:39 en Bogotá (UTC-5)
      await waitFor(() => expect(screen.getByRole("cell", { name: "16/11/2026, 13:39" })).toBeTruthy());
      expect(screen.queryByText("2026-11-16T18:39:54.423Z")).toBeNull();
      expect(screen.getByRole("cell", { name: "Confirmado" })).toBeTruthy();
    });
  });

  it("al agregar, la categoría y el tipo quedan en Junior y Oficial por defecto y se envían", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "nuevo" }, 201));
    const { onPageChange, refreshData } = renderTable();

    openAddDialog();
    expect((screen.getByLabelText("Categoría") as HTMLSelectElement).value).toBe("JUNIOR");
    expect((screen.getByLabelText("Tipo") as HTMLSelectElement).value).toBe("OFFICIAL");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/juror", expect.objectContaining({ method: "POST" }));
    expect(sentBody()).toEqual({
      firstName: "Carla",
      lastName: "Ruiz",
      email: "carla@test.com",
      jurorCategory: "JUNIOR",
      jurorType: "OFFICIAL",
    });
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalledWith("Jurado agregado exitosamente.");
  });

  it("al agregar, envía la categoría y el tipo elegidos", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "nuevo" }, 201));
    const { refreshData } = renderTable();

    openAddDialog();
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "SENIOR" } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "BACKUP" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(sentBody()).toMatchObject({ jurorCategory: "SENIOR", jurorType: "BACKUP" });
  });

  it("si el backend rechaza el alta, muestra su mensaje y no cierra el formulario", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { statusCode: 400, error: "Bad Request", message: ["La categoría del jurado es obligatoria", "El tipo de jurado es obligatorio"] },
        400,
      ),
    );
    const { refreshData } = renderTable();

    openAddDialog();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "La categoría del jurado es obligatoria. El tipo de jurado es obligatorio",
      ),
    );
    expect(refreshData).not.toHaveBeenCalled();
    expect(screen.getByText("Agregar Nuevo Jurado")).toBeTruthy();
  });

  it("al editar, carga la categoría y el tipo del jurado y envía los cambios", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "j-1" }));
    const { refreshData } = renderTable();

    openEditDialog(0);
    expect((screen.getByLabelText("Categoría") as HTMLSelectElement).value).toBe("SENIOR");
    expect((screen.getByLabelText("Tipo") as HTMLSelectElement).value).toBe("BACKUP");

    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "JUNIOR" } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "OFFICIAL" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/juror/j-1", expect.objectContaining({ method: "PATCH" }));
    expect(sentBody()).toEqual({
      firstName: "Ana",
      lastName: "Pérez",
      jurorCategory: "JUNIOR",
      jurorType: "OFFICIAL",
    });
  });

  it("al editar un jurado sin categoría ni tipo, propone Junior y Oficial", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "j-2" }));
    const { refreshData } = renderTable([legacyJuror]);

    openEditDialog(0);
    expect((screen.getByLabelText("Categoría") as HTMLSelectElement).value).toBe("JUNIOR");
    expect((screen.getByLabelText("Tipo") as HTMLSelectElement).value).toBe("OFFICIAL");

    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(sentBody()).toMatchObject({ jurorCategory: "JUNIOR", jurorType: "OFFICIAL" });
  });

  it("ARK-139: al editar un profesor, la categoría queda fija en Senior y se puede cambiar el tipo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "p-1" }));
    const professor: JurorRowData = {
      ...legacyJuror,
      id: "p-1",
      firstName: "Rocío",
      lastName: "Díaz",
      email: "rocio@test.com",
      isProfessor: true,
    };
    const { refreshData } = renderTable([professor]);

    openEditDialog(0);
    const category = screen.getByLabelText("Categoría") as HTMLSelectElement;
    expect(category.value).toBe("SENIOR");
    expect(category.disabled).toBe(true);
    expect(screen.getByText("Los profesores siempre son Senior; solo se puede cambiar el tipo.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "BACKUP" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/juror/p-1", expect.objectContaining({ method: "PATCH" }));
    expect(sentBody()).toMatchObject({ jurorCategory: "SENIOR", jurorType: "BACKUP" });
  });

  it("al editar un jurado que no es profesor, la categoría se puede cambiar", () => {
    renderTable([{ ...baseJuror, isProfessor: false }]);

    openEditDialog(0);
    expect((screen.getByLabelText("Categoría") as HTMLSelectElement).disabled).toBe(false);
  });

  it("si el backend rechaza la edición, muestra su mensaje", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ statusCode: 404, message: "Jurado no encontrado" }, 404));
    const { refreshData } = renderTable();

    openEditDialog(0);
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Jurado no encontrado"));
    expect(refreshData).not.toHaveBeenCalled();
  });
});
