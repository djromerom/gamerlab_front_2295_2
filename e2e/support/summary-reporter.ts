// Reporter de Playwright que escribe en el resumen de la corrida de GitHub Actions ($GITHUB_STEP_SUMMARY) una
// tabla legible: por prueba, qué comprueba, su resultado y el resultado de cada paso. Así se ve qué
// comportamiento pasó o falló sin descargar el informe HTML. Fuera de Actions no hace nada.
import { appendFileSync } from "node:fs";
import { stripVTControlCharacters } from "node:util";
import type { Reporter, TestCase, TestResult, TestStep } from "@playwright/test/reporter";

const ICONO: Record<string, string> = {
  passed: "✅",
  failed: "❌",
  timedOut: "⏱️",
  interrupted: "⛔",
  skipped: "⏭️",
};

const celda = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const anotacion = (test: TestCase, tipo: string) => test.annotations.find((a) => a.type === tipo)?.description;

/** Pasos con nombre de la prueba (los de `paso()` / test.step), sin los internos de Playwright. */
const pasosDe = (result: TestResult): TestStep[] => result.steps.filter((s) => s.category === "test.step");

export default class SummaryReporter implements Reporter {
  private resultados: { test: TestCase; result: TestResult }[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.resultados.push({ test, result });
  }

  onEnd(): void {
    const destino = process.env.GITHUB_STEP_SUMMARY;
    if (!destino) return;

    const cuenta = (estado: string) => this.resultados.filter((r) => r.result.status === estado).length;
    const fallidas = cuenta("failed") + cuenta("timedOut") + cuenta("interrupted");
    const lineas: string[] = [
      "### Pruebas e2e: qué se comprobó",
      "",
      `✅ ${cuenta("passed")} pasaron · ❌ ${fallidas} fallaron · ⏭️ ${cuenta("skipped")} omitidas`,
      "",
      "| | Prueba | Qué comprueba |",
      "|---|---|---|",
    ];

    for (const { test, result } of this.resultados) {
      const tags = test.tags.length ? ` <sub>${test.tags.join(" ")}</sub>` : "";
      const comprueba = anotacion(test, "Comprueba") ?? "";
      lineas.push(`| ${ICONO[result.status] ?? "❔"} | ${celda(test.title)}${tags} | ${celda(comprueba)} |`);
    }

    // Detalle por prueba: los pasos, con el que falló y su error, y el motivo de las omitidas.
    lineas.push("", "#### Detalle por paso", "");
    for (const { test, result } of this.resultados) {
      const archivo = test.location.file.split(/[\\/]/).pop();
      lineas.push(`<details${result.status === "passed" ? "" : " open"}><summary>${ICONO[result.status] ?? "❔"} ${test.title} <code>${archivo}</code></summary>`, "");
      const defecto = anotacion(test, "Defecto conocido");
      if (result.status === "skipped" && defecto) lineas.push(`> Omitida a propósito. ${defecto}`, "");
      for (const step of pasosDe(result)) {
        lineas.push(`- ${step.error ? "❌" : "✅"} ${step.title} <sub>${(step.duration / 1000).toFixed(1)} s</sub>`);
      }
      if (result.error?.message) {
        const msg = stripVTControlCharacters(result.error.message).split("\n").filter(Boolean).slice(0, 4).join("\n");
        lineas.push("", "```", msg, "```");
      }
      lineas.push("", "</details>", "");
    }

    lineas.push("Capturas de cada paso: artefacto `playwright-report` (abrir `index.html`).", "");
    appendFileSync(destino, lineas.join("\n"));
  }

  printsToStdio(): boolean {
    return false;
  }
}
