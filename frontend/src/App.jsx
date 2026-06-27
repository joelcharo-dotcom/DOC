import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Clientes from './pages/Clientes';
import ClienteForm from './pages/ClienteForm';
import ClienteDetalle from './pages/ClienteDetalle';
import Historias from './pages/Historias';
import HistoriaForm from './pages/HistoriaForm';
import Formulas from './pages/Formulas';
import FormulaForm from './pages/FormulaForm';
import Notas from './pages/Notas';
import NotaForm from './pages/NotaForm';
import Contabilidad from './pages/Contabilidad';
import Facturas from './pages/Facturas';
import FacturaForm from './pages/FacturaForm';
import FormulaExterna from './pages/FormulaExterna';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/formula-externa" element={<FormulaExterna />} />

          {/* Rutas protegidas */}
          <Route path="/" element={<ProtectedRoute><Layout><Inicio /></Layout></ProtectedRoute>} />

          {/* Clientes */}
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/clientes/nuevo" element={<ProtectedRoute><Layout><ClienteForm /></Layout></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute><Layout><ClienteDetalle /></Layout></ProtectedRoute>} />
          <Route path="/clientes/:id/editar" element={<ProtectedRoute><Layout><ClienteForm /></Layout></ProtectedRoute>} />

          {/* Historias */}
          <Route path="/historias" element={<ProtectedRoute><Layout><Historias /></Layout></ProtectedRoute>} />
          <Route path="/historias/nueva" element={<ProtectedRoute><Layout><HistoriaForm /></Layout></ProtectedRoute>} />
          <Route path="/historias/:id/editar" element={<ProtectedRoute><Layout><HistoriaForm /></Layout></ProtectedRoute>} />

          {/* Fórmulas */}
          <Route path="/formulas" element={<ProtectedRoute><Layout><Formulas /></Layout></ProtectedRoute>} />
          <Route path="/formulas/nueva" element={<ProtectedRoute><Layout><FormulaForm /></Layout></ProtectedRoute>} />
          <Route path="/formulas/:id/editar" element={<ProtectedRoute><Layout><FormulaForm /></Layout></ProtectedRoute>} />

          {/* Notas */}
          <Route path="/notas" element={<ProtectedRoute><Layout><Notas /></Layout></ProtectedRoute>} />
          <Route path="/notas/nueva" element={<ProtectedRoute><Layout><NotaForm /></Layout></ProtectedRoute>} />
          <Route path="/notas/:id/editar" element={<ProtectedRoute><Layout><NotaForm /></Layout></ProtectedRoute>} />

          {/* Contabilidad */}
          <Route path="/contabilidad" element={<ProtectedRoute><Layout><Contabilidad /></Layout></ProtectedRoute>} />

          {/* Facturas */}
          <Route path="/facturas" element={<ProtectedRoute><Layout><Facturas /></Layout></ProtectedRoute>} />
          <Route path="/facturas/nueva" element={<ProtectedRoute><Layout><FacturaForm /></Layout></ProtectedRoute>} />
          <Route path="/facturas/:id/editar" element={<ProtectedRoute><Layout><FacturaForm /></Layout></ProtectedRoute>} />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
