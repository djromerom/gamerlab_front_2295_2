import { apiFetch } from "@/lib/api";
import { fetchAllPages } from "@/lib/pagination";
import { PaginatedJurors, getApiErrorMessage } from "@/components/grupo 12/utils";
import { type LevelTeam, toLevelTeam } from "@/components/grupo 12/manualAssignment";
import { type AssignmentWarning, getAssignmentWarnings } from "@/lib/assignmentWarnings";
import { toast } from "sonner";

const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
const includeInactive = false;

export const juryManagement = {
    getJuries : async (page: number, limit: number) => {

        const res = await apiFetch(`${API_ENDPOINT}?includeInactive=${includeInactive}&limit=${limit}&page=${page}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        
        if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch jurors`;
        try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
            /* ignore */
        }
        throw new Error(errorMsg);
        }
        const dataRespond: PaginatedJurors = await res.json();

        return dataRespond
    },

    // Trae todos los jurados recorriendo las páginas, porque el backend no acepta más de 100 por página.
    getAllJuries: async () => {
        return fetchAllPages<PaginatedJurors["data"][number]>(async (page, limit) => {
            const { data, metadata } = await juryManagement.getJuries(page, limit);
            return { items: data, totalPages: metadata.totalPages };
        });
    },

    getTeams: async () => {
        try {
            const res = await apiFetch(`${API_BASE_URL}/teams/?page=1&limit=null`, {
                method: 'GET',
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message)
            }
            return data
            }catch (error) {
                throw new Error(error)
        }
    },

    // ARK-189: cada equipo trae su nivel (ARK-188), ordenados por nivel y nombre
    getTeamsByJuror: async (jurorId: string): Promise<LevelTeam[]> => {
        const res = await apiFetch(`${API_ENDPOINT}/${jurorId}/teams`, {
            method: 'GET',
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
            throw new Error(data?.message || `Error ${res.status}: no se pudieron cargar los equipos del jurado`)
        }
        return Array.isArray(data) ? data.map(toLevelTeam) : []
    },

    // Equipos confirmados de la edición activa con menos de 3 jurados, con su nivel (ARK-188)
    getIncompleteJurors: async (): Promise<LevelTeam[]> => {
        const res = await apiFetch(`${API_BASE_URL}/teams/incomplete-jurors`, {
            method: 'GET',
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
            throw new Error(data?.message || `Error ${res.status}: no se pudieron cargar los equipos`)
        }
        return Array.isArray(data) ? data.map(toLevelTeam) : []
    },

    // La asignación automática (HU-07) vive en `@/fetchs/automaticAssignment` (vista previa + confirmar).

    // HU-08: si rompe reglas, el back responde 409 ASSIGNMENT_WARNINGS sin guardar nada;
    // se devuelven las advertencias para repetir la petición con `confirmWarnings: true`.
    manualAssignment: async (
        jurorId: string,
        teamId: number,
        confirmWarnings = false
    ): Promise<{ success: boolean; message: string; warnings?: AssignmentWarning[] }> => {
        const res = await apiFetch(`${API_ENDPOINT}/assignments`, {
            method: 'POST',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jurorId: jurorId,
                teamId: teamId,
                ...(confirmWarnings && { confirmWarnings: true }),
            })
        })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
            const message = getApiErrorMessage(data, 'No se pudo asignar el equipo.')
            const warnings = getAssignmentWarnings(res.status, data)
            return warnings
                ? { success: false, message, warnings }
                : { success: false, message }
        }
        return {
            success: true,
            message: 'Asignación exitosa'
        }
    },

    deleteAllAssignments: async (setLoading) => {
        const res = await apiFetch(`${API_ENDPOINT}/assignments/all`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()

        // ARK-133: con error (p. ej. 400 «no hay asignaciones») se avisa y no se recarga
        if (!res.ok) {
            setLoading(false)
            toast.error(data.message)
            return
        }
        setLoading(false)
        toast.success(data.message)
        setTimeout(() => {
          window.location.reload();
        }, 1000)
    },

    deleteAllAsignmentsByJury: async (juryId, setLoading) => {
        const res = await apiFetch(`${API_ENDPOINT}/${juryId}/assignments`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()

        if (!res.ok) {
            setLoading(false)
            toast.error(data.message)
            return
        }
        setLoading(false)
        toast.success(data.message)
        setTimeout(() => {
          window.location.reload();
        }, 1000) 
    },

    // ARK-206: quitar también avisa (HU-08, p. ej. TEAM_UNDER_MIN). Con 409 ASSIGNMENT_WARNINGS
    // no se quitó nada: se devuelven las advertencias para repetir con `confirmWarnings: true`.
    deleteAnAssignment: async (
        jurorId: string,
        teamId: number,
        confirmWarnings = false
    ): Promise<{ success: boolean; message: string; warnings?: AssignmentWarning[] }> => {
        const res = await apiFetch(`${API_ENDPOINT}/assignments`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jurorId: jurorId,
                teamId: teamId,
                ...(confirmWarnings && { confirmWarnings: true }),
            })
        })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
            const message = getApiErrorMessage(data, 'No se pudo quitar el equipo.')
            const warnings = getAssignmentWarnings(res.status, data)
            return warnings
                ? { success: false, message, warnings }
                : { success: false, message }
        }
        return {
            success: true,
            message: 'La asignación fue eliminada.'
        }
    }
}