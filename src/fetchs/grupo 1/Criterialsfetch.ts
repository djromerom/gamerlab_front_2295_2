export async function fetchCriterionAverages(videogameId:number) {
  try {
    const response = await fetch(`/api/videogames/${videogameId}/criterion-averages`);

    if (!response.ok) {
      // Manejar errores de HTTP (4xx, 5xx)
      const errorData = await response.json();
      console.error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      // Podrías lanzar un error o devolver un estado de error para la UI
      return null;
    }

    const data = await response.json();
    // data será un array como:
    // [
    //   { criterionId: 1, criterionName: "Jugabilidad", averageScore: 4.5 },
    //   { criterionId: 2, criterionName: "Gráficos", averageScore: 3.8 },
    //   ...
    // ]
    
    return data; // Estos son los datos que puedes usar para mostrar y cachear

  } catch (error) {
    // Manejar errores de red u otros errores inesperados
    console.error('Failed to fetch criterion averages:', error);
    return null;
  }
}
