import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Sucursal } from '../features/catalogos/types/catalogos.types';
import { sucursalesApi } from '../api/sucursalesApi';

interface SucursalContextType {
  sucursales: Sucursal[];
  sucursalActiva: Sucursal | null;
  setSucursalActiva: (sucursal: Sucursal) => void;
  recargarSucursales: () => Promise<void>;
  cargandoSucursales: boolean;
}

const SucursalContext = createContext<SucursalContextType | undefined>(undefined);

export const SucursalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalActiva, setSucursalActivaState] = useState<Sucursal | null>(null);
  const [cargandoSucursales, setCargandoSucursales] = useState<boolean>(true);

  const cargarSucursales = async () => {
    try {
      setCargandoSucursales(true);
      const data = await sucursalesApi.listar();
      setSucursales(data);

      if (data && data.length > 0) {
        const guardadoId = localStorage.getItem('cotizador_sucursal_id');
        const encontrada = guardadoId ? data.find(s => s.id === Number(guardadoId)) : null;
        const seleccionada = encontrada || data[0];
        setSucursalActivaState(seleccionada);
        localStorage.setItem('cotizador_sucursal_id', String(seleccionada.id));
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setCargandoSucursales(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const setSucursalActiva = (sucursal: Sucursal) => {
    setSucursalActivaState(sucursal);
    localStorage.setItem('cotizador_sucursal_id', String(sucursal.id));
  };

  return (
    <SucursalContext.Provider
      value={{
        sucursales,
        sucursalActiva,
        setSucursalActiva,
        recargarSucursales: cargarSucursales,
        cargandoSucursales
      }}
    >
      {children}
    </SucursalContext.Provider>
  );
};

export const useSucursal = (): SucursalContextType => {
  const context = useContext(SucursalContext);
  if (!context) {
    throw new Error('useSucursal debe usarse dentro de un SucursalProvider');
  }
  return context;
};
