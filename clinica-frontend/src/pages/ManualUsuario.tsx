import { useMemo, useState } from 'react';

type ManualSection = {
  id: string;
  titulo: string;
  descripcion: string;
  modulo: string;
  pasos: string[];
  notas?: string[];
};

const Icons = {
  Book: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      <path d="M8 6h8" />
      <path d="M8 10h7" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="m20 6-11 11-5-5" />
    </svg>
  ),
  Print: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  ),
};

const resumenes = [
  {
    titulo: 'Usuarios principales',
    valor: 'Admin, Psicologo, Recepcion',
    descripcion: 'El sistema organiza el acceso segun funciones operativas y clinicas.',
    icono: <Icons.Users />,
  },
  {
    titulo: 'Flujo clinico',
    valor: 'Paciente, cita, sesion',
    descripcion: 'El expediente se alimenta desde citas, sesiones y pruebas aplicadas.',
    icono: <Icons.Calendar />,
  },
  {
    titulo: 'Seguridad operativa',
    valor: 'Auditoria y backups',
    descripcion: 'Se registran acciones relevantes y se pueden generar copias de base de datos.',
    icono: <Icons.Shield />,
  },
];

const secciones: ManualSection[] = [
  {
    id: 'acceso',
    titulo: 'Acceso al sistema',
    modulo: 'Inicio de sesion',
    descripcion: 'Permite ingresar al sistema mediante credenciales de usuario.',
    pasos: [
      'Abrir el enlace del sistema desde el navegador.',
      'Ingresar el correo electronico asignado al usuario.',
      'Ingresar la contrasena correspondiente.',
      'Presionar el boton Iniciar sesion.',
      'Si el sistema solicita cambio de contrasena temporal, completar el proceso antes de continuar.',
    ],
    notas: [
      'No se deben compartir credenciales entre usuarios.',
      'Si la sesion expira, el sistema puede redirigir nuevamente al inicio de sesion.',
    ],
  },
  {
    id: 'dashboard',
    titulo: 'Dashboard principal',
    modulo: 'Dashboard',
    descripcion: 'Muestra indicadores generales sobre pacientes, citas, sesiones, facturacion y actividad reciente.',
    pasos: [
      'Ingresar al sistema con un usuario autorizado.',
      'Revisar los indicadores superiores para conocer el estado general de la clinica.',
      'Consultar los resumenes de citas, pacientes e ingresos.',
      'Usar esta pantalla como punto de partida para revisar actividad operativa.',
    ],
    notas: [
      'Los datos dependen de la informacion registrada en los modulos del sistema.',
    ],
  },
  {
    id: 'pacientes',
    titulo: 'Gestion de pacientes',
    modulo: 'Pacientes',
    descripcion: 'Permite registrar, consultar, editar y administrar pacientes adultos o menores de edad.',
    pasos: [
      'Entrar al modulo Pacientes.',
      'Presionar Nuevo paciente.',
      'Completar los datos personales requeridos.',
      'Indicar si el paciente es adulto o menor de edad.',
      'Si es menor, asociar un tutor existente o registrar uno nuevo.',
      'Guardar el registro.',
      'Usar el detalle del paciente para consultar expediente, citas, sesiones y tests.',
    ],
    notas: [
      'Verificar cedula, telefono y datos de contacto antes de guardar.',
      'La informacion del paciente alimenta citas, sesiones, facturacion y expediente.',
    ],
  },
  {
    id: 'tutores',
    titulo: 'Gestion de tutores',
    modulo: 'Tutores',
    descripcion: 'Administra la informacion de tutores o responsables de pacientes menores de edad.',
    pasos: [
      'Ingresar al modulo Tutores.',
      'Registrar los datos personales y de contacto del tutor.',
      'Completar la direccion y datos complementarios.',
      'Guardar la informacion.',
      'Asociar el tutor con el paciente menor cuando corresponda.',
    ],
    notas: [
      'Este modulo es importante para el control de pacientes menores.',
    ],
  },
  {
    id: 'psicologos',
    titulo: 'Gestion de psicologos',
    modulo: 'Psicologos',
    descripcion: 'Permite administrar psicologos, especialidades, datos profesionales, usuarios y roles.',
    pasos: [
      'Entrar al modulo Psicologos.',
      'Presionar Nuevo psicologo.',
      'Completar datos personales, profesionales y de contacto.',
      'Seleccionar especialidades cuando aplique.',
      'Guardar el registro.',
      'Si se crea usuario, conservar las credenciales temporales para entregarlas al psicologo.',
      'Asignar roles segun las funciones que tendra dentro del sistema.',
    ],
    notas: [
      'El rol Psicologo debe asignarse a usuarios vinculados con un registro de psicologo.',
      'Las credenciales temporales deben cambiarse al primer ingreso.',
    ],
  },
  {
    id: 'citas',
    titulo: 'Gestion de citas',
    modulo: 'Citas',
    descripcion: 'Permite programar, cancelar, filtrar e iniciar citas psicologicas.',
    pasos: [
      'Entrar al modulo Citas.',
      'Presionar Nueva cita.',
      'Seleccionar paciente, psicologo, tipo de cita, fecha y hora.',
      'Registrar datos de pago si corresponde.',
      'Guardar la cita.',
      'Para cancelar, seleccionar la cita y registrar el motivo de cancelacion.',
      'Para iniciar una sesion, presionar Iniciar sesion desde la cita correspondiente.',
    ],
    notas: [
      'El sistema puede advertir cuando se intenta iniciar una sesion antes de la hora programada.',
      'Los horarios ocupados se validan segun psicologo y fecha.',
    ],
  },
  {
    id: 'sesiones',
    titulo: 'Registro de sesiones clinicas',
    modulo: 'Sesiones',
    descripcion: 'Registra la informacion clinica generada durante la atencion psicologica.',
    pasos: [
      'Iniciar la sesion desde una cita programada.',
      'Completar motivo, observaciones, evolucion, intervenciones y recomendaciones.',
      'Registrar informacion diagnostica si aplica.',
      'Asignar seguimiento o proxima cita cuando corresponda.',
      'Finalizar la sesion para guardar el registro clinico.',
    ],
    notas: [
      'La hora final se guarda usando la hora exacta del sistema al momento de finalizar.',
      'La informacion registrada pasa a formar parte del historial clinico del paciente.',
    ],
  },
  {
    id: 'historial',
    titulo: 'Historial y expediente clinico',
    modulo: 'Historial',
    descripcion: 'Centraliza eventos clinicos, sesiones y detalles asociados al paciente.',
    pasos: [
      'Abrir el detalle del paciente o ingresar al modulo Historial.',
      'Consultar sesiones realizadas y datos asociados.',
      'Revisar observaciones, diagnosticos, recomendaciones y seguimiento.',
      'Descargar expediente si la opcion esta disponible.',
    ],
    notas: [
      'El historial permite reconstruir el proceso terapeutico del paciente.',
    ],
  },
  {
    id: 'tests',
    titulo: 'Tests psicologicos',
    modulo: 'Tests Psicologicos',
    descripcion: 'Permite aplicar pruebas psicologicas mediante enlace publico y consultar resultados.',
    pasos: [
      'Ingresar al detalle del paciente o al modulo de tests.',
      'Seleccionar el test psicologico disponible.',
      'Crear una aplicacion de test para el paciente.',
      'Compartir el enlace publico generado.',
      'Esperar que el paciente complete el test.',
      'Consultar resultado, puntaje, nivel y alertas si existen.',
    ],
    notas: [
      'El paciente no necesita iniciar sesion para responder un test publico.',
      'Las aplicaciones completadas no deben reutilizarse.',
    ],
  },
  {
    id: 'facturacion',
    titulo: 'Facturacion y recibos',
    modulo: 'Facturacion',
    descripcion: 'Permite consultar recibos, montos, moneda, tasa de cambio y equivalentes en cordobas.',
    pasos: [
      'Ingresar al modulo Facturacion.',
      'Revisar los recibos generados por citas o pagos registrados.',
      'Filtrar o consultar informacion segun paciente, fecha o estado si aplica.',
      'Verificar moneda, monto total y equivalente en cordobas cuando el pago sea en dolares.',
      'Generar o descargar comprobantes cuando la opcion este disponible.',
    ],
    notas: [
      'Los pagos pueden registrarse en cordobas o dolares.',
      'Cuando el pago es en dolares, se debe registrar tasa de cambio para calcular equivalente en cordobas.',
    ],
  },
  {
    id: 'configuracion',
    titulo: 'Configuracion de catalogos',
    modulo: 'Configuracion',
    descripcion: 'Administra catalogos base utilizados por formularios y procesos del sistema.',
    pasos: [
      'Entrar al modulo Configuracion.',
      'Seleccionar el catalogo que se desea administrar.',
      'Presionar Agregar registro para crear un nuevo valor.',
      'Usar Editar para modificar registros existentes.',
      'Usar Eliminar solo cuando el registro ya no sea necesario.',
    ],
    notas: [
      'Los catalogos pueden afectar formularios de pacientes, citas, sesiones y facturacion.',
      'No elimines valores si ya fueron usados en registros historicos, salvo que sea necesario.',
    ],
  },
  {
    id: 'backups',
    titulo: 'Backups de base de datos',
    modulo: 'Configuracion',
    descripcion: 'Permite generar, listar, descargar y eliminar copias de seguridad de SQL Server.',
    pasos: [
      'Entrar al modulo Configuracion.',
      'Ubicar la seccion Backups de base de datos.',
      'Presionar Generar backup.',
      'Confirmar la accion.',
      'Esperar a que el sistema genere el archivo .bak.',
      'Descargar el backup si se necesita conservar una copia externa.',
      'Eliminar backups antiguos cuando ya no sean necesarios.',
    ],
    notas: [
      'Los backups se generan desde el backend y se guardan en la carpeta configurada en el servidor.',
      'Es recomendable conservar copias externas en disco, USB o almacenamiento en la nube.',
    ],
  },
  {
    id: 'auditoria',
    titulo: 'Auditoria del sistema',
    modulo: 'Auditoria',
    descripcion: 'Permite revisar acciones importantes realizadas por los usuarios dentro del sistema.',
    pasos: [
      'Ingresar al modulo Auditoria.',
      'Filtrar por usuario, fecha o tipo de accion si el sistema lo permite.',
      'Revisar eventos como cambios de roles, cancelaciones, modificaciones y accesos.',
      'Usar el historial de auditoria para investigar acciones relevantes.',
    ],
    notas: [
      'La auditoria ayuda a mantener trazabilidad administrativa y operativa.',
    ],
  },
];

