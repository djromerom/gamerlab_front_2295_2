export interface ApiCriterion {
    id: number;
    name: string;
    weight: number;
    description: string;
  }
  
export interface UiCriterion extends ApiCriterion {
    score: number;
    maxScore: number;
  }