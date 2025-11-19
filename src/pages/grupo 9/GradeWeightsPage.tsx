"use client";

import React, { useEffect, useState } from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

export default function GradeWeightsPage() {
	const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

	const [seniorPercent, setSeniorPercent] = useState<string>("60");
	const [juniorPercent, setJuniorPercent] = useState<string>("40");
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState<boolean>(false);
	const [originalSenior, setOriginalSenior] = useState<string>("60");
	const [originalJunior, setOriginalJunior] = useState<string>("40");

	const breadcrumbs = [
		{ label: "Ponderado de calificaciones", href: "/ponderado-calificaciones" },
	];

	useEffect(() => {
		// Try load from backend, fall back to localStorage, fallback defaults
		async function load() {
			// try backend
			try {
				const res = await fetch(`${API_BASE_URL}/settings/grade-weights`, {
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				});
				if (res.ok) {
					const data = await res.json();
					if (typeof data.senior === "number") setSeniorPercent(String(data.senior));
					if (typeof data.junior === "number") setJuniorPercent(String(data.junior));
				}
			} catch (e) {
				// ignore backend errors, keep defaults
			}
		}

		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function validSum() {
		const s = parseFloat(seniorPercent);
		const j = parseFloat(juniorPercent);
		if (Number.isNaN(s) || Number.isNaN(j)) return false;
		return Math.abs(s + j - 100) < 0.0001;
	}

	async function handleSave() {
		const s = parseFloat(seniorPercent);
		const j = parseFloat(juniorPercent);
		if (Number.isNaN(s) || Number.isNaN(j)) {
			toast.error("Ingrese porcentajes válidos");
			return;
		}

		if (Math.abs(s + j - 100) > 0.0001) {
			toast.error("La suma de los porcentajes debe ser 100%");
			return;
		}

		setLoading(true);
		try {
			// call backend and require a successful response before confirming
			const res = await fetch(`${API_BASE_URL}/settings/grade-weights`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ senior: s, junior: j }),
			});

			if (!res.ok) {
				// try read backend message
				let msg = "Error al guardar los porcentajes";
				try {
					const data = await res.json();
					if (data && data.message) msg = String(data.message);
				} catch {
					try {
						const text = await res.text();
						if (text) msg = text;
					} catch {
						// ignore
					}
				}
				toast.error(msg);
				return;
			}

			// success confirmed by backend
			toast.success("Porcentajes guardados");
			setEditing(false);

		} catch (err: any) {
			toast.error("No se pudo conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}

	return (
		<LayoutAplication breadcrumbs={breadcrumbs}>
			<div className="p-4 space-y-6">
				<div className="flex justify-between items-center mb-6 px-4">
					<h1 className="text-xl font-medium">Ponderación general</h1>
					{/* Edit button: enable editing mode */}
					{!editing ? (
						<Button
							variant="outline"
							onClick={() => {
								setOriginalSenior(seniorPercent);
								setOriginalJunior(juniorPercent);
								setEditing(true);
							}}
						>
							<Pencil className="mr-2 h-4 w-4" /> Editar
						</Button>
					) : (
						<Button
							variant="ghost"
							onClick={() => {
								// cancel edits
								setSeniorPercent(originalSenior);
								setJuniorPercent(originalJunior);
								setEditing(false);
							}}
						>
							<X className="mr-2 h-4 w-4" /> Cancelar
						</Button>
					)}
				</div>
					{/* Aviso estático: similar al de CriterionTable */}
					<div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200 px-4">
						<div className="flex items-start">
							<svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
							<div>
								<p className="font-medium">Advertencia</p>
								<p>La suma de Jurado Senior y Jurado Junior debe ser exactamente 100% para que el sistema funcione correctamente.</p>
							</div>
						</div>
					</div>
				<Card className="rounded-lg bg-card p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                        <Label className="mb-3">Jurado Senior (%)</Label>
						<Input
							type="number"
							step="0.1"
							className="no-spinner"
							value={seniorPercent}
							onChange={(e) => setSeniorPercent(e.target.value)}
							disabled={!editing}
						/>
                        </div>

                        <div className="flex flex-col">
                        <Label className="mb-3">Jurado Junior (%)</Label>
						<Input
							type="number"
							step="0.1"
							className="no-spinner"
							value={juniorPercent}
							onChange={(e) => setJuniorPercent(e.target.value)}
							disabled={!editing}
						/>
                        </div>
                    </div>
					<div className="flex justify-start pt-2">
						{editing && (
							<div className="flex gap-2">
								<Button onClick={handleSave} disabled={loading}>
									Guardar porcentajes
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										// cancel edits
										setSeniorPercent(originalSenior);
										setJuniorPercent(originalJunior);
										setEditing(false);
									}}
								>
									Cancelar
								</Button>
							</div>
						)}
					</div>
				</Card>
			</div>
		</LayoutAplication>
		);
		}
