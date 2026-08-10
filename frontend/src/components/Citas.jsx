import { useState, useEffect } from 'react';

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

const PIN_ADMIN = "736";

export default function Citas() {
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSel, setFechaSel] = useState(hoy);
  const [citas, setCitas] = useState([]);
  const [modal, setModal] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [form, setForm] = useState({ nombre: "", cedula: "", celular: "", motivo: "" });

  // CARGAR SIEMPRE DE LOCALSTORAGE - 100% SEGURO
  useEffect(() => {
    const guardadas = JSON.parse(localStorage.getItem('citas_FUNDAMUFA_v2') || '[]');
    setCitas(guardadas);
  }, []);

  const guardarEnLocal = (nuevas) => {
    localStorage.setItem('citas_FUNDAMUFA_v2', JSON.stringify(nuevas));
    setCitas(nuevas);
  };

  const citasDelDia = citas.filter(c => c.fecha === fechaSel);
  const getCitaPorHora = (hora) => citasDelDia.find(c => c.hora === hora);

  const abrirModal = (hora) => {
    const existente = getCitaPorHora(hora);
    if (existente?.estado === 'bloqueada' && !isAdmin) return alert("⛔ Horario bloqueado por el Dr. Jorge (almuerzo/charla)");
    if (existente?.estado === 'ocupada' && !isAdmin) return alert("❌ Ya está ocupada esta hora");
    setForm({ nombre: existente?.nombre || "", cedula: existente?.cedula || "", celular: existente?.celular || "", motivo: existente?.motivo || "" });
    setModal({ hora, existente });
  };

  const guardarCita = () => {
    if (!form.nombre || !form.celular) return alert("Nombre y celular obligatorios");
    const payload = {
      id: modal.existente?.id || Date.now().toString(),
      fecha: fechaSel,
      hora: modal.hora,
      nombre: form.nombre,
      cedula: form.cedula,
      celular: form.celular,
      motivo: form.motivo,
      estado: "ocupada"
    };
    const otras = citas.filter(c => !(c.fecha === fechaSel && c.hora === modal.hora));
    guardarEnLocal([...otras, payload]);
    alert(`✅ Cita agendada ${modal.hora} - ${form.nombre}`);
    setModal(null);
  };

  const bloquearHora = () => {
    if (!isAdmin) return alert("Solo admin puede bloquear");
    const payload = {
      id: Date.now().toString(),
      fecha: fechaSel,
      hora: modal.hora,
      nombre: "BLOQUEADO - ALMUERZO/CHARLA",
      estado: "bloqueada"
    };
    const otras = citas.filter(c => !(c.fecha === fechaSel && c.hora === modal.hora));
    guardarEnLocal([...otras, payload]);
    alert(`⛔ Hora ${modal.hora} BLOQUEADA correctamente`);
    setModal(null);
  };

  const liberarHora = () => {
    if (!modal.existente) return;
    const nuevas = citas.filter(c => c.id !== modal.existente.id);
    guardarEnLocal(nuevas);
    alert(`✅ Hora ${modal.hora} liberada`);
    setModal(null);
  };

  const verificarPin = () => {
    if (pin === PIN_ADMIN) { 
      setIsAdmin(true); 
      setShowPin(false); 
      setPin(""); 
      alert("✅ MODO ADMIN ACTIVADO\nAhora puede tocar cualquier hora y darle a BLOQUEAR"); 
    }
    else alert("❌ PIN incorrecto, es 736");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-2">
        
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-5 text-center">
          <h1 className="text-xl font-bold">🩺 DR. JORGE CHARRASQUIEL</h1>
          <p className="opacity-90 text-xs mt-1">FUNDAMUFA - Agenda de Citas</p>
          <p className="text-[10px] opacity-70 mt-1">Bloquee almuerzos y charlas por horas</p>
          {isAdmin && <span className="mt-2 inline-block bg-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">🔓 ADMIN ACTIVO - PUEDE BLOQUEAR</span>}
        </div>

        <div className="p-4 space-y-4">
          
          <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">📅 Fecha que quiere bloquear</label>
              <input type="date" value={fechaSel} onChange={e=>setFechaSel(e.target.value)} className="border-2 border-emerald-300 rounded-lg px-3 py-2 font-bold text-sm"/>
            </div>
            {!isAdmin ? (
              <button onClick={()=>setShowPin(true)} className="text-xs bg-gray-800 text-white px-5 py-3 rounded-full font-bold shadow">🔒 Admin PIN 736</button>
            ) : (
              <button onClick={()=>setIsAdmin(false)} className="text-xs bg-red-600 text-white px-4 py-2 rounded-full">Salir</button>
            )}
          </div>

          {isAdmin && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-yellow-800">👇 TOQUE LAS HORAS DE ALMUERZO O CHARLA Y DELE BLOQUEAR 👇</p>
              <p className="text-[10px] text-yellow-700 mt-1">Ej: 12:00, 12:30, 13:00, 13:30</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {HORARIOS.map(hora => {
              const cita = getCitaPorHora(hora);
              let estilo = "bg-white border-2 border-emerald-300 text-emerald-900 shadow-sm";
              let texto = "Libre - Toque para agendar";
              let icono = "✅";
              if (cita?.estado === 'ocupada') { estilo = "bg-blue-100 border-2 border-blue-400 text-blue-900"; texto = cita.nombre; icono = "👤"; }
              if (cita?.estado === 'bloqueada') { estilo = "bg-gray-300 border-2 border-gray-500 text-gray-800"; texto = "BLOQUEADA Almuerzo/Charla"; icono = "⛔"; }
              
              return (
                <button key={hora} onClick={()=>abrirModal(hora)} className={`${estilo} rounded-xl p-3 text-left active:scale-95 transition`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-[15px]">{hora}</span><span className="text-lg">{icono}</span>
                  </div>
                  <div className="text-[11px] truncate mt-1 font-bold leading-tight">{texto}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-gray-100 rounded-lg p-3 text-[11px] text-gray-600">
            <p className="font-bold mb-1">Instrucciones para el Dr. Jorge:</p>
            <p>1. Ponga PIN 736 → 2. Elija fecha arriba → 3. Toque hora del almuerzo (ej 12:00) → 4. Botón ⛔ Bloquear esta hora → Queda gris bloqueada</p>
            <p className="mt-2 text-[10px] text-gray-500">Esto se guarda en su celular/computador. Si cambia de dispositivo, debe bloquear de nuevo en ese dispositivo.</p>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-black text-lg mb-1">🕒 {modal.hora} - {fechaSel}</h3>
            {modal.existente && <p className="text-xs text-gray-500 mb-4">Estado actual: {modal.existente.estado} {modal.existente.nombre && `- ${modal.existente.nombre}`}</p>}
            
            {!modal.existente || modal.existente.estado === 'ocupada' ? (
              <>
                <div className="space-y-2.5 mt-3">
                  <input placeholder="Nombre completo paciente *" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm font-medium"/>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Cédula" value={form.cedula} onChange={e=>setForm({...form, cedula:e.target.value})} className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm"/>
                    <input placeholder="Celular *" value={form.celular} onChange={e=>setForm({...form, celular:e.target.value})} className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm"/>
                  </div>
                  <input placeholder="Motivo" value={form.motivo} onChange={e=>setForm({...form, motivo:e.target.value})} className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-sm"/>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={()=>setModal(null)} className="flex-1 bg-gray-200 py-3.5 rounded-xl font-bold text-sm">Cerrar</button>
                  {isAdmin && <button onClick={bloquearHora} className="flex-1 bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm">⛔ Bloquear esta hora</button>}
                  <button onClick={guardarCita} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm">💾 Agendar</button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-100 rounded-xl p-4 text-center my-4">
                  <p className="text-3xl">⛔</p>
                  <p className="font-bold mt-2">Hora bloqueada</p>
                  <p className="text-xs text-gray-600">{modal.hora} está bloqueada para almuerzo/charla</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setModal(null)} className="flex-1 bg-gray-200 py-3.5 rounded-xl font-bold text-sm">Cerrar</button>
                  {isAdmin && <button onClick={liberarHora} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm">🔓 Desbloquear / Liberar</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="font-black mb-1">🔒 PIN Admin</h3>
            <p className="text-xs text-gray-500 mb-3">Para bloquear horas</p>
            <input type="password" autoFocus value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&verificarPin()} placeholder="736" className="w-full border-2 border-emerald-400 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-black mb-4"/>
            <div className="flex gap-2">
              <button onClick={()=>setShowPin(false)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Cerrar</button>
              <button onClick={verificarPin} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold">Entrar 736</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
