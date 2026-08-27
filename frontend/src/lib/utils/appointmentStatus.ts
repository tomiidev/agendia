export const APPOINTMENT_STATUS_MAP: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
  NO_SHOW: 'No presentado',
};

export const getStatusLabel = (status: string) => APPOINTMENT_STATUS_MAP[status] || status;
