// src/hooks/useCriteria.ts (or similar path)
import { useState, useEffect } from 'react';

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
        const response = await fetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/criteria/select-options`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch criteria');
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