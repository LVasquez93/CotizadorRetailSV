import axiosClient from './axiosClient';
import { Cliente, Usuario, Equipo } from '../features/catalogos/types/catalogos.types';

export const clientesApi = {
  listarOBuscar: async (query?: string): Promise<Cliente[]> => {
    const params = query ? { q: query } : {};
    const response = await axiosClient.get<Cliente[]>('/clientes', { params });
    return response.data;
  },

  crear: async (data: Partial<Cliente>): Promise<Cliente> => {
    const response = await axiosClient.post<Cliente>('/clientes', data);
    return response.data;
  },
};

export const usuariosApi = {
  listarOBuscar: async (query?: string): Promise<Usuario[]> => {
    const params = query ? { q: query } : {};
    const response = await axiosClient.get<Usuario[]>('/usuarios', { params });
    return response.data;
  },

  crear: async (data: Partial<Usuario>): Promise<Usuario> => {
    const response = await axiosClient.post<Usuario>('/usuarios', data);
    return response.data;
  },
};

export const equiposApi = {
  listarOBuscar: async (query?: string): Promise<Equipo[]> => {
    const params = query ? { q: query } : {};
    const response = await axiosClient.get<Equipo[]>('/equipos', { params });
    return response.data;
  },

  crearOActualizar: async (data: Partial<Equipo>): Promise<Equipo> => {
    const response = await axiosClient.post<Equipo>('/equipos', data);
    return response.data;
  },
};
