import { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { AlertCircle, Camera, Loader2, QrCode, Search, UserCheck } from "lucide-react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLockViewportZoom } from "@/hooks/useLockViewportZoom";
import { useAuth } from "@/contexts/AuthContext";
import { jurorCategoryForViewer } from "@/lib/jurorLabel";
import {
  checkInJurorManually,
  scanJurorBadge,
  searchJurors,
  type CheckInResult,
  type JurorSearchItem,
} from "@/fetchs/jurorCheckIn";

const SCANNER_ID = "juror-checkin-scanner";

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));

const JurorCheckInPage = () => {
  useLockViewportZoom();
  // HU-35: el registro se hace frente al jurado; el Staff ve solo «Jurado», el administrador la categoría
  const { userRole } = useAuth();
  const categoryLabel = (category: string) => jurorCategoryForViewer(category, userRole);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRunningRef = useRef(false);
  const lastTokenRef = useRef("");
  const processingRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<JurorSearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner && scannerRunningRef.current) await scanner.stop();
    scannerRunningRef.current = false;
    setScanning(false);
  }, []);

  const submitToken = useCallback(async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token || token === lastTokenRef.current || processingRef.current) return;
    lastTokenRef.current = token;
    processingRef.current = true;
    setProcessing(true);
    setError(null);
    try {
      const checkIn = await scanJurorBadge(token);
      setResult(checkIn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la llegada");
    } finally {
      processingRef.current = false;
      setProcessing(false);
      window.setTimeout(() => { lastTokenRef.current = ""; }, 2000);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setCameraError("La cámara requiere HTTPS. Abre Arkad-test con una conexión segura.");
      return;
    }
    try {
      const scanner = scannerRef.current ?? new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (token) => void submitToken(token),
        () => undefined,
      );
      scannerRunningRef.current = true;
      setScanning(true);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "No se pudo iniciar la cámara.");
    }
  }, [submitToken]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner && scannerRunningRef.current) void scanner.stop();
      void scanner?.clear();
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        setSearchResults(await searchJurors(query));
      } catch (err) {
        setSearchResults([]);
        setError(err instanceof Error ? err.message : "No se pudo buscar al jurado");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const registerManually = async (juror: JurorSearchItem) => {
    processingRef.current = true;
    setProcessing(true);
    setError(null);
    try {
      setResult(await checkInJurorManually(juror.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la llegada");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  return (
    <LayoutAplication breadcrumbs={[{ label: "Check-in de jurados", href: "/check-in-jurados" }]}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10">
        <div>
          <h1 className="text-2xl font-bold">Registrar llegada</h1>
          <p className="text-muted-foreground">Escanea la escarapela o busca al jurado manualmente.</p>
        </div>

        {cameraError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cámara no disponible</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudo completar el registro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <Card className="min-w-0 py-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><QrCode /> Escanear QR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id={SCANNER_ID} className="mx-auto aspect-square max-h-[420px] w-full max-w-[420px] overflow-hidden rounded-lg bg-muted" />
              <div className="flex justify-center">
                <Button type="button" onClick={scanning ? () => void stopScanner() : () => void startScanner()} disabled={processing}>
                  <Camera className="mr-2 h-4 w-4" />
                  {scanning ? "Detener cámara" : "Activar cámara"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 py-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search /> Registro manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 16 px o más: con menos, iOS hace zoom al enfocar el campo */}
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre (mínimo 2 letras)" className="text-base" />
              {searching && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" /> Buscando...</div>}
              {!searching && query.trim().length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground">No se encontraron jurados.</p>
              )}
              <div className="space-y-2">
                {searchResults.map((juror) => (
                  <button key={juror.id} type="button" onClick={() => void registerManually(juror)} disabled={processing}
                    className="w-full touch-manipulation rounded-md border p-3 text-left hover:bg-accent disabled:opacity-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 break-words font-medium">{juror.name}</span>
                      {juror.checkedInAt && <Badge variant="secondary">Ya llegó</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {categoryLabel(juror.category)} · {juror.hasBadge ? "Tiene escarapela" : "Sin escarapela"}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {result && (
          <Alert className="border-green-600">
            <UserCheck className="h-4 w-4" />
            <AlertTitle>{result.status === "ALREADY_CHECKED_IN" ? "Ya registrado" : "Llegada registrada"}</AlertTitle>
            <AlertDescription>
              <strong>{result.juror.name}</strong> · {categoryLabel(result.juror.category)}
              <div>{result.status === "ALREADY_CHECKED_IN" ? "Registrado anteriormente: " : "Hora: "}{formatTime(result.checkedInAt)}</div>
              <div>{result.juror.teams.length ? `Grupos: ${result.juror.teams.map((team) => team.name).join(", ")}` : "Grupos: sin asignar"}</div>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </LayoutAplication>
  );
};

export default JurorCheckInPage;
