import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CotizacionFormData, ItemCotizacionInput } from '../types/cotizacion.types';
import { calcularTotales } from '../utils/calculosFinancieros';
import { numeroALetras } from '../utils/numeroALetras';
import { cotizacionesApi } from '../../../api/cotizacionesApi';
import { clientesApi, usuariosApi, equiposApi } from '../../../api/catalogosApi';
import { Cliente, Usuario, Equipo } from '../../catalogos/types/catalogos.types';

const DEFAULT_FORM_VALUES: CotizacionFormData = {
  codigoCotizacion: '',
  usuarioEmisor: 'VENTASSR001',
  fechaEmision: new Date().toISOString().split('T')[0],
  contactoCliente: '',
  razonSocialCliente: '',
  nombreComercial: '',
  formaPago: 'Crédito 30 días, Transferencia Bancaria o Cheque',
  notaImportante: '** IMPORTANTE ** Tiempos de entrega y precios, podrían estar sujetos a cambios en inventario',
  subtotalSinIva: 0,
  montoIva: 0,
  totalInversion: 0,
  totalEnLetras: 'CERO DOLARES CON 00/100',
  items: [
    {
      itemNumero: 1,
      descripcionEquipo: '',
      partNumber: '',
      caracteristicas: '',
      tiempoEntrega: 'De 5 a 6 semanas',
      cantidad: 1,
      precioUnitario: 0,
      totalLinea: 0
    }
  ]
};

