import { useState, useEffect } from 'react';

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

export default function CitasPublica() {
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSel, setFechaSel] = useState(hoy);
  const [citas, setCitas] = useState([]);
  const [selectedHora, setSelectedHora] = useState(null);
  const [form, setForm] = useState({ nombre: "", celular: "", motivo: "" });
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

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

  const getCita = (hora) => citas.find(c=>c.fecha===fechaSel && c.hora===hora);

  const agendar = async () => {
    if(!form.nombre ||!form.celular) return alert("Nombre y celular obligatorios");
    setCargando(true);
    try {
      const res = await fetch('/api/citas-publicas', {
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          fecha: fechaSel,
          hora: selectedHora,
          nombre: form.nombre,
          celular: form.celular,
          motivo: form.motivo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setEnviado(true);
      cargarCitas();
    } catch(e) {
      alert(e.message);
    } finally {
      setCargando(false);
    }
  };

  if(enviado){
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-emerald-800">¡Cita Agendada!</h2>
          <p className="mt-3 text-gray-700"><b>Dr. Jorge Charrasquiel<br/>FUNDAMUFA - MEDICO ALTERNATIVO</b></p>
          <div className="bg-emerald-50 rounded-xl p-4 mt-5">
            <p className="text-sm text-gray-600">Fecha</p><p className="font-black text-lg">{fechaSel}</p>
            <p className="text-sm text-gray-600 mt-2">Hora</p><p className="font-black text-lg">{selectedHora}</p>
            <p className="text-sm text-gray-600 mt-2">Paciente</p><p className="font-bold">{form.nombre}</p>
          </div>
          <button onClick={()=>{setEnviado(false); setSelectedHora(null); setForm({nombre:"",celular:"",motivo:""})}} className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-bold">Agendar otra</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-3">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-3 border border-emerald-100">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-6 text-center">
            <h1 className="text-2xl font-black">Dr. Jorge Charrasquiel</h1>
            <p className="opacity-90 text-sm mt-1">FUNDAMUFA - MEDICO ALTERNATIVO</p>
            <p className="text-xs opacity-80 mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">Sincronizado PC y Celular cada 5s</p>
          </div>
          <div className="p-5">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📅 Elige el día</label>
            <input type="date" min={hoy} value={fechaSel} onChange={(e)=>setFechaSel(e.target.value)} className="w-full border-2 border-emerald-200 rounded-xl p-3 font-bold"/>
            <label className="block text-xs font-bold text-gray-500 uppercase mt-6 mb-3">⏰ Elige la hora</label>
            <div className="grid grid-cols-3 gap-2.5">
              {HORARIOS.map(h=>{
                const cita = getCita(h);
                const ocupada = cita?.estado === 'ocupada' || cita?.estado === 'bloqueada';
                return (
                  <button key={h} disabled={ocupada} onClick={()=>!ocupada && setSelectedHora(h)}
                    className={`rounded-xl p-3 text-center font-black text-sm border-2 transition
                    ${ocupada? 'bg-gray-200 border-gray-300 text-gray-500' : ''}
                    ${!ocupada && selectedHora===h? 'bg-emerald-600 border-emerald-700 text-white shadow-lg scale-105' : ''}
                    ${!ocupada && selectedHora!==h? 'bg-white border-emerald-300 text-emerald-800' : ''}`}>
                    {h}
                    <div className="text-[9px] font-normal mt-1">{ocupada? 'Ocupada' : selectedHora===h? 'Seleccionada' : 'Libre'}</div>
                  </button>
                );
              })}
            </div>
            {selectedHora && (
              <div className="mt-6 bg-gray-50 rounded-2xl p-5 border-2 border-emerald-200">
                <h3 className="font-black text-base">📝 Tus datos para {selectedHora}</h3>
                <div className="space-y-3 mt-4">
                  <input placeholder="Nombre completo *" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} className="w-full border rounded-xl p-3"/>
                  <input placeholder="Celular / WhatsApp *" value={form.celular} onChange={(e)=>setForm({...form, celular:e.target.value})} className="w-full border rounded-xl p-3"/>
                  <input placeholder="Motivo (opcional)" value={form.motivo} onChange={(e)=>setForm({...form, motivo:e.target.value})} className="w-full border rounded-xl p-3"/>
                </div>
                <button onClick={agendar} disabled={cargando} className="w-full mt-5 bg-emerald-600 text-white py-4 rounded-xl font-black">
                  {cargando? 'Guardando...' : `Confirmar ${selectedHora}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
