import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, X } from 'lucide-react';

export default function Contabilidad() {
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('entrada');
  const [monto, setMonto] = useState('');

  const formatoPesos = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);

  const totalEntradas = movimientos.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0);
  const balance = totalEntradas - totalGastos;
  const movimientosFiltrados = movimientos.filter((m) => (filtro === 'todos' ? true : m.tipo === filtro));

  const guardarMovimiento = () => {
    if (!descripcion.trim() || !monto || Number(monto) <= 0) {
      alert('Escribe una descripción y un monto válido.');
      return;
    }
    setMovimientos([{ id: Date.now(), fecha, descripcion: descripcion.trim(), tipo, monto: Number(monto) }, ...movimientos]);
    setDescripcion(''); setMonto(''); setTipo('entrada'); setFecha(new Date().toISOString().slice(0, 10)); setMostrarForm(false);
  };

  const eliminarMovimiento = (id) => {
    if (window.confirm('¿Seguro de eliminar este movimiento?')) setMovimientos(movimientos.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="text-blue-600" /> Contabilidad del Proyecto
          </h1>
          <p className="text-gray-500">Control de entradas y gastos</p>
        </div>
        <button onClick={() => setMostrarForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors w-fit">
          <Plus size={20} /> Nuevo Movimiento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Entradas</p><p className="text-2xl font-bold text-green-600">{formatoPesos(totalEntradas)}</p></div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Gastos</p><p className="text-2xl font-bold text-red-600">{formatoPesos(totalGastos)}</p></div>
            <TrendingDown className="text-red-500" size={32} />
          </div>
        </div>
        <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${balance >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Balance</p><p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatoPesos(balance)}</p></div>
            <Wallet className={balance >= 0 ? 'text-blue-500' : 'text-orange-500'} size={32} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos</button>
        <button onClick={() => setFiltro('entrada')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtro === 'entrada' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Entradas</button>
        <button onClick={() => setFiltro('gasto')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtro === 'gasto' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Gastos</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Monto</th>
                <th className="text-center px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No hay movimientos registrados todavía.</td></tr>
              ) : (
                movimientosFiltrados.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 text-gray-800">{m.descripcion}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.tipo === 'entrada' ? 'Entrada' : 'Gasto'}</span></td>
                    <td className={`px-4 py-3 text-right font-medium ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{m.tipo === 'entrada' ? '+' : '-'} {formatoPesos(m.monto)}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => eliminarMovimiento(m.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar"><Trash2 size={18} /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center">Nota: por ahora los movimientos se ven en pantalla. Más adelante se conectará para que queden guardados permanentemente.</p>

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Nuevo Movimiento</h2>
              <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Donación, compra de medicamentos..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2 rounded-lg font-medium transition-colors ${tipo === 'entrada' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Entrada</button>
                <button type="button" onClick={() => setTipo('gasto')} className={`flex-1 py-2 rounded-lg font-medium transition-colors ${tipo === 'gasto' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Gasto</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monto (pesos)</label>
              <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 50000" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setMostrarForm(false)} className="flex-1 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={guardarMovimiento} className="flex-1 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
