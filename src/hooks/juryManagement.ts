import { PaginatedJurors } from "@/components/grupo 12/utils";
import { toast } from "sonner";

const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
const includeInactive = false;

export const juryManagement = {
    getJuries : async (page: number, limit: number) => {

        const res = await fetch(`${API_ENDPOINT}?includeInactive=${includeInactive}&limit=${limit}&page=${page}`, {
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

    getTeams: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/teams/?page=1&limit=null`, {
                method: 'GET',
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
            console.log(res)
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
            const res = await fetch(`${API_ENDPOINT}/${jurorId}/teams`, {
                method: 'GET',
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            })
            console.log(res)
            const data = await res.json()
            console.log(data)
            if (!res.ok) {
                throw new Error(data.message)
            }
            const getTeams:[[{ id: string, name:string, videogame: string }]] | null  = [data.map((team) => {
            return { id: team.id, name: team.nombre, videogame: team.videojuego.nombre }
            })]

            console.log('Estos son lo equipos por jurado', getTeams)
            console.log('efknfks', getTeams[0])
            const getListTeams = getTeams[0]
            return getListTeams
            }catch (error) {
                throw new Error(error)
        }
    },

    automaticAssignment: async () => {
        const res = await fetch(`${API_ENDPOINT}/evaluations-assignment`, {
            method: 'GET',
            credentials: 'include',
            headers: { 
                "Content-Type": "application/json" 
            },
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
            message: 'Se asignaron los equipos a los jurados.'
        }
    },

    manualAssignment: async (jurorId, teamId) => {

        console.log('id jurado: ', jurorId)
        console.log('id equipo: ', teamId)
        const res = await fetch(`${API_ENDPOINT}/assignments`, {
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
        const res = await fetch(`${API_ENDPOINT}/assignments/all`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()

        if (!res.ok) {
            setLoading(false)
            toast.error(data.message)
        }
        setLoading(false)
        toast.success(data.message)
        setTimeout(() => {
          window.location.reload();
        }, 1000) 
    },

    deleteAnAssignment: async (jurorId, teamId) => {
        const res = await fetch(`${API_ENDPOINT}/assignments`, {
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