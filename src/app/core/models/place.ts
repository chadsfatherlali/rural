export interface Place {
  // Administrative information
  id: number;
  zone: string;
  district: string;
  province: string;
  canton: string;

  // Identity
  code: string;
  name: string;

  // Characteristics
  type: string;              // e.g., "CENTRO DE SALUD A", "PUESTO DE SALUD"
  availableSlots: number;    // Available slots
  specialization: string;    // e.g., "ENFERMERIA"

  // Pagination
  page: number;

  // Geolocation
  latitude: number;
  longitude: number;

  // Computed (optional)
  hasLocation?: boolean; // latitude !== 0 && longitude !== 0
}
