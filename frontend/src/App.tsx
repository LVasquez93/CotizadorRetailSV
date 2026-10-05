import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { CotizacionForm } from './features/cotizaciones/components/CotizacionForm';
import { CotizacionesList } from './features/cotizaciones/components/CotizacionesList';
import { SucursalesView } from './features/sucursales/SucursalesView';
import { SucursalProvider } from './context/SucursalContext';

function App() {
  return (
    <BrowserRouter>
      <SucursalProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="py-6 px-2 sm:py-8 sm:px-4">
            <Routes>
              <Route path="/" element={<CotizacionForm />} />
              <Route path="/cotizaciones" element={<CotizacionesList />} />
              <Route path="/sucursales" element={<SucursalesView />} />
            </Routes>
          </main>
        </div>
      </SucursalProvider>
    </BrowserRouter>
  );
}

export default App;
