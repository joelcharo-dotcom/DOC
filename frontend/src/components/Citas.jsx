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

  const getCitaPorHora = (hora) => citas.find(c => c.hora === hora);

  const abrirModal = (hora) => {
    const existente = getCitaPorHora(hora);
    if (existente?.estado === 'bloqueada' && !isAdmin) return alert("⛔ Horario bloqueado por el Dr. Jorge");
    if (existente?.estado === 'ocupada' && !isAdmin) return alert("❌ Ya está ocupada");
    setForm({ nombre: existente?.nombre || "", cedula: existente?.cedula || "", celular: existente?.celular || "", motivo: existente?.motivo || "" });
    setModal({ hora, existente });
  };

  const guardarCita = async () => {
    if (!form.nombre || !form.celular) return alert("Nombre y celular obligatorios");
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
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const bloquearHora = async () => {
    if (!isAdmin) return;
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
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const liberarHora = async () => {
    if (!modal.existente) return;
    try {
      await fetch(`/api/citas-publicas/${modal.existente.id}`, { method: 'DELETE' });
      await cargarCitas();
      setModal(null);
    } catch(e) { alert(e.message); }
  };

  const verificarPin = () => {
    if (pin.trim() === PIN_ADMIN) {
      setIsAdmin(true);
      setShowPin(false);
      setPin("");
    } else alert("❌ PIN incorrecto, es 736");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-2">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-5 text-center">
          <h1 className="text-xl font-bold">DR. JORGE CHARRASQUIEL</h1>
          <p className="text-sm">FUNDAMUFA - Agenda Tiempo Real PC + Celular</p>
          <p className="text-[10px] opacity-70 mt-1">Actualiza cada 5 segundos</p>
          {isAdmin && <span className="mt-2 inline-block bg-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-full">MODO ADMIN</span>}
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl">
            <input type="date" value={fechaSel} onChange={e=>setFechaSel(e.target.value)} className="border-2 border-emerald-200 rounded-lg px-3 py-2 font-bold"/>
            {!isAdmin? <button onClick={()=>setShowPin(true)} className="text-xs bg-gray-800 text-white px-5 py-3 rounded-full">🔒 Admin 736</button> : <button onClick={()=>setIsAdmin(false)} className="text-xs bg-red-600 text-white px-4 py-2 rounded-full">Salir</button>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {HORARIOS.map(hora => {
              const cita = getCitaPorHora(hora);
              let estilo = "bg-white border-2 border-emerald-200 text-emerald-900";
              let texto = "Libre";
              let icono = "✅";
              if (cita?.estado === 'ocupada') { estilo = "bg-blue-100 border-2 border-blue-400 text-blue-900"; texto = cita.nombre; icono = "👤"; }
              if (cita?.estado === 'bloqueada') { estilo = "bg-gray-300 border-2 border-gray-500 text-gray-800"; texto = "BLOQUEADA"; icono = "⛔"; }
              return (
                <button key={hora} onClick={()=>abrirModal(hora)} className={`${estilo} rounded-xl p-3 text-left`}>
                  <div className="flex justify-between"><span className="font-black">{hora}</span><span>{icono}</span></div>
                  <div className="text-[11px] truncate mt-1 font-bold">{texto}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="font-black text-lg">🕒 {modal.hora} - {fechaSel}</h3>
            <div className="space-y-2.5 mt-4">
              <input placeholder="Nombre *" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border-2 rounded-lg p-3"/>
              <input placeholder="Celular *" value={form.celular} onChange={e=>setForm({...form, celular:e.target.value})} className="w-full border-2 rounded-lg p-3"/>
              <input placeholder="Cédula" value={form.cedula} onChange={e=>setForm({...form, cedula:e.target.value})} className="w-full border-2 rounded-lg p-3"/>
              <input placeholder="Motivo" value={form.motivo} onChange={e=>setForm({...form, motivo:e.target.value})} className="w-full border-2 rounded-lg p-3"/>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setModal(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Cerrar</button>
              {isAdmin && modal.existente && <button onClick={liberarHora} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold">Liberar</button>}
              {isAdmin && !modal.existente && <button onClick={bloquearHora} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold">Bloquear</button>}
              <button onClick={guardarCita} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
      {showPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="font-bold">🔒 PIN Admin</h3>
            <input type="password" autoFocus value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter' && verificarPin()} className="w-full border-2 rounded-lg p-3 text-center text-lg mt-3"/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setShowPin(false)} className="flex-1 bg-gray-200 py-2.5 rounded-xl font-bold">Cerrar</button>
              <button onClick={verificarPin} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
