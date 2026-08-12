
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
        valor: formData.valor ? parseFloat(formData.valor) : 0,
        tipoPago: formData.tipoPago || 'pago',
        referido: formData.referido && formData.referido.trim() !== '' ? formData.referido.trim() : null,
        examenes: examenes.filter(ex => ex.imagen).map(ex => ({
          nombre: ex.nombre || 'Examen',
          imagen: ex.imagen
        }))
      };
      console.log('ENVIANDO:', payload);
      if (id) {
        await api.put(`/historias/${id}`, payload);
      } else {
        const res = await api.post('/historias', payload);
        console.log('RESPUESTA OK:', res.data);
      }
      navigate('/historias');
    } catch (err) {
      console.error('ERROR COMPLETO:', err);
      console.error('ERROR RESPONSE:', err.response?.data);
      const data = err.response?.data;
      const msg = data?.error || 'Error al guardar historia';
      const details = data?.details || data?.meta || data?.code || err.message || JSON.stringify(data || {}).substring(0, 500);
      setError(msg);
      setErrorDetalle(typeof details === 'string' ? details : JSON.stringify(details).substring(0, 800));
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
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span onClick={() => navigate('/historias')} style={{ cursor: 'pointer' }}>←</span>
        {id ? 'Editar Historia' : 'Nueva Historia'}
      </h2>
      <p>Complete los datos de la nueva historia</p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>
          <div style={{ fontWeight: 'bold' }}>{error}</div>
          {errorDetalle && <div style={{ marginTop: '8px', fontSize: '12px', background: 'white', padding: '8px', borderRadius: '4px', wordBreak: 'break-all' }}>DETALLE: {errorDetalle}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Paciente *</label>
          {!clienteSeleccionado ? (
            <>
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
              {busquedaCliente && (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginTop: '8px' }}>
                  {clientesFiltrados.slice(0, 10).map(c => (
                    <div key={c.id} onClick={() => { setClienteSeleccionado(c); setBusquedaCliente(''); }} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                      <strong>{c.nombre}</strong> - CC: {c.cedula}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{clienteSeleccionado.nombre}</strong><br />
                <small>CC: {clienteSeleccionado.cedula}</small>
              </div>
              <button type="button" onClick={() => setClienteSeleccionado(null)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Observaciones *</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Escriba el diagnóstico, síntomas, tratamiento..."
            rows={6}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Tipo de pago</label>
            <select value={formData.tipoPago} onChange={(e) => setFormData({ ...formData, tipoPago: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="pago">💰 Pagó</option>
              <option value="credito">📝 Crédito</option>
              <option value="cortesia">🎁 Cortesía</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Valor ($)</label>
            <input type="number" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Referido por (opcional)</label>
          <input type="text" value={formData.referido} onChange={(e) => setFormData({ ...formData, referido: e.target.value })} placeholder="Nombre de quien lo refirió" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Exámenes / Fotos (opcional)</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="fileInput" />
          <label htmlFor="fileInput" style={{ display: 'block', border: '2px dashed #60a5fa', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f0f9ff' }}>
            📷 Tomar foto o seleccionar imagen
          </label>
          {examenes.length > 0 && <div style={{ marginTop: '10px' }}>{examenes.map((ex, i) => <div key={i} style={{ fontSize: '12px', background: '#f3f4f6', padding: '6px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}><span>{ex.nombre}</span><button type="button" onClick={() => setExamenes(examenes.filter((_, idx) => idx !== i))} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>X</button></div>)}</div>}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/historias')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#e5e7eb', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' }}>{loading ? 'Guardando...' : '💾 Guardar'}</button>
        </div>
      </form>
    </div>
  );
}
