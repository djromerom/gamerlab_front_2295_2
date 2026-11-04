import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchOwnTeamForEdition } from "@/lib/ownTeam";

export default function CircularProgress({
    size = 120,
    strokeWidth = 12,
    trackClass = "text-gray-200",
    progressClass = "text-indigo-600",
    showLabel = true,
    labelFormatter,
}) {
    
    const { user, userRole } = useAuth();
    const startDate = new Date("2025-11-27T08:30:00");
    const [now, setNow] = useState(new Date())
    const [total, setTotal] = useState<number>(0);
    const [received, setReceived] = useState<number>(0);
    const [dashOffset, setDashOffset] = useState<number>(0);
    const [percent, setPercent] = useState<number>();

    const safeTotal = Number(total) || 0;
    const safeReceived = Math.max(0, Number(received) || 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const ariaLabel = `Calificaciones recibidas ${safeReceived} de ${safeTotal}`;


    const getNumberCalifications = async () => {
        const ownTeam = await fetchOwnTeamForEdition();
        const resTeam = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${ownTeam.id}/full`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!resTeam.ok) {
            return null
        }

        const getTeam = await resTeam.json()
        const idTeam = getTeam.id


        const res = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/juror/teams/${idTeam}/evaluation-stats`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
        })

        if (!res.ok) {
            return null
        }
        const data = await res.json();

        const ratio = data.totalJurorsAssigned <= 0 ? 0 : Math.min(1, data.jurorsWhoEvaluated / data.totalJurorsAssigned);
        const offset = circumference * (1 - ratio)
        const perc = Math.round(ratio * 100)

        setTotal(data.totalJurorsAssigned);
        setReceived(data.jurorsWhoEvaluated);
        setDashOffset(offset);
        setPercent(perc)
        


        return data
    }

    useEffect(() => {
        setNow(new Date())
        // Solo los estudiantes tienen equipo; para otros roles la consulta falla
        if (!user || userRole !== "Estudiante") return;
        getNumberCalifications().catch(() => null)
    }, [user, userRole])

    if (startDate > now) {
        return null;
    }

    if (userRole !== "Estudiante") {
        return null;
    }

    return (
        <div
        className="inline-flex flex-col items-center"
        style={{ width: size }}
        >
        <div
            role="progressbar"
            aria-label={ariaLabel}
            aria-valuenow={received}
            aria-valuemax={safeTotal}
            aria-valuemin={0}
            className="relative"
            style={{ width: size, height: size }}
        >
            {/* Use currentColor trick: the wrapper sets text color for the progress stroke */}
            <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="block"
            >
            <g transform={`translate(${size / 2}, ${size / 2})`}>
                {/* Track */}
                <circle
                r={radius}
                fill="transparent"
                stroke="currentColor"
                className={trackClass}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ opacity: 1 }}
                />

                {/* Progress: put in a group with the progressClass so currentColor applies */}
                <g className={progressClass}>
                <circle
                    r={radius}
                    fill="transparent"
                    stroke="#6e10ff"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={`${dashOffset}`}
                    transform={`rotate(-90)`} // start from top
                    style={{
                    transition: "stroke-dashoffset 600ms ease, stroke 200ms ease",
                    }}
                />
                </g>
            </g>
            </svg>

            {/* Center label */}
            {showLabel && (
            <div
                className="absolute inset-0 flex items-center justify-center text-center select-none"
                style={{ top: 0, left: 0 }}
            >
                <div>
                {labelFormatter ? (
                    labelFormatter(safeReceived, safeTotal)
                ) : (
                    <div className="flex flex-col items-center">
                    <span className="font-semibold text-sm">{safeReceived}/{safeTotal}</span>
                    <span className="text-xs text-gray-500">{`${percent ?? 0}`}%</span>
                    </div>
                )}
                </div>
            </div>
            )}
        </div>

        {/* Optional caption for small screens or as helper — keep it semantic */}
        <div className="mt-2 text-xs text-gray-600">Calificaciones</div>
        </div>
    );
}