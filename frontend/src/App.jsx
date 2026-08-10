import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Clientes from './pages/Clientes';
import Historias from './pages/Historias';
import Formulas from './pages/Formulas';
import Facturas from './pages/Facturas';
import Contabilidad from './pages/Contabilidad';
import Notas from './pages/Notas';
import Citas from './components/Citas';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Inicio /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/historias" element={<ProtectedRoute><Layout><Historias /></Layout></ProtectedRoute>} />
          <Route path="/formulas" element={<ProtectedRoute><Layout><Formulas /></Layout></ProtectedRoute>} />
          <Route path="/facturas" element={<ProtectedRoute><Layout><Facturas /></Layout></ProtectedRoute>} />
          <Route path="/contabilidad" element={<ProtectedRoute><Layout><Contabilidad /></Layout></ProtectedRoute>} />
          <Route path="/notas" element={<ProtectedRoute><Layout><Notas /></Layout></ProtectedRoute>} />
          <Route path="/citas" element={<ProtectedRoute><Layout><Citas /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
