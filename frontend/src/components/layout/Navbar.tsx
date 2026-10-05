import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path
      ? 'bg-white/20 font-semibold'
      : 'hover:bg-white/10';

  return (
    <nav className="bg-[#1F3D3D] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-wide">Retail</span>
            <span className="text-xs sm:text-sm text-[#C88D4B] font-medium">El Salvador</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${isActive('/')}`}
            >
              Nueva Cotización
            </Link>
            <Link
              to="/cotizaciones"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${isActive('/cotizaciones')}`}
            >
              Historial
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
