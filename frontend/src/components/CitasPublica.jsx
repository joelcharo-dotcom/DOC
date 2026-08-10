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

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('citas_FUNDAMUFA_v2') || '[]');
    setCitas(local);
    fetch('/api/citas?fecha=' + fechaSel).then(r=>r.json()).then(data=>{
      if(Array.isArray(data) && data.length>0) setCitas(prev=>[...prev, ...data.filter(d=>!prev.find(p=>p.fecha===d.fecha && p.hora===d.hora))]);
    }).catch(()=>{});
  }, [fechaSel]);

  const getCita = (hora) => citas.find(c=>c.fecha===fechaSel && c.hora===hora);
  
  const agendar = () => {
    if(!form.nombre || !form.celular) return alert("Nombre y celular obligatorios");
    const nueva = {
      id: Date.now().toString(),
      fecha: fechaSel,
      hora: selectedHora,
      nombre: form.nombre,
      celular: form.celular,
      motivo: form.motivo,
      estado: "ocupada",
      origen: "paciente_web"
    };
    const actuales = JSON.parse(localStorage.getItem('citas_FUNDAMUFA_v2') || '[]');
    const filtradas = actuales.filter(c=>!(c.fecha===fechaSel && c.hora===selectedHora));
    localStorage.setItem('citas_FUNDAMUFA_v2', JSON.stringify([...filtradas, nueva]));
    setCitas([...filtradas, nueva]);
    fetch('/api/citas', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(nueva)}).catch(()=>{});
    setEnviado(true);
  };

  if(enviado){
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-emerald-800">¡Cita Agendada!</h2>
          <p className="mt-3 text-gray-700">Dr. Jorge Charrasquiel<br/><b>FUNDAMUFA - MEDICO ALTERNATIVO</b></p>
          <div className="bg-emerald-50 rounded-xl p-4 mt-5">
            <p className="text-sm text-gray-600">Fecha</p><p className="font-black text-lg">{fechaSel}</p>
            <p className="text-sm text-gray-600 mt-2">Hora</p><p className="font-black text-lg">{selectedHora}</p>
            <p className="text-sm text-gray-600 mt-2">Paciente</p><p className="font-bold">{form.nombre}</p>
          </div>
          <p className="text-xs text-gray-500 mt-5">Llegue 10 min antes. Si no puede asistir, avise por WhatsApp.</p>
          <button onClick={()=>{setEnviado(false); setSelectedHora(null); setForm({nombre:"",celular:"",motivo:""})}} className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Agendar otra cita</button>
          <a href="/" className="block mt-3 text-sm text-gray-500">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-3">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-3 border border-emerald-100">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-6 text-center">
            <h1 className="text-2xl font-black">🩺 Dr. Jorge Charrasquiel</h1>
            <p className="opacity-90 text-sm mt-1">FUNDAMUFA - MEDICO ALTERNATIVO</p>
            <p className="text-xs opacity-80 mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">Agenda tu cita en línea</p>
          </div>
          <div className="p-5">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1️⃣ Elige el día</label>
            <input type="date" min={hoy} value={fechaSel} onChange={e=>setFechaSel(e.target.value)} className="w-full border-2 border-emerald-300 rounded-xl px-4 py-3 font-bold text-base"/>

            <label className="block text-xs font-bold text-gray-500 uppercase mt-6 mb-3">2️⃣ Elige la hora</label>
            <div className="grid grid-cols-3 gap-2.5">
              {HORARIOS.map(h=>{
                const cita = getCita(h);
                const ocupada = cita?.estado === 'ocupada';
                const bloqueada = cita?.estado === 'bloqueada';
                const esLibre = !cita;
                
                return (
                  <button key={h} disabled={ocupada || bloqueada} onClick={()=>esLibre && setSelectedHora(h)}
                    className={`rounded-xl p-3 text-center font-black text-sm border-2 transition active:scale-95
                    ${ocupada ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed' : ''}
                    ${bloqueada ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' : ''}
                    ${esLibre && selectedHora===h ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg scale-105' : ''}
                    ${esLibre && selectedHora!==h ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm hover:bg-emerald-50' : ''}
                    `}>
                    {h}
                    <div className="text-[9px] font-normal mt-1">
                      {ocupada ? 'Ocupada' : bloqueada ? 'No disponible' : selectedHora===h ? 'Seleccionada' : 'Libre'}
                    </div>
                    {bloqueada && <div className="text-[7px]">⛔</div>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 mt-4 text-[10px] text-gray-600 justify-center flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border-2 border-emerald-300 rounded"></span> Libre</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded"></span> Ocupada</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-50 border border-red-200 rounded"></span> No disponible</span>
            </div>

            {selectedHora && (
              <div className="mt-6 bg-gray-50 rounded-2xl p-5 border-2 border-emerald-200 animate-in">
                <h3 className="font-black text-base mb-1">3️⃣ Tus datos para {selectedHora} del {fechaSel}</h3>
                <div className="space-y-3 mt-4">
                  <input placeholder="Nombre completo *" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-sm"/>
                  <input placeholder="Celular / WhatsApp *" value={form.celular} onChange={e=>setForm({...form, celular:e.target.value})} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-sm"/>
                  <input placeholder="Motivo de consulta (opcional)" value={form.motivo} onChange={e=>setForm({...form, motivo:e.target.value})} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-sm"/>
                </div>
                <button onClick={agendar} className="w-full mt-5 bg-emerald-600 text-white py-4 rounded-xl font-black text-base shadow-lg">✅ Confirmar cita {selectedHora}</button>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-4">📍 FUNDAMUFA - Dr. Jorge Charrasquiel - MEDICO ALTERNATIVO<br/>Horario almuerzo no disponible</p>
      </div>
    </div>
  );
}

