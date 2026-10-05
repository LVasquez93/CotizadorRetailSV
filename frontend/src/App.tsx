import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { CotizacionForm } from './features/cotizaciones/components/CotizacionForm';
import { CotizacionesList } from './features/cotizaciones/components/CotizacionesList';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="py-6 px-2 sm:py-8 sm:px-4">
          <Routes>
            <Route path="/" element={<CotizacionForm />} />
            <Route path="/cotizaciones" element={<CotizacionesList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
