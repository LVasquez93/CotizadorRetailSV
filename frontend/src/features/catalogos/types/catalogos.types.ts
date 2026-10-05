export interface Cliente {
  id: number;
  razonSocial: string;
  nombreComercial?: string;
  contactoPrincipal?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  activo?: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  correo?: string;
  cargo?: string;
  rol: string;
  activo?: boolean;
}

export interface Equipo {
  id: number;
  descripcion: string;
  partNumber?: string;
  caracteristicas?: string;
  precioReferencial?: number;
  tiempoEntregaPredeterminado?: string;
  categoria?: string;
  activo?: boolean;
}
