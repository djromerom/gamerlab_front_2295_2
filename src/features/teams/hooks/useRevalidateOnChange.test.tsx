import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { afterEach, describe, expect, it } from "vitest";
import { useRevalidateOnChange } from "./useRevalidateOnChange";

const schema = z.object({ teamName: z.string().min(3, "Mínimo 3 caracteres") });
type Values = z.infer<typeof schema>;

let form: UseFormReturn<Values>;

function TeamNameField() {
  form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { teamName: "" } });
  useRevalidateOnChange(form);
  const error = form.formState.errors.teamName?.message;
  return (
    <>
      <input aria-label="Nombre del equipo" {...form.register("teamName")} />
      {error && <p role="alert">{error}</p>}
    </>
  );
}

afterEach(cleanup);

describe("useRevalidateOnChange (BG-66)", () => {
  it("el error del esquema se va al corregir, sin volver a pulsar «Siguiente»", async () => {
    render(<TeamNameField />);
    await act(() => form.trigger("teamName"));
    expect(screen.getByRole("alert").textContent).toBe("Mínimo 3 caracteres");

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: "Byte Club" } });
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("un error puesto a mano («ya existe») también se va al cambiar el nombre", async () => {
    render(<TeamNameField />);
    act(() => form.setError("teamName", { type: "manual", message: "Ya existe un equipo con este nombre" }));
    expect(screen.getByRole("alert")).toBeTruthy();

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: "Otro nombre" } });
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
