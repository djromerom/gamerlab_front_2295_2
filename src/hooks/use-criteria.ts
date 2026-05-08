import { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";

interface ApiCriterion {
  id: number;
  name: string;
  weight: number;
  description: string;
}

let criteriaCache: ApiCriterion[] | null = null;

export function useCriteria() {
  const [criteria, setCriteria] = useState<ApiCriterion[]>(criteriaCache || []);
  const [isLoading, setIsLoading] = useState<boolean>(!criteriaCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (criteriaCache) {
      setCriteria(criteriaCache);
      setIsLoading(false);
      return;
    }

    async function fetchCriteria() {
      try {
        // Se utiliza apiFetch para manejar automáticamente el refresco de sesión si el token expira (401)
        const response = await apiFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/criteria/select-options`
        );
        if (!response.ok) {
          throw new Error('Error al obtener los criterios de evaluación');
        }
        const data: ApiCriterion[] = await response.json();
        
        data.sort((a, b) => a.id - b.id); 
        
        criteriaCache = data;
        setCriteria(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
        console.error("Error fetching criteria:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCriteria();
  }, []);

  return { criteria, isLoading, error };
}