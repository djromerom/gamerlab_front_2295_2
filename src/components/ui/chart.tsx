"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Definición de tipos
export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
  };
}

// ChartContainer
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  // Crear variables CSS para los colores
  const style = React.useMemo(() => {
    return Object.entries(config).reduce(
      (acc, [key, value]) => {
        if (value.color) {
          acc[`--color-${key}`] = value.color;
        }
        return acc;
      },
      {
        // Añadir colores por defecto para las variables de chart
        "--chart-1": "12 76% 61%",
        "--chart-2": "173 58% 39%",
        "--chart-3": "197 37% 24%",
        "--chart-4": "43 74% 66%",
        "--chart-5": "27 87% 67%",
      } as Record<string, string>
    );
  }, [config]);

  return (
    <div className={cn("w-full h-full", className)} style={style} {...props}>
      {children}
    </div>
  );
}

// ChartTooltip
interface ChartTooltipProps {
  className?: string;
  content?: React.ReactNode;
  cursor?: boolean | React.ReactNode;
  defaultIndex?: number;
  offset?: number;
  wrapperClassName?: string;
  [key: string]: any;
}

export function ChartTooltip({
  content = <ChartTooltipContent />,
}: ChartTooltipProps) {
  return content;
}

// ChartTooltipContent
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      [key: string]: any;
    };
    color?: string;
  }>;
  label?: string;
  className?: string;
  hideLabel?: boolean;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border bg-background p-2 shadow-sm", className)}
    >
      {!hideLabel && label ? (
        <div className="text-xs font-medium">{label}</div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: item.payload.fill || item.color,
              }}
            />
            <span className="font-medium">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)} />
  );
}

// ChartLegendContent
interface ChartLegendContentProps {
  payload?: Array<{
    value: string;
    type: string;
    id: string;
    color: string;
  }>;
  className?: string;
  nameKey?: string;
}

export function ChartLegendContent({
  payload,
  className,
  nameKey = "value",
}: ChartLegendContentProps) {
  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-1 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry[nameKey as keyof typeof entry] || entry.value}</span>
        </div>
      ))}
    </div>
  );
}
