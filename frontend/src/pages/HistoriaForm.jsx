import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function HistoriaForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    observaciones: '',
    valor: 0,
    tipoPago: 'pago',
    referido: '',
  });
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetalle, setErrorDetalle] = useState('');

  useEffect(() => {
    const clienteIdFromUrl = searchParams.get('clienteId');
    fetchClientes(clienteIdFromUrl);
    if (id) fetchHistoria();
  }, [id]);

  const fetchClientes = async (preselectId) => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
      if (preselectId) {
        const c = res.data.find(x => x.id === parseInt(preselectId));
        if (c) setClienteSeleccionado(c);
      }
    } catch (e) { console.error(e); }
  };

  const fetchHistoria = async () => {
    try {
      const res = await api.get(`/historias/${id}`);
      setClienteSeleccionado(res.data.cliente);
      setFormData({
        observaciones: res.data.observaciones || '',
        valor: res.data.valor || 0,
        tipoPago: res.data.tipoPago || 'pago',
        referido: res.data.referido || '',
      });
      setExamenes(res.data.examenes || []);
    } catch (e) { setError('Error al cargar historia'); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExamenes(prev => [...prev, { nombre: file.name, imagen: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) { setError('Seleccione un paciente'); return; }
    if (!formData.observaciones.trim()) { setError('Escriba las observaciones'); return; }

    setLoading(true);
    setError('');
    setErrorDetalle('');
    try {
      const payload = {
        clienteId: parseInt(clienteSeleccionado.id),
        observaciones: String(formData.observaciones).trim(),
        valor: formData.valor? parseFloat(formData.valor) : 0,
        tipoPago: formData.tipoPago || 'pago',
        referido: formData.referido && formData.referido.trim()!== ''? formData.referido.trim() : null,
        examenes: examenes.filter(ex => ex.imagen).map(ex => ({
          nombre: ex.nombre || 'Examen',
          imagen: ex.imagen
        }))
      };
      if (id) {
        await api.put(`/historias/${id}`, payload);
      } else {
        await api.post('/historias', payload);
      }
      navigate('/historias');
    } catch (err) {
      console.error('ERROR COMPLETO:', err);
      const data = err.response?.data;
      const msg = data?.error || 'Error al guardar historia';
      const details = data?.details || data?.meta || data?.code || err.message || '';
      setError(msg);
      setErrorDetalle(typeof details === 'string'? details : JSON.stringify(details));
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    (c.nombre && c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())) ||
    (c.cedula && c.cedula.includes(busquedaCliente))
  );

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2> {id? 'Editar Historia' : 'Nueva Historia'} </h2>
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold' }}>{error}</div>
          {errorDetalle && <div style={{ marginTop: '8px', fontSize: '12px', background: 'white', padding: '8px', borderRadius: '4px' }}>DETALLE: {errorDetalle}</div>}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label>Paciente *</label>
          {!clienteSeleccionado? (
            <>
              <input type="text" placeholder="Buscar..." value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              {busquedaCliente && (
                <div style={{ border: '1px solid #ddd', maxHeight: '150px', overflowY: 'auto' }}>
                  {clientesFiltrados.slice(0, 10).map(c => (
                    <div key={c.id} onClick={() => { setClienteSeleccionado(c); setBusquedaCliente(''); }} style={{ padding: '10px', cursor: 'pointer' }}>
                      {c.nombre} - CC: {c.cedula}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>{clienteSeleccionado.nombre}</strong><br /><small>CC: {clienteSeleccionado.cedula}</small></div>
              <button type="button" onClick={() => setClienteSeleccionado(null)}>Cambiar</button>
            </div>
          )}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Observaciones *</label>
          <textarea value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value })} rows={6} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/historias')} style={{ flex: 1, padding: '12px' }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: '#16a34a', color: 'white' }}>{loading? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
}