const flujoOperativo = [
  'Registrar paciente.',
  'Registrar tutor si el paciente es menor de edad.',
  'Crear cita con psicologo, fecha, hora y tipo de atencion.',
  'Registrar datos de pago cuando corresponda.',
  'Iniciar sesion desde la cita.',
  'Completar la informacion clinica.',
  'Aplicar tests psicologicos si corresponde.',
  'Consultar resultados y alertas.',
  'Guardar seguimiento o proxima cita.',
  'Revisar historial clinico.',
  'Generar backup de forma periodica.',
];

const normalizar = (texto: string) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function ManualUsuario() {
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState(secciones[0]?.id || '');

  const seccionesFiltradas = useMemo(() => {
    const textoBusqueda = normalizar(busqueda.trim());

    if (!textoBusqueda) {
      return secciones;
    }

    return secciones.filter((seccion) => {
      const contenido = [
        seccion.titulo,
        seccion.descripcion,
        seccion.modulo,
        ...seccion.pasos,
        ...(seccion.notas || []),
      ].join(' ');

      return normalizar(contenido).includes(textoBusqueda);
    });
  }, [busqueda]);

  const seccionSeleccionada = secciones.find((seccion) => seccion.id === seccionActiva) || seccionesFiltradas[0] || secciones[0];

  const imprimirManual = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1700px] animate-fade-in-up space-y-8 print:max-w-none">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-200/80 sm:px-8 print:border-slate-200 print:bg-white print:text-slate-950 print:shadow-none">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl print:hidden"></div>
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl print:hidden"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-blue-100 print:bg-slate-100 print:text-slate-700">
                <Icons.Book />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300 print:text-slate-500">
                  Ayuda del sistema
                </p>
                <h1 className="mt-1 font-serif text-3xl font-black tracking-tight sm:text-4xl">
                  Manual de Usuario
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300 print:text-slate-600">
              Guia practica para utilizar los modulos principales del Sistema de Gestion Clinica Psicologica Resiliencia:
              pacientes, tutores, psicologos, citas, sesiones, tests psicologicos, facturacion, configuracion, auditoria y backups.
            </p>
          </div>

          <button
            type="button"
            className="btn min-h-12 rounded-2xl border-white/10 bg-white px-6 text-slate-950 shadow-xl hover:border-white hover:bg-slate-100 print:hidden"
            onClick={imprimirManual}
          >
            <Icons.Print />
            Imprimir manual
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 print:grid-cols-3">
        {resumenes.map((item) => (
          <article key={item.titulo} className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm print:border-slate-200 print:shadow-none">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.titulo}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                {item.icono}
              </span>
            </div>
            <p className="mt-3 text-xl font-black text-slate-950">{item.valor}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.descripcion}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[340px_minmax(0,1fr)] print:block">
        <aside className="rounded-[2rem] border border-white/80 bg-white shadow-sm print:hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Indice</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Contenido del manual</h2>

            <label className="mt-5 flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 focus-within:border-blue-200 focus-within:bg-white">
              <Icons.Search />
              <input
                type="search"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Buscar en el manual..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </label>
          </div>

          <div className="max-h-[760px] space-y-2 overflow-y-auto p-4">
            {seccionesFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-400">
                No se encontraron resultados.
              </div>
            ) : (
              seccionesFiltradas.map((seccion, index) => {
                const activo = seccionSeleccionada?.id === seccion.id;

                return (
                  <button
                    key={seccion.id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      activo
                        ? 'border-slate-900 bg-slate-950 text-white shadow-lg shadow-slate-200'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50/60 hover:text-blue-700'
                    }`}
                    onClick={() => setSeccionActiva(seccion.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        activo ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{seccion.titulo}</p>
                        <p className={`mt-0.5 truncate text-[11px] font-medium ${
                          activo ? 'text-slate-300' : 'text-slate-400'
                        }`}>
                          Modulo: {seccion.modulo}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="space-y-8">
          <article className="rounded-[2rem] border border-white/80 bg-white shadow-sm print:border-slate-200 print:shadow-none">
            <div className="border-b border-slate-100 px-6 py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
                {seccionSeleccionada?.modulo}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                {seccionSeleccionada?.titulo}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">
                {seccionSeleccionada?.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] print:block">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Pasos de uso</h3>
                <div className="mt-4 space-y-3">
                  {seccionSeleccionada?.pasos.map((paso, index) => (
                    <div key={`${seccionSeleccionada.id}-paso-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <p className="pt-1 text-sm font-medium leading-6 text-slate-700">{paso}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-3xl border border-blue-100 bg-blue-50 p-5 print:mt-6">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Notas importantes</h3>

                {seccionSeleccionada?.notas && seccionSeleccionada.notas.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {seccionSeleccionada.notas.map((nota, index) => (
                      <div key={`${seccionSeleccionada.id}-nota-${index}`} className="flex gap-3 text-sm leading-6 text-blue-900">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-blue-700">
                          <Icons.Check />
                        </span>
                        <p className="font-medium">{nota}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-medium leading-6 text-blue-900">
                    No hay notas adicionales para esta seccion.
                  </p>
                )}
              </aside>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm print:border-slate-200 print:shadow-none">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icons.Database />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Flujo recomendado</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Proceso operativo general</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Secuencia sugerida para trabajar con el sistema desde el registro del paciente hasta el seguimiento clinico y respaldo de datos.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
              {flujoOperativo.map((paso, index) => (
                <div key={`flujo-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-mono text-xs font-black text-slate-400">PASO {String(index + 1).padStart(2, '0')}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{paso}</p>
                </div>
              ))}
            </div>
          </article>

          <section className="hidden print:block">
            <h2 className="mb-4 text-2xl font-black text-slate-900">Manual completo</h2>
            <div className="space-y-6">
              {secciones.map((seccion, index) => (
                <article key={`print-${seccion.id}`} className="break-inside-avoid rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {String(index + 1).padStart(2, '0')} - {seccion.modulo}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{seccion.titulo}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{seccion.descripcion}</p>

                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {seccion.pasos.map((paso, pasoIndex) => (
                      <li key={`print-${seccion.id}-${pasoIndex}`}>{paso}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}
