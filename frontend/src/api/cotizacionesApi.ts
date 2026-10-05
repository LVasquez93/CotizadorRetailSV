import axiosClient from './axiosClient';
import { CotizacionFormData, CotizacionResponse } from '../features/cotizaciones/types/cotizacion.types';

export const cotizacionesApi = {
  crear: async (data: CotizacionFormData): Promise<CotizacionResponse> => {
    const response = await axiosClient.post('/cotizaciones', data);
    return response.data;
  },

  listar: async (page: number = 0, size: number = 10): Promise<{ content: CotizacionResponse[]; totalPages: number; totalElements: number }> => {
    const response = await axiosClient.get('/cotizaciones', { params: { page, size, sort: 'fechaCreacion,desc' } });
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<CotizacionResponse> => {
    const response = await axiosClient.get(`/cotizaciones/${id}`);
    return response.data;
  },

  descargarPdf: async (id: number): Promise<Blob> => {
    const response = await axiosClient.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  previsualizarPdf: async (data: CotizacionFormData): Promise<Blob> => {
    const response = await axiosClient.post('/cotizaciones/preview-pdf', data, { responseType: 'blob' });
    return response.data;
  },
};
