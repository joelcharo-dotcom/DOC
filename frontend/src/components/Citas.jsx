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

  const cargarCitas = async () => {
    try {
      const r = await fetch(`/api/citas-publicas?fecha=${fechaSel}`);
      const data = await r.json();
      if (Array.isArray(data)) setCitas(data);
    } catch {}
  };

  useEffect(() => {
    cargarCitas();
    const intervalo = setInterval(cargarCitas, 5000);
    return () => clearInterval(intervalo);
  }, [fechaSel]);

  const citasDelDia = citas;
  const getCitaPorHora = (hora) => citasDelDia.find(c => c.hora === hora);

  const abrirModal = (hora) => {
    const existente = getCitaPorHora(hora);
    if (existente?.estado === 'bloqueada' &&!isAdmin) return alert("⛔ Horario bloqueado por el Dr. Jorge (almuerzo/charla)");
    if (existente?.estado === 'ocupada' &&!isAdmin) return alert("❌ Ya está ocupada esta hora");
    setForm({ nombre: existente?.nombre || "", cedula: existente?.cedula || "", celular: existente?.celular || "", motivo: existente?.motivo || "" });
    setModal({ hora, existente });
  };

  const guardarCita = async () => {
    if (!form.nombre ||!form.celular) return alert("Nombre y celular obligatorios");
    try {
      if (modal.existente) {
        await fetch(`/api/citas-publicas/${modal.existente.id}`, { method: 'DELETE' });
      }
      const res = await fetch('/api/citas-publicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaSel,
          hora: modal.hora,
          nombre: form.nombre,
          cedula: form.cedula,
          celular: form.celular,
          motivo: form.motivo,
          estado: "ocupada"
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await cargarCitas();
      alert(`✅ Cita agendada ${modal.hora} - ${form.nombre}`);
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const bloquearHora = async () => {
    if (!isAdmin) return alert("Solo admin puede bloquear");
    try {
      if (modal.existente) await fetch(`/api/citas-publicas/${modal.existente.id}`, { method: 'DELETE' });
      await fetch('/api/citas-publicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaSel,
          hora: modal.hora,
          nombre: "BLOQUEADO - ALMUERZO/CHARLA",
          celular: "-",
          estado: "bloqueada"
        })
      });
      await cargarCitas();
      alert(`⛔ Hora ${modal.hora} BLOQUEADA correctamente`);
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const liberarHora = async () => {
    if (!modal.existente) return;
    try {
      await fetch(`/api/citas-publicas/${modal.existente.id}`, { method: 'DELETE' });
      await cargarCitas();
      alert(`✅ Hora ${modal.hora} liberada`);
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const verificarPin = () => {
    if (pin.trim() === PIN_ADMIN) {
      setIsAdmin(true);
      setShowPin(false);
      setPin("");
      alert("✅ MODO ADMIN ACTIVADO - Ahora puede bloquear horas");
    } else alert("❌ PIN incorrecto, es 736");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-2">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-5 text-center">
          <h1 className="text-xl font-bold">DR. JORGE CHARRASQUIEL</h1>
          <p className="opacity-90 text-sm mt-1">FUNDAMUFA - Agenda en Tiempo Real</p>
          <p className="text- opacity-70 mt-1">Se actualiza cada 5s - PC y celular sincronizados</p>
          {isAdmin && <span className="mt-2 inline-block bg-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-full">MODO ADMIN</span>}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl">
            <div>
              <label className="block text- font-bold text-gray-500 uppercase mb-1">📅 Fecha</label>
              <input type="date" value={fechaSel} onChange={(e)=>setFechaSel(e.target.value)} className="border-2 border-emerald-200 rounded-lg px-3 py-2 font-bold"/>
            </div>
            {!isAdmin? (
              <button onClick={()=>setShowPin(true)} className="text-xs bg-gray-800 text-white px-5 py-3 rounded-full">🔒 Admin 736</button>
            ) : (
              <button onClick={()=>setIsAdmin(false)} className="text-xs bg-red-600 text-white px-4 py-2 rounded-full">Salir Admin</button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {HORARIOS.map(hora => {
              const cita = getCitaPorHora(hora);
              let estilo = "bg-white border-2 border-emerald-200 text-emerald-900 shadow-sm";
              let texto = "Libre - Toque para agendar";
              let icono = "✅";
              if (cita?.estado === 'ocupada') { estilo = "bg-blue-100 border-2 border-blue-400 text-blue-900"; texto = cita.nombre; icono = "👤"; }
              if (cita?.estado === 'bloqueada') { estilo = "bg-gray-300 border-2 border-gray-500 text-gray-800"; texto = "BLOQUEADA"; icono = "⛔"; }
              return (
                <button key={hora} onClick={()=>abrirModal(hora)} className={`${estilo} rounded-xl p-3 text-left active:scale-95 transition`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-">{hora}</span><span className="text-lg">{icono}</span>
                  </div>
                  <div className="text- truncate mt-1 font-bold leading-tight">{texto}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-gray-100 rounded-lg p-3 text- text-gray-600">
            <p className="font-bold mb-1">Instrucciones:</p>
            <p>1. Ponga PIN 736 - 2. Elija fecha - 3. Toque hora - 4. Bloquee almuerzos. ¡Se guarda en la nube y se ve en celular al instante!</p>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-black text-lg mb-1">🕒 {modal.hora} - {fechaSel}</h3>
            {modal.existente && <p className="text-xs text-gray-500 mb-4">Estado actual: {modal.existente.estado} {modal.existente.nombre && `- ${modal.existente.nombre}`}</p>}
            {(!modal.existente || modal.existente.estado === 'ocupada') && (
              <>
                <div className="space-y-2.5 mt-3">
                  <input placeholder="Nombre completo paciente *" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm"/>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Cédula" value={form.cedula} onChange={(e)=>setForm({...form, cedula:e.target.value})} className="w-full border-2 rounded-lg px-3 py-2.5 text-sm"/>
                    <input placeholder="Celular *" value={form.celular} onChange={(e)=>setForm({...form, celular:e.target.value})} className="w-full border-2 rounded-lg px-3 py-2.5 text-sm"/>
                  </div>
                  <input placeholder="Motivo" value={form.motivo} onChange={(e)=>setForm({...form, motivo:e.target.value})} className="w-full border-2 rounded-lg px-3 py-2.5 text-sm"/>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={()=>setModal(null)} className="flex-1 bg-gray-200 py-3.5 rounded-xl font-bold text-sm">Cerrar</button>
                  {isAdmin && <button onClick={bloquearHora} className="flex-1 bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm">⛔ Bloquear</button>}
                  <button onClick={guardarCita} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm">💾 Guardar</button>
                </div>
              </>
            )}
            {modal.existente?.estado === 'bloqueada' && (
              <div className="bg-gray-100 rounded-xl p-4 text-center my-4">
                <p className="text-3xl">⛔</p>
                <p className="font-bold mt-2 text-sm">Hora bloqueada</p>
                <p className="text-xs text-gray-600">{modal.hora} está bloqueada para almuerzo/charla</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>setModal(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Cerrar</button>
                  {isAdmin && <button onClick={liberarHora} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">✅ Liberar</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="font-bold mb-1">🔒 PIN Admin</h3>
            <p className="text-xs text-gray-500 mb-3">Para bloquear horas</p>
            <input type="password" autoFocus value={pin} onChange={(e)=>setPin(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && verificarPin()} placeholder="736" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest mb-3"/>
            <div className="flex gap-2">
              <button onClick={()=>{setShowPin(false); setPin("");}} className="flex-1 bg-gray-200 py-2.5 rounded-xl font-bold">Cerrar</button>
              <button onClick={verificarPin} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl font-bold">Entrar 736</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
