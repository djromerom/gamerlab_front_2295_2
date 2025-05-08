// data/videojuegos.ts

export const videojuegos = [
        {
          id: 1,
          nombre: "Space Adventure2",
          materia: "Programación Avanzada",
          nrc: "12345",
          criterios: {
            jugabilidad: 4.5,
            diseño: 4.2,
            innovación: 4.8,
            técnica: 4.3,
            presentación: 4.6,
          },
          promedio: 4.48,
          evaluaciones: 5,
          totalJurados: 5,
        },
        {
          id: 2,
          nombre: "Puzzle Master",
          materia: "Diseño de Videojuegos",
          nrc: "23456",
          criterios: {
            jugabilidad: 4.2,
            diseño: 4.7,
            innovación: 4.1,
            técnica: 4.0,
            presentación: 4.3,
          },
          promedio: 4.26,
          evaluaciones: 4,
          totalJurados: 5,
        },
        {
          id: 3,
          nombre: "Fantasy Quest",
          materia: "Programación Avanzada",
          nrc: "12345",
          criterios: {
            jugabilidad: 4.7,
            diseño: 4.5,
            innovación: 4.3,
            técnica: 4.6,
            presentación: 4.8,
          },
          promedio: 4.58,
          evaluaciones: 5,
          totalJurados: 5,
        },
        {
          id: 4,
          nombre: "Racing Simulator",
          materia: "Gráficos por Computadora",
          nrc: "34567",
          criterios: {
            jugabilidad: 4.0,
            diseño: 4.1,
            innovación: 3.8,
            técnica: 4.5,
            presentación: 4.2,
          },
          promedio: 4.12,
          evaluaciones: 3,
          totalJurados: 5,
        },
        {
          id: 5,
          nombre: "Zombie Survival",
          materia: "Diseño de Videojuegos",
          nrc: "23456",
          criterios: {
            jugabilidad: 4.3,
            diseño: 4.0,
            innovación: 3.9,
            técnica: 4.1,
            presentación: 4.2,
          },
          promedio: 4.1,
          evaluaciones: 4,
          totalJurados: 5,
        },
]
  
export const materias = ["Todas", "Programación Avanzada", "Diseño de Videojuegos", "Gráficos por Computadora"]
export const nrcs = ["Todos", "12345", "23456", "34567"]
export const jurados = ["Todos", "Juan Pérez", "María López", "Carlos Rodríguez", "Ana Martínez", "Pedro Sánchez"]
  
export const datosPorMateria = [
    { name: "Programación Avanzada", value: 4.53, color: "hsl(215, 100%, 50%)" },
    { name: "Diseño de Videojuegos", value: 4.18, color: "hsl(145, 100%, 50%)" },
    { name: "Gráficos por Computadora", value: 4.12, color: "hsl(280, 100%, 50%)" },
    ]
  