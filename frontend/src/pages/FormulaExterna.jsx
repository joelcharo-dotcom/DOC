import { useState, useRef } from 'react';
import { Printer, Plus, Trash2, ClipboardList, RotateCcw } from 'lucide-react';

export default function FormulaExterna() {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ nombre: '', cantidad: 1, unidad: '' }]);
  const printRef = useRef();

  const addItem = () => {
    setItems([...items, { nombre: '', cantidad: 1, unidad: '' }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const limpiarTodo = () => {
    setNombre('');
    setCedula('');
    setDireccion('');
    setTelefono('');
    setFecha(new Date().toISOString().split('T')[0]);
    setItems([{ nombre: '', cantidad: 1, unidad: '' }]);
  };

  const formatDate = (date) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getNumero = () => {
    return String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const itemsConDatos = items.filter(i => i.nombre.trim() !== '');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <ClipboardList size={28} />
            <span className="text-xl font-bold">FUNDAMUFA - Fórmula Externa</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          📋 Esta fórmula es independiente y <strong>no se guarda</strong> en la base de datos. Llene los campos, imprima y entregue al paciente.
        </div>

        {/* Datos del paciente */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Datos del Paciente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Nombre completo del paciente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Número de cédula"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Dirección"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Teléfono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Items de la fórmula */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Medicamentos</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex gap-2 mb-3 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.nombre}
                  onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nombre del medicamento"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                />
              </div>
              <div className="w-32">
                <input
                  type="text"
                  value={item.unidad}
                  onChange={(e) => updateItem(index, 'unidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Frascos"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={items.length === 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={limpiarTodo}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RotateCcw size={18} />
            Limpiar todo
          </button>
          <button
            onClick={handlePrint}
            disabled={!nombre.trim() || itemsConDatos.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={20} />
            Imprimir Fórmula
          </button>
        </div>

        {/* Vista previa para impresión (oculta) */}
        <div ref={printRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div className="print-content font-serif" style={{ fontSize: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '2px solid #8B4513', paddingBottom: '10px', marginBottom: '15px' }}>
              <div style={{ width: '100px', marginRight: '15px' }}>
                <img src="/logoo.png" alt="FUNDAMUFA" style={{ width: '90px', height: 'auto' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#8B0000', margin: '0 0 3px 0' }}>
                  FUNDACION HUESPED MUJER Y FAMILIA
                </h1>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0' }}>JORGE CHARRASQUIEL RODRIGUEZ</p>
                <p style={{ fontSize: '11px', margin: '2px 0' }}>
                  Medico <span style={{ fontStyle: 'italic', color: '#4a4a4a' }}>Alternativo</span>
                </p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>U DE H.AC(FUNHOMEDIK)P.0689. Estudios de Medicinas</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Alternativas en la Union Sovietica</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Pagina web: www.funhuespedmujeryflia.org</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Carrera 50 N.52-89 Avenida Palace Hotel Nutibara Express</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Consultorio 736</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Telefonos 313 666 74 79 / 320 633 22 33</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Medellin - Colombia</p>
              </div>
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontSize: '11px', margin: '0' }}>No.</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B0000' }}>{getNumero()}</p>
              </div>
            </div>

            {/* Datos del paciente */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '15%' }}>
                    <strong>Fecha</strong><br/>{formatDate(fecha)}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '30%' }}>
                    <strong>Nombre</strong><br/>{nombre.toUpperCase()}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '25%' }}>
                    <strong>Dirección</strong><br/>{direccion || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '15%' }}>
                    <strong>Cedula</strong><br/>{cedula || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '15%' }}>
                    <strong>Telefono</strong><br/>{telefono || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabla de medicamentos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <td colSpan="2" style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                    Descripción
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>
                    Cant.
                  </td>
                </tr>
              </thead>
              <tbody>
                {itemsConDatos.map((item, index) => (
                  <tr key={index}>
                    <td colSpan="2" style={{ border: '1px solid #999', padding: '8px', fontSize: '11px' }}>
                      {item.nombre}
                    </td>
                    <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                      {item.cantidad}{item.unidad ? ` ${item.unidad}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Advertencia */}
            <div style={{ border: '2px solid #8B0000', padding: '8px', marginBottom: '15px', backgroundColor: '#fff0f0' }}>
              <p style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'bold', margin: '0' }}>
                ESTA PROHIBIDO EL USO DE TINTO, LIMON, ALIMENTOS IRRITANTES DURANTE EL TRATAMIENTO, PUES ESTOS ANULAN LA EFECTIVIDAD DEL MEDICAMENTO
              </p>
            </div>

            {/* Pie de página */}
            <div style={{ textAlign: 'center', borderTop: '1px solid #999', paddingTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold' }}>PRESENTAR ESTA FORMULA EN LA PROXIMA CONSULTA</p>
            </div>

            {/* Línea de corte */}
            <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
              <div style={{ borderTop: '2px dashed #999', width: '100%', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-5px', top: '-10px', fontSize: '16px' }}>✂</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
