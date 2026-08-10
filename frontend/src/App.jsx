import { useState, useEffect } from 'react';

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

const PIN_ADMIN = "736";
const WHATSAPP_DR = "573136667479";

export default function Citas() {
  const [fechaSel, setFechaSel] = useState(new Date().toISOString().split('T')[0]);
  const [citas, setCitas] = useState([]);
  const [modal, setModal] = useState(null); // {hora}
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [form, setForm] = useState({ nombre: "", cedula: "", celular: "", motivo: "" });

  // Cargar citas
  useEffect(() => { cargarCitas(); }, [fechaSel]);
  
  const cargarCitas = async () => {
    try {
      const res = await fetch('/api/citas');
      if (res.ok) setCitas(await res.json());
    } catch (e) { console.log("API no lista aún, usando local"); }
  };

  const citasDelDia = citas.filter(c => {
    const f = new Date(c.fecha).toISOString().split('T')[0];
    return f === fechaSel;
  });

  const getCitaPorHora = (hora) => citasDelDia.find(c => c.hora === hora);

  const abrirModal = (hora) => {
    const existente = getCitaPorHora(hora);
    if (existente?.estado === 'bloqueada' && !isAdmin) return alert("⛔ Horario bloqueado por el Dr. Jorge");
    if (existente?.estado === 'ocupada' && !isAdmin) return alert("❌ Ya está ocupada");
    setForm({ nombre: existente?.nombre || "", cedula: existente?.cedula || "", celular: existente?.celular || "", motivo: existente?.motivo || "" });
    setModal({ hora, existente });
  };

  const guardarCita = async () => {
    if (!form.nombre || !form.celular) return alert("Nombre y celular obligatorios");
    
    const payload = {
      fecha: fechaSel,
      hora: modal.hora,
      nombre: form.nombre,
      cedula: form.cedula,
      celular: form.celular,
      motivo: form.motivo,
      estado: "ocupada"
    };

    try {
      await fetch('/api/citas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      await cargarCitas();
    } catch (e) {
      setCitas([...citas, { ...payload, id: Date.now(), fecha: new Date(fechaSel) }]);
    }

    const mensaje = `🏥 *CITA AGENDADA - FUNDAMUFA*%0A%0A📅 Fecha: ${fechaSel}%0A🕒 Hora: ${modal.hora}%0A👤 Paciente: ${form.nombre}%0A🪪 Cédula: ${form.cedula}%0A📞 Cel: ${form.celular}%0A📝 Motivo: ${form.motivo}`;
    window.open(`https://wa.me/${WHATSAPP_DR}?text=${mensaje}`, '_blank');
    setModal(null);
  };

  const bloquearHora = async () => {
    if (!isAdmin) return;
    const payload = { fecha: fechaSel, hora: modal.hora, nombre: "BLOQUEADO", celular: "-", estado: "bloqueada" };
    try {
      await fetch('/api/citas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      await cargarCitas();
    } catch { setCitas([...citas, { ...payload, id: Date.now(), fecha: new Date(fechaSel) }]); }
    setModal(null);
  };

  const liberarHora = async () => {
    if (!modal.existente) return;
    try {
      await fetch(`/api/citas?id=${modal.existente.id}`, { method: 'DELETE' });
      await cargarCitas();
    } catch { setCitas(citas.filter(c => c.id !== modal.existente.id)); }
    setModal(null);
  };

  const verificarPin = () => {
    if (pin === PIN_ADMIN) { setIsAdmin(true); setShowPin(false); setPin(""); alert("✅ Modo Admin activado"); }
    else alert("❌ PIN incorrecto");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">🩺 DR. JORGE CHARRASQUIEL</h1>
          <p className="opacity-90 text-sm mt-1">FUNDAMUFA - Agenda de Citas</p>
          {isAdmin && <span className="mt-2 inline-block bg-white text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">MODO ADMIN ACTIVO</span>}
        </div>

        <div className="p-6 space-y-5">
          
          {/* CONTROLES */}
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">📅 Fecha</label>
              <input type="date" value={fechaSel} onChange={e=>setFechaSel(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 font-bold"/>
            </div>
            {!isAdmin ? (
              <button onClick={()=>setShowPin(true)} className="text-xs bg-gray-800 text-white px-4 py-2 rounded-full">🔒 Admin</button>
            ) : (
              <button onClick={()=>setIsAdmin(false)} className="text-xs bg-red-600 text-white px-4 py-2 rounded-full">Salir Admin</button>
            )}
          </div>

          {/* HORARIOS */}
          <div className="grid grid-cols-2 gap-3">
            {HORARIOS.map(hora => {
              const cita = getCitaPorHora(hora);
              let estilo = "bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-800";
              let texto = "Disponible";
              let icono = "✅";
              if (cita?.estado === 'ocupada') { estilo = "bg-red-50 border-2 border-red-300 text-red-800"; texto = cita.nombre; icono = "👤"; }
              if (cita?.estado === 'bloqueada') { estilo = "bg-gray-200 border-2 border-gray-400 text-gray-600"; texto = "Bloqueada"; icono = "⛔"; }
              
              return (
                <button key={hora} onClick={()=>abrirModal(hora)} className={`${estilo} rounded-xl p-3 text-left transition`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base">{hora}</span><span>{icono}</span>
                  </div>
                  <div className="text-xs truncate mt-1 font-medium">{texto}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 text-center">
            Toque una hora para agendar. Si es admin (PIN 736) puede bloquear o liberar horarios.
          </div>
        </div>
      </div>

      {/* MODAL AGENDAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">🕒 Cita {modal.hora} - {fechaSel}</h3>
            
            {modal.existente?.estado === 'ocupada' && isAdmin && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
                <p><b>Paciente:</b> {modal.existente.nombre}</p>
                <p><b>Cel:</b> {modal.existente.celular}</p>
                <p><b>Motivo:</b> {modal.existente.motivo}</p>
              </div>
            )}

            <div className="space-y-3">
              <input placeholder="Nombre completo *" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm"/>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Cédula" value={form.cedula} onChange={e=>setForm({...form, cedula:e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm"/>
                <input placeholder="Celular *" value={form.celular} onChange={e=>setForm({...form, celular:e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm"/>
              </div>
              <input placeholder="Motivo consulta" value={form.motivo} onChange={e=>setForm({...form, motivo:e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm"/>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm">Cancelar</button>
              {isAdmin && modal.existente ? (
                <button onClick={liberarHora} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm">🗑 Liberar</button>
              ) : isAdmin ? (
                <button onClick={bloquearHora} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold text-sm">⛔ Bloquear</button>
              ) : null}
              <button onClick={guardarCita} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm">💾 Guardar y WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN */}
      {showPin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="font-bold mb-3">🔒 PIN Admin</h3>
            <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="736" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest mb-3"/>
            <div className="flex gap-2">
              <button onClick={()=>setShowPin(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold">Cerrar</button>
              <button onClick={verificarPin} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