export const CotizacionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Estados para integración con Base de Datos (Clientes, Usuarios, Equipos)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [equiposCatalogo, setEquiposCatalogo] = useState<Equipo[]>([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState<{ [itemIndex: number]: Equipo[] }>({});
  const [busquedaActivaItem, setBusquedaActivaItem] = useState<number | null>(null);

  // Estados para modal de confirmación y guardado de equipos nuevos en la BD
  const [equiposNuevosDetectados, setEquiposNuevosDetectados] = useState<ItemCotizacionInput[]>([]);
  const [mostrarModalEquiposNuevos, setMostrarModalEquiposNuevos] = useState(false);
  const [datosPendientesGuardar, setDatosPendientesGuardar] = useState<CotizacionFormData | null>(null);

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<CotizacionFormData>({
    defaultValues: DEFAULT_FORM_VALUES
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Carga inicial de datos maestros desde MySQL
  useEffect(() => {
    clientesApi.listarOBuscar().then(data => {
      setClientes(data);
      setClientesSugeridos(data);
    }).catch(console.error);

    usuariosApi.listarOBuscar().then(data => {
      setUsuarios(data);
    }).catch(console.error);

    equiposApi.listarOBuscar().then(data => {
      setEquiposCatalogo(data);
    }).catch(console.error);
  }, []);

  // useWatch escucha en tiempo real cada pulsación en cualquier campo de items
  const watchedItems = useWatch({
    control,
    name: 'items'
  });

  // Totales reactivos calculados al instante para la interfaz gráfica
  const { subtotalSinIva, montoIva, totalInversion } = calcularTotales(watchedItems || []);
  const totalEnLetras = numeroALetras(totalInversion);

  // Validador de ítem incompleto o vacío según requerimientos:
  // revisa existencia de nombre, tiempo de entrega, cantidad > 0 y precio unitario > 0
  const validarItemIncompleto = (items: typeof watchedItems) => {
    if (!items || items.length === 0) return null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const nombreVacio = !it?.descripcionEquipo || it.descripcionEquipo.trim() === '';
      const entregaVacia = !it?.tiempoEntrega || it.tiempoEntrega.trim() === '';
      const cantidadInvalida = it?.cantidad === undefined || it?.cantidad === null || Number(it.cantidad) <= 0 || isNaN(Number(it.cantidad));
      const precioInvalido = it?.precioUnitario === undefined || it?.precioUnitario === null || Number(it.precioUnitario) <= 0 || isNaN(Number(it.precioUnitario));

      if (nombreVacio || entregaVacia || cantidadInvalida || precioInvalido) {
        return {
          numero: i + 1,
          nombreVacio,
          entregaVacia,
          cantidadInvalida,
          precioInvalido
        };
      }
    }
    return null;
  };

  const itemIncompleto = validarItemIncompleto(watchedItems);
  const tieneItemIncompleto = Boolean(itemIncompleto);

  const handleAgregarItem = () => {
    if (itemIncompleto) {
      const faltantes: string[] = [];
      if (itemIncompleto.nombreVacio) faltantes.push('Nombre del equipo o servicio');
      if (itemIncompleto.entregaVacia) faltantes.push('Tiempo de entrega');
      if (itemIncompleto.cantidadInvalida) faltantes.push('Cantidad (debe ser mayor a 0)');
      if (itemIncompleto.precioInvalido) faltantes.push('Precio unitario (debe ser mayor a 0)');

      alert(`No puede agregar más ítems mientras haya uno incompleto o vacío.\n\nPor favor complete el Ítem #${itemIncompleto.numero}:\n• ${faltantes.join('\n• ')}`);
      return;
    }

    append({
      itemNumero: fields.length + 1,
      descripcionEquipo: '',
      partNumber: '',
      caracteristicas: '',
      tiempoEntrega: 'De 5 a 6 semanas',
      cantidad: 1,
      precioUnitario: 0,
      totalLinea: 0
    });
  };

  // Buscador y selector de clientes
  const handleBuscarClientes = (texto: string) => {
    if (!texto || texto.trim() === '') {
      setClientesSugeridos(clientes);
    } else {
      const q = texto.toLowerCase();
      const filtrados = clientes.filter(c =>
        c.razonSocial.toLowerCase().includes(q) ||
        (c.nombreComercial && c.nombreComercial.toLowerCase().includes(q)) ||
        (c.contactoPrincipal && c.contactoPrincipal.toLowerCase().includes(q))
      );
      setClientesSugeridos(filtrados);
    }
    setMostrarDropdownClientes(true);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setValue('razonSocialCliente', cliente.razonSocial);
    if (cliente.nombreComercial) {
      setValue('nombreComercial', cliente.nombreComercial);
    }
    if (cliente.contactoPrincipal) {
      setValue('contactoCliente', cliente.contactoPrincipal);
    }
    setMostrarDropdownClientes(false);
  };

  // Buscador y selector interactivo de equipos
  const handleBuscarEquipos = (index: number, texto: string) => {
    if (!texto || texto.trim() === '') {
      setEquiposFiltrados(prev => ({ ...prev, [index]: equiposCatalogo }));
    } else {
      const q = texto.toLowerCase();
      const filtrados = equiposCatalogo.filter(eq =>
        eq.descripcion.toLowerCase().includes(q) ||
        (eq.partNumber && eq.partNumber.toLowerCase().includes(q)) ||
        (eq.caracteristicas && eq.caracteristicas.toLowerCase().includes(q)) ||
        (eq.categoria && eq.categoria.toLowerCase().includes(q))
      );
      setEquiposFiltrados(prev => ({ ...prev, [index]: filtrados }));
    }
    setBusquedaActivaItem(index);
  };

  const handleSelectEquipo = (index: number, equipo: Equipo) => {
    setValue(`items.${index}.descripcionEquipo`, equipo.descripcion);
    setValue(`items.${index}.partNumber`, equipo.partNumber || '');
    setValue(`items.${index}.caracteristicas`, equipo.caracteristicas || '');
    setValue(`items.${index}.tiempoEntrega`, equipo.tiempoEntregaPredeterminado || 'De 5 a 6 semanas');
    if (equipo.precioReferencial !== undefined && equipo.precioReferencial !== null) {
      setValue(`items.${index}.precioUnitario`, Number(equipo.precioReferencial));
    }
    setValue(`items.${index}.equipoId`, equipo.id);
    setValue(`items.${index}.esNuevo`, false);
    setBusquedaActivaItem(null);
  };

  const prepararDatos = (formData: CotizacionFormData): CotizacionFormData => {
    const itemsCalculados = (formData.items || []).map((it, index) => {
      const qty = Number(it.cantidad || 0);
      const price = Number(it.precioUnitario || 0);
      const lineTotal = Math.round(qty * price * 100) / 100;
      return {
        ...it,
        itemNumero: index + 1,
        descripcionEquipo: it.descripcionEquipo,
        partNumber: it.partNumber || '',
        caracteristicas: it.caracteristicas || '',
        tiempoEntrega: it.tiempoEntrega || 'De 5 a 6 semanas',
        cantidad: qty,
        precioUnitario: price,
        totalLinea: lineTotal
      };
    });

    const totales = calcularTotales(itemsCalculados);

    return {
      ...formData,
      codigoCotizacion: '',
      items: itemsCalculados,
      subtotalSinIva: totales.subtotalSinIva,
      montoIva: totales.montoIva,
      totalInversion: totales.totalInversion,
      totalEnLetras: numeroALetras(totales.totalInversion)
    };
  };

  const handlePreview = async () => {
    const newWindow = window.open('about:blank', '_blank');
    try {
      setLoading(true);
      const data = prepararDatos(watch());
      const blob = await cotizacionesApi.previsualizarPdf(data);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (error: any) {
      if (newWindow) newWindow.close();
      console.error('Error in preview:', error);
      const details = error?.response?.data?.details;
      if (details) {
        const msgs = Object.entries(details).map(([f, m]) => `• ${f}: ${m}`).join('\n');
        alert(`No se pudo generar la vista previa:\n${msgs}`);
      } else {
        alert(error?.response?.data?.message || 'Error generando vista previa');
      }
    } finally {
      setLoading(false);
    }
  };

  const ejecutarGuardadoCotizacion = async (data: CotizacionFormData) => {
    const newWindow = window.open('about:blank', '_blank');
    try {
      setLoading(true);
      const dataPreparada = prepararDatos(data);
      const response = await cotizacionesApi.crear(dataPreparada);
      
      const blob = await cotizacionesApi.descargarPdf(response.id);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }

      // Limpiar completamente el formulario a sus valores iniciales
      reset(DEFAULT_FORM_VALUES);

      // Redirigir al historial de cotizaciones con notificación de éxito
      navigate('/cotizaciones', {
        state: { mensaje: `¡Cotización ${response.codigoCotizacion} generada y guardada exitosamente!` }
      });
    } catch (error: any) {
      if (newWindow) newWindow.close();
      console.error('Error creating cotizacion:', error);
      const details = error?.response?.data?.details;
      if (details) {
        const msgs = Object.entries(details).map(([f, m]) => `• ${f}: ${m}`).join('\n');
        alert(`Faltan campos obligatorios para guardar:\n${msgs}`);
      } else {
        alert(error?.response?.data?.message || 'Error guardando la cotización');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CotizacionFormData) => {
    // Detectar equipos que son nuevos (no tienen equipoId y su descripcion no está en el catálogo existente)
    const itemsNuevos = (data.items || []).filter(it => {
      if (!it.descripcionEquipo || it.descripcionEquipo.trim() === '') return false;
      if (it.equipoId) return false;
      const existeEnCatalogo = equiposCatalogo.some(
        eq => eq.descripcion.trim().toLowerCase() === it.descripcionEquipo.trim().toLowerCase() ||
              (it.partNumber && eq.partNumber && eq.partNumber.trim().toLowerCase() === it.partNumber.trim().toLowerCase())
      );
      return !existeEnCatalogo;
    });

    if (itemsNuevos.length > 0) {
      setEquiposNuevosDetectados(itemsNuevos);
      setDatosPendientesGuardar(data);
      setMostrarModalEquiposNuevos(true);
      return;
    }

    await ejecutarGuardadoCotizacion(data);
  };

  const handleConfirmarGuardarEquiposYCotizar = async () => {
    setMostrarModalEquiposNuevos(false);
    setLoading(true);
    try {
      // Guardar los equipos nuevos en la base de datos
      for (const itemNuevo of equiposNuevosDetectados) {
        await equiposApi.crearOActualizar({
          descripcion: itemNuevo.descripcionEquipo.trim(),
          partNumber: itemNuevo.partNumber?.trim() || undefined,
          caracteristicas: itemNuevo.caracteristicas?.trim() || undefined,
          precioReferencial: Number(itemNuevo.precioUnitario || 0),
          tiempoEntregaPredeterminado: itemNuevo.tiempoEntrega?.trim() || 'De 5 a 6 semanas',
          categoria: 'General'
        });
      }
      // Actualizar catálogo local de equipos
      const actualizados = await equiposApi.listarOBuscar();
      setEquiposCatalogo(actualizados);
    } catch (err) {
      console.error('Error guardando equipos nuevos en el catálogo:', err);
    } finally {
      setLoading(false);
    }

    if (datosPendientesGuardar) {
      await ejecutarGuardadoCotizacion(datosPendientesGuardar);
    }
  };

  const handleOmitirGuardarEquiposYCotizar = async () => {
    setMostrarModalEquiposNuevos(false);
    if (datosPendientesGuardar) {
      await ejecutarGuardadoCotizacion(datosPendientesGuardar);
    }
  };

  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1F3D3D] focus:ring-[#1F3D3D] sm:text-sm p-2 border";

  return (
    <div className="max-w-7xl mx-auto pb-12 px-2 sm:px-4">

      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
        className="space-y-6 sm:space-y-8"
      >
        
        {/* Two-column layout for top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          
          {/* Client Data Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Datos del Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contacto</label>
                <input {...register('contactoCliente', { required: true })} autoComplete="off" className={inputClasses} placeholder="Nombre del contacto" />
                {errors.contactoCliente && <span className="text-red-500 text-xs">Requerido</span>}
              </div>
              <div className="relative">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
                  {clientes.length > 0 && (
                    <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      BD ({clientes.length})
                    </span>
                  )}
                </div>
                <input
                  {...register('razonSocialCliente', { required: true })}
                  autoComplete="off"
                  className={inputClasses}
                  placeholder="Razón social (escriba para filtrar o ingresar nuevo)"
                  onChange={(e) => {
                    register('razonSocialCliente').onChange(e);
                    handleBuscarClientes(e.target.value);
                  }}
                  onFocus={() => {
                    handleBuscarClientes(watch('razonSocialCliente') || '');
                  }}
                />
                {errors.razonSocialCliente && <span className="text-red-500 text-xs">Requerido</span>}

                {/* Dropdown sugerido de clientes */}
                {mostrarDropdownClientes && clientesSugeridos.length > 0 && (
                  <div className="absolute z-40 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl divide-y divide-gray-100">
                    <div className="p-2 bg-gray-50 text-[11px] font-semibold text-gray-500 flex justify-between items-center sticky top-0 border-b">
                      <span>Clientes registrados en Base de Datos:</span>
                      <button
                        type="button"
                        onClick={() => setMostrarDropdownClientes(false)}
                        className="text-gray-400 hover:text-gray-600 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                    {clientesSugeridos.map(cli => (
                      <button
                        key={cli.id}
                        type="button"
                        onClick={() => handleSelectCliente(cli)}
                        className="w-full text-left p-2.5 hover:bg-emerald-50 transition-colors flex flex-col group"
                      >
                        <span className="font-semibold text-xs text-gray-900 group-hover:text-emerald-900">
                          {cli.razonSocial}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-600">
                          {cli.nombreComercial && (
                            <span className="text-[#C88D4B] font-medium font-sans">★ {cli.nombreComercial}</span>
                          )}
                          {cli.contactoPrincipal && (
                            <span className="text-gray-500">Contacto: {cli.contactoPrincipal}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Comercial</label>
                <input {...register('nombreComercial')} autoComplete="off" className={inputClasses} placeholder="Nombre comercial (opcional)" />
              </div>
            </div>
          </div>

          {/* Quote Metadata Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Datos de Cotización</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                <input type="date" {...register('fechaEmision', { required: true })} autoComplete="off" className={inputClasses} />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Emisor *</label>
                  {usuarios.length > 0 && (
                    <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Emisores en BD ({usuarios.length})
                    </span>
                  )}
                </div>
                {usuarios.length > 0 ? (
                  <div className="mt-1">
                    <select
                      value={watch('usuarioEmisor')}
                      onChange={(e) => setValue('usuarioEmisor', e.target.value)}
                      className={inputClasses}
                    >
                      {usuarios.map(u => (
                        <option key={u.id} value={u.username}>
                          {u.username} — {u.nombreCompleto} ({u.cargo || u.rol})
                        </option>
                      ))}
                      {!usuarios.some(u => u.username === watch('usuarioEmisor')) && (
                        <option value={watch('usuarioEmisor')}>{watch('usuarioEmisor')} (Personalizado)</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <input
                    {...register('usuarioEmisor', { required: true })}
                    autoComplete="off"
                    className={inputClasses}
                    placeholder="Nombre de quien cotiza"
                  />
                )}
                {errors.usuarioEmisor && <span className="text-red-500 text-xs">Requerido</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Forma de Pago</label>
                <input {...register('formaPago', { required: true })} autoComplete="off" className={inputClasses} />
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Detalle de Equipos</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ingrese los equipos, especificaciones técnicas y precios</p>
              </div>
              <button
                type="button"
                onClick={handleAgregarItem}
                className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  tieneItemIncompleto
                    ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed opacity-80 text-white'
                    : 'bg-[#1F3D3D] hover:bg-[#152a2a] text-white'
                }`}
                title={
                  tieneItemIncompleto
                    ? `Complete el Ítem #${itemIncompleto?.numero} (nombre, tiempo de entrega, cantidad y precio > 0) para agregar otro`
                    : "Agregar un nuevo ítem a la cotización"
                }
              >
                <span>+ Agregar Ítem</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#6394EC] text-white">
                    <th className="p-3 font-semibold text-sm rounded-tl-lg w-12 text-center">#</th>
                    <th className="p-3 font-semibold text-sm min-w-[340px]">Equipo y Especificaciones Técnicas</th>
                    <th className="p-3 font-semibold text-sm w-36">Tiempo Entrega</th>
                    <th className="p-3 font-semibold text-sm w-20 text-center">Cant.</th>
                    <th className="p-3 font-semibold text-sm w-28 text-right">Precio Unit. ($)</th>
                    <th className="p-3 font-semibold text-sm w-28 text-right">Total ($)</th>
                    <th className="p-3 font-semibold text-sm rounded-tr-lg w-14 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fields.map((field, index) => {
                    const currentItem = watchedItems?.[index];
                    const cant = Number(currentItem?.cantidad || 0);
                    const precio = Number(currentItem?.precioUnitario || 0);
                    const totalLinea = Math.round(cant * precio * 100) / 100;

                    return (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="p-3 align-top font-bold text-gray-500 text-center">
                          {index + 1}
                          <input type="hidden" {...register(`items.${index}.itemNumero`)} value={index + 1} />
                        </td>
                        <td className="p-3 align-top">
                          <div className="space-y-2">
                            <div className="relative">
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-gray-700 block">
                                  Nombre del Equipo o Servicio *
                                </label>
                                {currentItem?.equipoId ? (
                                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                                    ✓ Catálogo BD
                                  </span>
                                ) : currentItem?.descripcionEquipo?.trim() ? (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                    ✦ Nuevo en BD
                                  </span>
                                ) : null}
                              </div>
                              <input
                                {...register(`items.${index}.descripcionEquipo`, { required: true })}
                                autoComplete="off"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1F3D3D] focus:ring-[#1F3D3D] text-sm p-2 border font-medium"
                                placeholder="Ej: IMPRESORA DE TARJETAS ZEBRA ZC300 DUAL (escriba para buscar o ingresar nuevo)"
                                onChange={(e) => {
                                  register(`items.${index}.descripcionEquipo`).onChange(e);
                                  handleBuscarEquipos(index, e.target.value);
                                }}
                                onFocus={() => {
                                  handleBuscarEquipos(index, currentItem?.descripcionEquipo || '');
                                }}
                              />
                              {errors.items?.[index]?.descripcionEquipo && (
                                <span className="text-red-500 text-xs block mt-0.5">Requerido</span>
                              )}

                              {/* Dropdown interactivo de equipos filtrados */}
                              {busquedaActivaItem === index && equiposFiltrados[index]?.length > 0 && (
                                <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl divide-y divide-gray-100">
                                  <div className="p-2 bg-gray-50 text-[11px] font-semibold text-gray-600 flex justify-between items-center sticky top-0 border-b">
                                    <span>Resultados en Base de Datos ({equiposFiltrados[index].length}):</span>
                                    <button
                                      type="button"
                                      onClick={() => setBusquedaActivaItem(null)}
                                      className="text-gray-400 hover:text-gray-600 font-bold px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {equiposFiltrados[index].map(eq => (
                                    <button
                                      key={eq.id}
                                      type="button"
                                      onClick={() => handleSelectEquipo(index, eq)}
                                      className="w-full text-left p-2.5 hover:bg-blue-50 transition-colors flex flex-col group"
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className="font-semibold text-xs text-gray-900 group-hover:text-blue-900">
                                          {eq.descripcion}
                                        </span>
                                        {eq.precioReferencial !== undefined && eq.precioReferencial !== null && (
                                          <span className="text-xs font-bold font-mono text-emerald-700 ml-2 shrink-0">
                                            ${Number(eq.precioReferencial).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                                        {eq.partNumber && (
                                          <span className="bg-gray-100 text-gray-700 font-mono px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                                            PN: {eq.partNumber}
                                          </span>
                                        )}
                                        {eq.tiempoEntregaPredeterminado && (
                                          <span className="text-gray-500 text-[10px]">
                                            {eq.tiempoEntregaPredeterminado}
                                          </span>
                                        )}
                                      </div>
                                      {eq.caracteristicas && (
                                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic">
                                          {eq.caracteristicas.split('\n').slice(0, 2).join(' • ')}
                                        </p>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                              <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-0.5">
                                  Part Number (PN)
                                </label>
                                <input
                                  {...register(`items.${index}.partNumber`)}
                                  autoComplete="off"
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1F3D3D] focus:ring-[#1F3D3D] text-xs p-1.5 border font-mono bg-white"
                                  placeholder="Ej: ZCD-800300-250LA (opcional)"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 flex justify-between items-center mb-0.5">
                                  <span>Características / Especificaciones Técnicas</span>
                                  <span className="text-[10px] text-gray-400 font-normal">Una por línea (viñetas en PDF)</span>
                                </label>
                                <textarea
                                  {...register(`items.${index}.caracteristicas`)}
                                  rows={3}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1F3D3D] focus:ring-[#1F3D3D] text-xs p-1.5 border bg-white"
                                  placeholder="• Sublimación directa a la tarjeta&#10;• Impresión a doble cara automática&#10;• Resolución 300 dpi (11.8 puntos/mm)&#10;• Conectividad USB 2.0 y Ethernet 10/100"
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <label className="text-xs font-semibold text-gray-500 block mb-1 md:hidden">Entrega</label>
                          <input {...register(`items.${index}.tiempoEntrega`)} autoComplete="off" className={inputClasses} placeholder="Ej: De 5 a 6 semanas" />
                        </td>
                        <td className="p-3 align-top">
                          <label className="text-xs font-semibold text-gray-500 block mb-1 md:hidden">Cant.</label>
                          <input type="number" step="1" min="1" {...register(`items.${index}.cantidad`, { required: true, valueAsNumber: true })} className={`${inputClasses} text-center`} />
                        </td>
                        <td className="p-3 align-top">
                          <label className="text-xs font-semibold text-gray-500 block mb-1 md:hidden">Precio</label>
                          <input type="number" step="0.01" min="0" {...register(`items.${index}.precioUnitario`, { required: true, valueAsNumber: true })} className={`${inputClasses} text-right font-mono`} />
                        </td>
                        <td className="p-3 align-top">
                          <label className="text-xs font-semibold text-gray-500 block mb-1 md:hidden">Total</label>
                          <div className="p-2 bg-gray-100 rounded-md font-bold text-gray-800 text-right font-mono mt-1">
                            ${totalLinea.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 align-top text-center">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 hover:text-red-700 p-2 font-bold mt-1"
                              title="Eliminar este ítem"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Section: Notes & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Nota Importante</h2>
            <textarea
              {...register('notaImportante')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1F3D3D] focus:ring-[#1F3D3D] sm:text-sm p-2 border"
            />
          </div>

          <div className="bg-rose-50 rounded-xl shadow-lg p-4 sm:p-6 border border-rose-200 flex flex-col justify-center">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Subtotal sin IVA:</span>
                <span className="font-semibold">${subtotalSinIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">13% IVA:</span>
                <span className="font-semibold">${montoIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-900 text-xl font-bold pt-2 border-t border-rose-200">
                <span>Total Inversión:</span>
                <span>${totalInversion.toFixed(2)}</span>
              </div>
              <div className="text-xs text-rose-700 text-right font-medium italic">
                Son: {totalEnLetras}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white font-medium rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 text-center"
          >
            Vista Previa PDF
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-[#1F3D3D] text-white font-medium rounded-lg shadow-sm hover:bg-[#152a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F3D3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-center"
          >
            {loading ? 'Guardando...' : 'Guardar Cotización'}
          </button>
        </div>
      </form>

      {/* Modal interactivo de detección y guardado de equipos nuevos en BD */}
      {mostrarModalEquiposNuevos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg shrink-0">
                ★
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Equipos Nuevos Detectados
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Se detectaron equipos en la cotización que aún no existen en el catálogo de la base de datos:
                </p>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {equiposNuevosDetectados.map((it, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded border border-gray-200 text-xs">
                  <p className="font-semibold text-gray-900">{it.descripcionEquipo}</p>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    {it.partNumber && (
                      <span className="font-mono bg-gray-100 px-1 rounded text-[11px] border border-gray-200">
                        PN: {it.partNumber}
                      </span>
                    )}
                    <span>Precio: ${Number(it.precioUnitario || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-700 font-medium">
              ¿Desea agregarlos al catálogo maestro de la base de datos para utilizarlos en futuras cotizaciones?
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setMostrarModalEquiposNuevos(false)}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleOmitirGuardarEquiposYCotizar}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Solo Crear Cotización
              </button>
              <button
                type="button"
                onClick={handleConfirmarGuardarEquiposYCotizar}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F3D3D] hover:bg-[#152a2a] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                ✓ Guardar en BD y Crear Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
