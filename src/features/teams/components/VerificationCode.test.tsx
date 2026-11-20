import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerificationCode, {
  EXTERNAL_PRESENTER_NOTICE,
} from "@/features/teams/components/VerificationCode";
import type { MyVerificationCode } from "@/features/teams/api/teamVerification";

const auth = vi.hoisted(() => ({ userRole: "Estudiante" as string }));
const fetchMyVerificationCode = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/features/teams/api/teamVerification", () => ({
  fetchMyVerificationCode: () => fetchMyVerificationCode(),
}));

const myCode = (extra: Partial<MyVerificationCode>): MyVerificationCode => ({
  teamId: 654,
  teamCode: "N1-AYP-119",
  verificationCode: "K7M2QX",
  notGradable: false,
  ...extra,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  auth.userRole = "Estudiante";
});

describe("Código de verificación en /inicio (HU-19 / ARK-258)", () => {
  it("un equipo normal ve su código y «Díselo al jurado»", async () => {
    fetchMyVerificationCode.mockResolvedValue(myCode({}));
    render(<VerificationCode />);

    expect(await screen.findByText("K7M2QX")).toBeTruthy();
    expect(screen.getByText(/Díselo al jurado/)).toBeTruthy();
  });

  it("un presentador externo ve el aviso, sin código ni «Díselo al jurado»", async () => {
    fetchMyVerificationCode.mockResolvedValue(myCode({ verificationCode: null, notGradable: true }));
    render(<VerificationCode />);

    expect(await screen.findByText(EXTERNAL_PRESENTER_NOTICE)).toBeTruthy();
    expect(EXTERNAL_PRESENTER_NOTICE).toBe(
      "Tu equipo participa como presentador externo: no recibe calificación.",
    );
    expect(screen.queryByText("Código de verificación")).toBeNull();
    expect(screen.queryByText(/Díselo al jurado/)).toBeNull();
  });

  it("un equipo de colegios (N0) no ve nada", async () => {
    fetchMyVerificationCode.mockResolvedValue(
      myCode({ teamCode: "N0-COL-001", verificationCode: null }),
    );
    const { container } = render(<VerificationCode />);

    await vi.waitFor(() => expect(fetchMyVerificationCode).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.textContent).toBe(""));
    expect(screen.queryByText(EXTERNAL_PRESENTER_NOTICE)).toBeNull();
  });

  it("un back anterior sin `notGradable` sigue mostrando el código", async () => {
    const { notGradable: _omitido, ...sinCampo } = myCode({});
    fetchMyVerificationCode.mockResolvedValue(sinCampo);
    render(<VerificationCode />);

    expect(await screen.findByText("K7M2QX")).toBeTruthy();
  });

  it("si no es estudiante no consulta el código", () => {
    auth.userRole = "Jurado";
    const { container } = render(<VerificationCode />);

    expect(container.textContent).toBe("");
    expect(fetchMyVerificationCode).not.toHaveBeenCalled();
  });
});
