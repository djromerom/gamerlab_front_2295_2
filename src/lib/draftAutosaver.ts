import {
  clearBackup,
  DraftRequestError,
  isEmptyForm,
  saveDraft,
  toSaveBody,
  writeBackup,
  type DraftForm,
  type ServerDraft,
} from "@/lib/evaluationDrafts";

/**
 * HU-18 (ARK-105): autoguardado del borrador de UN juego.
 * - Espera `delayMs` sin cambios y manda el formulario completo con la `version` conocida.
 * - Una sola petición a la vez: si llega un cambio mientras hay una en vuelo, sale al terminar.
 * - Sin red o con 5xx: deja la copia en localStorage y reintenta cada `retryMs` o al volver la red.
 * - 409 por versión: se detiene hasta que el usuario elija cargar la versión guardada o sobrescribirla.
 * - 409 ya enviada o 403: se detiene para siempre.
 */

export type AutosaveStatus =
  | "idle" // nada que guardar todavía
  | "pending" // hay cambios esperando el debounce
  | "saving"
  | "saved"
  | "offline" // guardado solo en este dispositivo; reintentando
  | "conflict"
  | "error" // 400 / 401: se reintenta con el siguiente cambio
  | "blocked"; // 403 / ya enviada: no se vuelve a guardar

export interface AutosaveState {
  status: AutosaveStatus;
  savedAt: string | null;
  message: string | null;
  conflictDraft: ServerDraft | null;
}

export interface DraftAutosaverOptions {
  videogameId: number;
  version: number;
  onChange: (state: AutosaveState) => void;
  delayMs?: number;
  retryMs?: number;
  save?: typeof saveDraft;
}

export const AUTOSAVE_DELAY_MS = 2500;
export const AUTOSAVE_RETRY_MS = 15000;

export const INITIAL_AUTOSAVE_STATE: AutosaveState = {
  status: "idle",
  savedAt: null,
  message: null,
  conflictDraft: null,
};

export class DraftAutosaver {
  private readonly videogameId: number;
  private readonly delayMs: number;
  private readonly retryMs: number;
  private readonly save: typeof saveDraft;
  private readonly onChange: (state: AutosaveState) => void;

  private version: number;
  private latest: DraftForm | null = null; // último estado del formulario
  private dirty = false; // `latest` todavía no está en el servidor
  private inFlight = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private disposed = false;
  private state: AutosaveState = INITIAL_AUTOSAVE_STATE;

  constructor(options: DraftAutosaverOptions) {
    this.videogameId = options.videogameId;
    this.version = options.version;
    this.onChange = options.onChange;
    this.delayMs = options.delayMs ?? AUTOSAVE_DELAY_MS;
    this.retryMs = options.retryMs ?? AUTOSAVE_RETRY_MS;
    this.save = options.save ?? saveDraft;
    if (typeof window !== "undefined") window.addEventListener("online", this.handleOnline);
  }

  get currentVersion(): number {
    return this.version;
  }

  get currentState(): AutosaveState {
    return this.state;
  }

  /** Registra un cambio del formulario y programa el guardado. */
  schedule(form: DraftForm): void {
    if (this.stopped || this.disposed) return;
    this.latest = form;
    this.dirty = true;
    writeBackup(this.videogameId, form);
    if (this.state.status === "conflict" || this.state.status === "blocked") return;
    this.clearTimer();
    if (!this.inFlight) this.setState({ status: "pending" });
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }

  /** Manda ya lo pendiente (al salir de la pantalla, o tras sincronizar lo local). */
  async flush(): Promise<void> {
    this.clearTimer();
    if (this.stopped || !this.dirty || !this.latest) return;
    if (this.state.status === "conflict" || this.state.status === "blocked") return;
    if (this.inFlight) return; // sale al terminar la que está en vuelo

    const form = this.latest;
    // Sin borrador en el servidor y formulario vacío: no hay nada que crear.
    if (this.version === 0 && isEmptyForm(form)) {
      this.dirty = false;
      clearBackup(this.videogameId);
      this.setState({ status: "idle" });
      return;
    }

    this.dirty = false;
    this.inFlight = true;
    this.setState({ status: "saving", message: null });

    try {
      const saved = await this.save(this.videogameId, toSaveBody(form, this.version));
      this.inFlight = false;
      if (this.stopped) return;
      this.version = saved.version;
      if (!this.dirty) clearBackup(this.videogameId);
      this.setState({ status: this.dirty ? "pending" : "saved", savedAt: saved.updatedAt, message: null });
      if (this.dirty) void this.flush();
    } catch (error) {
      this.inFlight = false;
      // Tras salir de la pantalla no se reintenta: la copia local se recupera al volver.
      if (this.stopped || this.disposed) return;
      this.dirty = true; // lo que no llegó sigue pendiente
      this.handleError(error);
    }
  }

  /**
   * Resuelve un 409 por versión.
   * - "overwrite": manda lo de esta pantalla sobre la versión actual del servidor.
   * - "load": adopta la versión del servidor; devuelve el borrador para llenar el formulario.
   */
  resolveConflict(choice: "overwrite" | "load"): ServerDraft | null {
    const remote = this.state.conflictDraft;
    if (this.state.status !== "conflict") return null;
    // Sin borrador activo en el servidor (lo descartaron): se crea otra vez con versión 0.
    this.version = remote?.version ?? 0;
    if (choice === "load") {
      this.dirty = false;
      this.latest = null;
      clearBackup(this.videogameId);
      this.setState({
        status: remote ? "saved" : "idle",
        savedAt: remote?.updatedAt ?? null,
        conflictDraft: null,
        message: null,
      });
      return remote;
    }
    this.dirty = true;
    this.setState({ status: "pending", conflictDraft: null, message: null });
    void this.flush();
    return null;
  }

  /** La evaluación se envió: no se vuelve a guardar y se borra la copia local. */
  stop(): void {
    this.stopped = true;
    this.clearTimer();
    clearBackup(this.videogameId);
  }

  /** La pantalla se desmonta: manda lo pendiente y deja de notificar. */
  dispose(): void {
    if (typeof window !== "undefined") window.removeEventListener("online", this.handleOnline);
    this.disposed = true;
    void this.flush();
  }

  private handleError(error: unknown): void {
    const draftError =
      error instanceof DraftRequestError
        ? error
        : new DraftRequestError("network", error instanceof Error ? error.message : "Sin conexión");

    switch (draftError.kind) {
      case "conflict":
        this.setState({ status: "conflict", message: draftError.message, conflictDraft: draftError.draft });
        return;
      case "submitted":
        this.stopped = true;
        clearBackup(this.videogameId);
        this.setState({ status: "blocked", message: draftError.message });
        return;
      case "forbidden":
        // Se conserva la copia local: puede que le devuelvan el grupo.
        this.stopped = true;
        this.setState({ status: "blocked", message: draftError.message });
        return;
      case "network":
        this.setState({ status: "offline", message: null });
        this.clearTimer();
        this.timer = setTimeout(() => void this.flush(), this.retryMs);
        return;
      default:
        this.setState({ status: "error", message: draftError.message });
    }
  }

  private readonly handleOnline = () => {
    if (this.state.status === "offline") void this.flush();
  };

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private setState(patch: Partial<AutosaveState>) {
    this.state = { ...this.state, ...patch };
    if (!this.disposed) this.onChange(this.state);
  }
}
