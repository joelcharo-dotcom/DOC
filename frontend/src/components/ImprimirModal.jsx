import { X, Printer, Eye } from 'lucide-react';
import { useRef } from 'react';

export default function ImprimirModal({ tipo, data, onClose, soloVista = false }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Generar número de fórmula basado en ID y fecha
  const getNumeroFormula = () => {
    const id = data.id || Math.floor(Math.random() * 10000);
    return String(id).padStart(6, '0');
  };

  const renderContenido = () => {
    switch (tipo) {
      case 'formula':
        return (
          <div className="print-content font-serif" style={{ fontSize: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Encabezado estilo original */}
            <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '2px solid #8B4513', paddingBottom: '10px', marginBottom: '15px' }}>
              {/* Logo izquierda */}
              <div style={{ width: '100px', marginRight: '15px' }}>
                <img src="/logoo.png" alt="FUNDAMUFA" style={{ width: '90px', height: 'auto' }} />
              </div>
              
              {/* Información central */}
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
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Carrera 50 N.52-89 Avenida Palace Edificio Nutibara Express</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Oficina 722 - Séptimo Piso</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Celular 313 666 74 79</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Medellin - Colombia</p>
              </div>

              {/* Número de fórmula derecha */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontSize: '11px', margin: '0' }}>No.</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B0000' }}>{getNumeroFormula()}</p>
              </div>
            </div>

            {/* Datos del paciente en tabla */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Id</strong><br/>{getNumeroFormula()}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '15%' }}>
                    <strong>Fecha</strong><br/>{formatDate(data.fecha)}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '25%' }}>
                    <strong>Nombre</strong><br/>{data.cliente?.nombre?.toUpperCase()}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '30%' }}>
                    <strong>Dirección</strong><br/>{data.cliente?.direccion || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Cedula</strong><br/>{data.cliente?.cedula}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Telefono</strong><br/>{data.cliente?.telefono || 'N/A'}
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
                {data.items?.map((item, index) => (
                  <tr key={index}>
                    <td colSpan="2" style={{ border: '1px solid #999', padding: '8px', fontSize: '11px' }}>
                      {item.nombre}
                      {item.dosis && <span style={{ marginLeft: '20px' }}>...{item.dosis}</span>}
                    </td>
                    <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                      {item.cantidad} {item.unidad || 'FRASCOS'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Indicaciones */}
            {data.indicaciones && (
              <div style={{ border: '1px solid #999', padding: '10px', marginBottom: '15px', backgroundColor: '#fffef0' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', textAlign: 'center' }}>
                  {data.indicaciones}
                </p>
              </div>
            )}

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

            {/* Línea de corte con tijera */}
            <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
              <div style={{ borderTop: '2px dashed #999', width: '100%', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-5px', top: '-10px', fontSize: '16px' }}>✂</span>
              </div>
            </div>
          </div>
        );

      case 'historia':
        return (
          <div className="print-content font-serif" style={{ fontSize: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Encabezado estilo original */}
            <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '2px solid #8B4513', paddingBottom: '10px', marginBottom: '15px' }}>
              {/* Logo izquierda */}
              <div style={{ width: '100px', marginRight: '15px' }}>
                <img src="/logoo.png" alt="FUNDAMUFA" style={{ width: '90px', height: 'auto' }} />
              </div>
              
              {/* Información central */}
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
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Carrera 50 N.52-89 Avenida Palace Edificio Nutibara Express</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Oficina 722 - Séptimo Piso</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Celular 313 666 74 79</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Medellin - Colombia</p>
              </div>

              {/* Número derecha */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontSize: '11px', margin: '0' }}>No.</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B0000' }}>{getNumeroFormula()}</p>
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', margin: '15px 0', textDecoration: 'underline' }}>
              HISTORIA CLÍNICA
            </h2>

            {/* Datos del paciente */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Id</strong><br/>{getNumeroFormula()}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '15%' }}>
                    <strong>Fecha</strong><br/>{formatDate(data.fecha)}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '25%' }}>
                    <strong>Nombre</strong><br/>{data.cliente?.nombre?.toUpperCase()}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '30%' }}>
                    <strong>Dirección</strong><br/>{data.cliente?.direccion || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Cedula</strong><br/>{data.cliente?.cedula}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '5px', width: '10%' }}>
                    <strong>Telefono</strong><br/>{data.cliente?.telefono || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Observaciones */}
            <div style={{ border: '1px solid #999', padding: '15px', marginBottom: '15px', minHeight: '300px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                Observaciones Clínicas:
              </p>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.6' }}>
                {data.observaciones}
              </div>
            </div>

            {/* Valor consulta */}
            {data.valor && (
              <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <span style={{ fontSize: '12px' }}>{data.tipoPago === 'abono' ? 'Abonó: ' : 'Valor consulta: '}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>${data.valor.toLocaleString('es-CO')}</span>
              </div>
            )}

            {/* Referido */}
            {data.referido && (
              <div style={{ marginBottom: '15px', fontSize: '11px' }}>
                <strong>Referido por:</strong> {data.referido}
              </div>
            )}

            {/* Exámenes adjuntos */}
            {data.examenes && data.examenes.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                  📷 Exámenes adjuntos ({data.examenes.length}):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {data.examenes.map((examen, idx) => (
                    <div key={idx} style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                      <img
                        src={examen.imagen}
                        alt={examen.nombre}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                      <p style={{ fontSize: '9px', textAlign: 'center', padding: '3px', margin: 0, backgroundColor: '#f5f5f5' }}>
                        {examen.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Firma */}
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #333', width: '200px', margin: '0 auto' }}></div>
              <p style={{ fontSize: '10px', marginTop: '5px' }}>Firma y Sello</p>
            </div>

            {/* Línea de corte con tijera */}
            <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
              <div style={{ borderTop: '2px dashed #999', width: '100%', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-5px', top: '-10px', fontSize: '16px' }}>✂</span>
              </div>
            </div>
          </div>
        );

      case 'factura':
        const formatMoney = (amount) => {
          return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(amount || 0);
        };

        const getVencimiento = () => {
          if (data.vencimiento) return formatDate(data.vencimiento);
          // Si no hay vencimiento, poner 30 días después de la fecha
          const fechaBase = new Date(data.fecha);
          fechaBase.setDate(fechaBase.getDate() + 30);
          return formatDate(fechaBase);
        };

        return (
          <div className="print-content font-serif" style={{ fontSize: '13px', maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
            {/* Título */}
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 25px 0', color: '#333' }}>Factura</h1>

            {/* Encabezado con logo + datos factura */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
              {/* Logo y datos de la fundación */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div>
                  <img src="/logoo.png" alt="FUNDAMUFA" style={{ width: '80px', height: 'auto' }} />
                </div>
              </div>

              {/* Datos de la factura (derecha) */}
              <div style={{ textAlign: 'left', fontSize: '12px' }}>
                <table style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 15px 2px 0', fontWeight: 'bold' }}>Fecha:</td>
                      <td style={{ padding: '2px 0' }}>{formatDate(data.fecha)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 15px 2px 0', fontWeight: 'bold' }}>Nº de factura:</td>
                      <td style={{ padding: '2px 0' }}>{data.numero}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 15px 2px 0', fontWeight: 'bold' }}>Fecha<br/>vencimiento:</td>
                      <td style={{ padding: '2px 0' }}>{getVencimiento()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Información de la fundación */}
            <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 3px 0' }}>FUNDACION HUESPED MUJER Y FAMILIA</p>
              <p style={{ margin: '0', fontSize: '12px' }}>NIT 900351001-8</p>
              <p style={{ margin: '0', fontSize: '12px' }}>CARRERA 50 ( PALACE ) NRO 52 - 89  OFICINA 722 SÉPTIMO PISO MEDELLIN</p>
              <p style={{ margin: '0', fontSize: '12px' }}>ANTIOQUIA</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>MEDICO JORGE CHARRASQUIEL</p>
              <p style={{ margin: '0', fontSize: '12px' }}>Celular 3136667479</p>
            </div>

            {/* Facturar a */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 5px 0' }}>Facturar a</p>
              <p style={{ margin: '0', fontSize: '13px' }}>{data.cliente?.nombre?.toUpperCase()}</p>
              <p style={{ margin: '0', fontSize: '12px' }}>{data.cliente?.direccion || ''}</p>
              {data.cliente?.telefono && (
                <p style={{ margin: '0', fontSize: '12px' }}>Tel: {data.cliente.telefono}</p>
              )}
              <p style={{ margin: '0', fontSize: '12px' }}>C.C. {data.cliente?.cedula}</p>
            </div>

            {/* Tabla de ítems */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8f8f8', width: '60px' }}>Cant.</th>
                  <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8f8f8' }}>Descripción</th>
                  <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8f8f8', width: '140px' }}>Precio unitario</th>
                  <th style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8f8f8', width: '130px', fontStyle: 'italic' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', fontSize: '12px' }}>{item.cantidad}</td>
                    <td style={{ border: '1px solid #999', padding: '8px', fontSize: '12px' }}>{item.descripcion?.toUpperCase()}</td>
                    <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontSize: '12px' }}>{formatMoney(item.precioUnitario)}</td>
                    <td style={{ border: '1px solid #999', padding: '8px', textAlign: 'right', fontSize: '12px' }}>{formatMoney(item.total)}</td>
                  </tr>
                ))}
                {/* Filas vacías para completar la tabla */}
                {Array.from({ length: Math.max(0, 6 - (data.items?.length || 0)) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ border: '1px solid #999', padding: '8px', height: '30px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #999', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #999', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #999', padding: '8px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total y Saldo */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 20px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px', textAlign: 'right' }}>Total</td>
                    <td style={{ padding: '5px 10px', fontSize: '14px', textAlign: 'right' }}>{formatMoney(data.total)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 20px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px', textAlign: 'right' }}>Saldo</td>
                    <td style={{ padding: '5px 10px', fontSize: '14px', textAlign: 'right' }}>{formatMoney(data.saldo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Agradecimiento */}
            <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#555', marginTop: '30px' }}>Gracias por su preferencia.</p>

            {/* Línea de corte con tijera */}
            <div style={{ marginTop: '30px', textAlign: 'center', position: 'relative' }}>
              <div style={{ borderTop: '2px dashed #999', width: '100%', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-5px', top: '-10px', fontSize: '16px' }}>✂</span>
              </div>
            </div>
          </div>
        );

      case 'nota':
        return (
          <div className="print-content font-serif" style={{ fontSize: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Encabezado estilo original */}
            <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '2px solid #8B4513', paddingBottom: '10px', marginBottom: '15px' }}>
              {/* Logo izquierda */}
              <div style={{ width: '100px', marginRight: '15px' }}>
                <img src="/logoo.png" alt="FUNDAMUFA" style={{ width: '90px', height: 'auto' }} />
              </div>
              
              {/* Información central */}
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
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Carrera 50 N.52-89 Avenida Palace Edificio Nutibara Express</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Oficina 722 - Séptimo Piso</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Celular 313 666 74 79</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Medellin - Colombia</p>
              </div>

              {/* Número derecha */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontSize: '11px', margin: '0' }}>No.</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B0000' }}>{getNumeroFormula()}</p>
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', margin: '15px 0', textDecoration: 'underline' }}>
              NOTA / RECORDATORIO
            </h2>

            {/* Datos de la nota */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '8px', width: '33%' }}>
                    <strong>Fecha:</strong> {formatDate(data.fecha)}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', width: '33%' }}>
                    <strong>Hora:</strong> {data.hora}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '8px', width: '34%' }}>
                    <strong>Estado:</strong> {data.estado?.toUpperCase()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Contenido de la nota */}
            <div style={{ border: '1px solid #999', padding: '15px', marginBottom: '15px', minHeight: '200px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                Contenido:
              </p>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.6' }}>
                {data.contenido}
              </div>
            </div>

            {/* Fecha de impresión */}
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#666' }}>
              Impreso el: {formatDate(new Date())}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (tipo) {
      case 'formula': return 'Fórmula Médica';
      case 'historia': return 'Historia Clínica';
      case 'factura': return 'Factura';
      case 'nota': return 'Nota';
      default: return 'Documento';
    }
  };

  const getColor = () => {
    switch (tipo) {
      case 'formula': return 'from-purple-500 to-purple-600';
      case 'historia': return 'from-green-500 to-green-600';
      case 'factura': return 'from-emerald-500 to-emerald-600';
      case 'nota': return 'from-orange-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${soloVista ? 'from-gray-600 to-gray-700' : getColor()} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soloVista ? <Eye size={24} /> : <Printer size={24} />}
              <h2 className="text-xl font-bold">{soloVista ? 'Vista Previa' : 'Imprimir'} - {getTitle()}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div ref={printRef} className="bg-white p-6 border rounded-lg">
            {renderContenido()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            {soloVista ? 'Cerrar' : 'Cancelar'}
          </button>
          {!soloVista && (
            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r ${getColor()} text-white rounded-lg hover:opacity-90 transition-opacity`}
            >
              <Printer size={20} />
              Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .print-content img {
            max-width: 100px !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
