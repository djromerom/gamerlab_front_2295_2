export const mapConfirmationStatus = (statusId: number): string => {
  switch (statusId) {
    case 1: return "Confirmado";
    case 2: return "Pendiente";
    default: return "Expirado";
  }
};

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });