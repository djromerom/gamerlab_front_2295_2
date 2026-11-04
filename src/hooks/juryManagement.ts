import { apiFetch } from "@/lib/api";
import { PaginatedJurors } from "@/components/grupo 12/utils";
import { toast } from "sonner";

const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
const includeInactive = false;
// Tope de `limit` que acepta el backend en GET /juror (MAX_PAGE_LIMIT).
const MAX_PAGE_LIMIT = 100;

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
        const all: PaginatedJurors["data"] = [];
        for (let page = 1; ; page++) {
            const { data, metadata } = await juryManagement.getJuries(page, MAX_PAGE_LIMIT);
            all.push(...data);
            if (data.length === 0 || page >= metadata.totalPages) return all;
        }
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

    getTeamsByJuror: async (jurorId) => {
        try {
            const res = await apiFetch(`${API_ENDPOINT}/${jurorId}/teams`, {
                method: 'GET',
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message)
            }
            const getTeams:[[{ id: string, name:string, videogame: string }]] | null  = [data.map((team) => {
            return { id: team.id, name: team.nombre, videogame: team.videojuego.nombre }
            })]

            const getListTeams = getTeams[0]
            return getListTeams
            }catch (error) {
                throw new Error(error)
        }
    },

    getIncompleteJurors: async () => {
        try {
            const res = await apiFetch(`${API_BASE_URL}/teams/incomplete-jurors`, {
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

    // La asignación automática (HU-07) vive en `@/fetchs/automaticAssignment` (vista previa + confirmar).

    manualAssignment: async (jurorId, teamId) => {
        const res = await apiFetch(`${API_ENDPOINT}/assignments`, {
            method: 'POST',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({jurorId: jurorId, teamId: teamId})
        })
        const data = await res.json()

        if (!res.ok) {
            return {
                success: false,
                message: data.message
            }
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

    deleteAnAssignment: async (jurorId, teamId) => {
        const res = await apiFetch(`${API_ENDPOINT}/assignments`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({jurorId: jurorId, teamId: teamId})
        })
        const data = await res.json()

        if (!res.ok) {
            return {
                success: false,
                message: data.message
            }
        }
        return {
            success: true,
            message: 'La asignación fue eliminada.'
        }
    }
}