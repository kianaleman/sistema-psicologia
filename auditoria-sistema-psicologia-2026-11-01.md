# Auditoría completa — Sistema de Psicología Resiliencia

**Fecha:** 1 de noviembre de 2026, zona de referencia America/Managua.  
**Repositorio local auditado:** C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia  
**Remoto configurado:** https://github.com/kianaleman/sistema-psicologia.git  
**Commit:** df3c7d4205324506ebcf59f80368ec0fb20cff80.  
**Alcance:** 131 archivos versionados; 110 archivos de código, estilos y esquema; 26.544 líneas físicas en ese conjunto; 48 modelos Prisma. Se revisaron los módulos y sus relaciones, configuraciones, documentación, recursos y lockfiles.

La auditoría se hizo sobre esta copia local. La consulta web del repositorio no permitió contrastar el HEAD remoto; no se afirma que este commit sea el más reciente de GitHub. El árbol versionado estaba limpio al comenzar. Los resultados y compilaciones de auditoría se generaron fuera del repositorio. No se implementaron mejoras, modificaron archivos fuente, instalaron paquetes, cambiaron datos clínicos ni ejecutaron correos, respaldos o el cron del sistema.

**Cómo interpretar la evidencia:** “Confirmado” significa comprobado en el código o mediante las comprobaciones descritas. Las pruebas de rutas utilizaron servicios sustituidos por funciones en memoria, con JWT exclusivamente de prueba; prueban el paso de los controles, no una operación real sobre SQL Server. Las carreras se identificaron por lectura de las operaciones y restricciones; no se reprodujeron contra una base real.

No se consultaron registros clínicos ni el esquema de una instancia SQL Server en ejecución. No se midieron planes de ejecución, duplicados reales, rendimiento bajo carga, contraste visual, uso con lectores de pantalla ni recuperación real de respaldos. No había una base aislada con migraciones y datos sintéticos para realizar esas verificaciones de forma reproducible.

## A. Resumen ejecutivo

El proyecto tiene una base funcional considerable para administrar una clínica psicológica: pacientes adultos y menores, tutores, profesionales, agenda, sesiones, recibos, instrumentos psicológicos, auditoría, respaldos y reportes PDF. Su objetivo principal parece ser centralizar el trabajo administrativo y clínico de una clínica pequeña. El README lo presenta como proyecto académico.

**El estado actual requiere corregir seguridad y fiabilidad antes de utilizarlo con información clínica real o exponer la API en Internet.** Los problemas más importantes están en controles de acceso inconsistentes y en la integridad del flujo clínico:

- Cualquier cuenta autenticada puede gestionar y descargar respaldos completos.
- Usuarios sin rol administrador pueden administrar perfiles de psicólogos y cambiar el correo de la cuenta vinculada.
- La agenda devuelve campos clínicos de sesiones a recepción.
- El formulario de sesión envía un ID que la validación rechaza; además, la pantalla cierra y limpia el formulario antes de confirmar la persistencia.
- Las indicaciones posteriores al primer tratamiento se descartan.
- La API pública acepta puntajes de tests suministrados por el paciente.
- Agenda, tests y transiciones clínicas tienen carreras o invariantes insuficientemente protegidas.
- El despliegue no es reproducible: faltan migraciones y semillas; el frontend apunta a localhost y el comando de inicio del backend busca un archivo inexistente.
- Existen alertas de dependencias; una de body-parser coincide con el middleware global realmente utilizado.

La separación por módulos, varias transacciones y parte de los controles por profesional son buenos puntos de partida. No hace falta una reescritura ni una arquitectura de microservicios para resolver los hallazgos.

### Comprobaciones ejecutadas

| Comprobación | Resultado y alcance |
|---|---|
| Estado Git e inventario | Árbol versionado limpio; 131 archivos; remoto coincidente |
| Dependencias instaladas | npm ls --depth=0 en ambos módulos: correcto; no fue necesario instalar |
| TypeScript backend | tsc --noEmit: correcto |
| TypeScript frontend | tsc -p tsconfig.app.json --noEmit y tsc -p tsconfig.node.json --noEmit: correctos |
| Compilación backend | npm run build con outDir externo: correcta; emitió src/index.js, no index.js en la raíz de salida |
| Inicio de producción | npm start: MODULE_NOT_FOUND para dist/index.js; falló antes de cargar la aplicación |
| Compilación frontend | Typecheck más vite build con outDir externo: correctos; se ejecutaron las etapas equivalentes del script sin escribir dist en el proyecto |
| Prisma | prisma validate: esquema válido; no comprueba datos, existencia de tablas ni integridad de una instancia |
| Lint frontend | Falla: 3 errores y 2 advertencias |
| Pruebas backend | npm test ejecuta el marcador “no test specified” y termina con error |
| Pruebas automatizadas | No se encontró suite unitaria, de API, integración, autorización o E2E |
| Dependencias frontend | npm audit: 22 paquetes afectados en el conjunto completo; --omit=dev: 9, con 2 críticos, 6 altos y 1 moderado según el escáner |
| Dependencias backend | pnpm audit y --prod reportan avisos; el resumen de producción informa 1 crítico, 8 altos, 24 moderados y 1 bajo. Son cifras del escáner, no pruebas de explotabilidad; sus detalles se analizan en F16 |
| Pruebas seguras de contratos y rutas | Rechazo de ID_Expediente=0; aceptación de Valor arbitrario y fecha/hora inválidas; acceso de recepción a backups, catálogos y modificación de psicólogo; auditoría sí rechaza recepción |
| Zona horaria | Reproducción determinista en America/Managua del desfase de expiración y del día anterior en fechas civiles |
| Análisis estructural | Extracción de 107 archivos de código: 879 nodos y 1.744 relaciones AST, complementada con lectura semántica |

El análisis de dependencias incluyó consultas al registro de npm; no se ejecutaron demostraciones de denegación de servicio ni otras explotaciones de las bibliotecas.

## B. Arquitectura actual

### Problema, objetivo y usuarios

La aplicación intenta sustituir registros dispersos de pacientes, agenda, notas de consulta y cobros. Los usuarios internos implementados son **Administrador, Psicólogo y Recepción**. Un paciente puede responder un test mediante un enlace público; no existe un portal completo de pacientes ni un inicio de sesión para tutores.

El backend es una aplicación Express por capas: rutas → middlewares → controladores → servicios → Prisma → SQL Server. Los controladores traducen HTTP, pero también normalizan datos y registran auditoría. Los servicios mezclan reglas de negocio, autorización y persistencia. Cada servicio crea su propio PrismaClient.

El frontend es una SPA React. Las páginas y modales usan hooks locales; estos llaman a un servicio fetch común. La sesión se guarda en localStorage. No hay un almacén central de autenticación o de consultas con invalidación compartida.

~~~mermaid
flowchart LR
    U[Administrador, Psicólogo y Recepción] --> SPA[React y React Router]
    P[Paciente con enlace] --> TP[Pantalla pública de test]
    SPA --> H[Hooks y servicio fetch]
    TP --> H
    H --> API[Express /api]
    API --> MW[JWT, roles y Zod]
    MW --> C[Controladores]
    C --> S[Servicios de dominio]
    S --> DB[(SQL Server mediante Prisma)]
    C --> AUD[Auditoría]
    AUD --> DB
    CRON[Cron por proceso, cada minuto] --> S
    S --> SMTP[Gmail SMTP para recuperación]
    S --> BAK[Backup SQL y directorio de archivos]
    SPA --> PDF[jsPDF y AutoTable en navegador]
~~~

**Fuentes de entrada y comunicación:** [index.ts](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:20), [App.tsx](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/App.tsx:1), [api.ts](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/api.ts:28).

### Tecnologías y versiones observadas

| Capa | Tecnologías |
|---|---|
| Backend | Node.js, TypeScript 5.9.3, Express instalado 5.2.1, Prisma/@prisma/client 6.19.3 |
| Persistencia | SQL Server; Prisma con 48 modelos, relaciones y varias claves compuestas |
| Seguridad | jsonwebtoken 9.0.3, bcrypt 6.0.0, Helmet 8.2.0, express-rate-limit 8.5.2, Zod 4.4.3 |
| Procesos y correo | node-cron 4.2.1 y Nodemailer 8.0.7 con servicio Gmail |
| Frontend | React/React DOM 19.2.0, React Router DOM 7.9.6, Vite 7.2.2, TypeScript 5.9.3 |
| Interfaz | Tailwind CSS 4.1.17, DaisyUI 5.5.3, Sonner 2.0.7, Recharts 3.4.1 |
| Documentos | jsPDF 3.0.4 y jsPDF-AutoTable 5.0.2, generación en el navegador |
| Herramientas | ESLint 9.39.1; npm en frontend y lockfile pnpm en backend |

Estas son versiones instaladas o resueltas, no una afirmación de que sean las últimas. El entorno de comprobación tenía Node 24.22.1, npm 11.19.1 y pnpm 10.16.1. Los paquetes no fijan una política explícita de engines o packageManager.

### Persistencia y modelo de datos

El núcleo está razonablemente normalizado:

- Paciente concentra identidad y dirección; PacienteAdulto y Paciente_Menor contienen los datos específicos.
- Tutor_PacienteMenor relaciona tutores, menores, parentesco y contacto principal.
- Expediente es único por paciente y agrupa sesiones y relaciones de alergias.
- Cita relaciona paciente, psicólogo, dirección, tipo y estado.
- Sesion se vincula a cita y expediente; Tratamiento tiene subtipos farmacéutico y terapéutico; las exploraciones usan una tabla intermedia.
- Recibo contiene importe, divisa, tasa, método, banco y referencia; es único por cita.
- Usuario, Rol y Usuario_Rol implementan cuentas con múltiples roles; el profesional se vincula a Usuario.
- TestPsicologico, TestPregunta, TestOpcion y TestRangoResultado describen instrumentos. TestAplicacion, TestRespuesta y TestAplicacionEvento almacenan su aplicación y resultado.
- AuditoriaSistema registra acciones generales; AuditoriaCita permanece modelada sin flujo de uso encontrado.

Hay PK y FK explícitas, unicidad en correos, cédulas, código MINSA, expediente por paciente y sesión/recibo por cita. El dinero usa Decimal(18,2) y las tasas Decimal(18,4). Las fortalezas no garantizan invariantes de negocio: persisten riesgos en subtipos de paciente, estados clínicos, horarios, respuestas y rangos de tests.

No se versionan migraciones ni un DDL inicial. Los índices adicionales o CHECK creados manualmente en una instancia no pueden verificarse con este repositorio. [Esquema completo](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:1).

### API existente

La API combina recursos REST con acciones RPC. Usa el prefijo /api, sin versión explícita ni contrato OpenAPI. Predominan respuestas JSON específicas de cada módulo; los errores suelen ser objetos con error. Auditoría es el único listado con paginación de servidor claramente implementada.

| Prefijo | Operaciones principales | Protección real relevante |
|---|---|---|
| /api/auth | login, recuperación, cambio obligatorio, registro, roles y reset administrativo | Públicas las de acceso/recuperación; administración con rol; JWT sin revocación |
| /api/pacientes | listar, crear, actualizar, expediente e historial | JWT y reglas de rol/relación en servicio |
| /api/tutores | listar, crear, actualizar | JWT y comprobaciones en servicio |
| /api/psicologos | listar, crear y actualizar | Solo JWT; falta autorización de administración/objeto |
| /api/citas | agenda, catálogos, horarios ocupados, crear, editar y cancelar | JWT y filtros en servicio; la proyección clínica tiene una fuga |
| /api/sesiones | crear y buscar | JWT y permisos en servicio; contrato de creación incompatible con UI |
| /api/facturas | listar recibos | JWT y filtros en servicio; el detalle implementado no está registrado |
| /api/general | catálogos, estadísticas, historial, gráficos y motivos | JWT y reglas en servicio |
| /api/config | CRUD de catálogos permitidos | Solo JWT, también para escritura |
| /api/auditoria | listar y resumen | JWT, contraseña cambiada y rol Administrador |
| /api/tests | instrumentos, aplicaciones, resultados y respuestas públicas | Roles en rutas privadas; token de enlace en /publico/:token |
| /api/backups | listar, generar, descargar y eliminar | Solo JWT, sin rol ni bloqueo de contraseña temporal |

Los endpoints públicos de tests son una decisión funcional legítima: el enlace actúa como credencial. El problema está en el cálculo y las transiciones de respuesta, no en que exista una ruta pública.

### Servicios externos y ejecución actual

- **SQL Server:** todas las operaciones persistentes y los comandos BACKUP/RESTORE VERIFYONLY.
- **Gmail SMTP:** recuperación de contraseñas. No se encontró correo de recordatorio de citas.
- **Google Fonts:** descarga de Inter desde index.css.
- **Vercel:** existe una carpeta local ignorada .vercel con vínculo y variables de producción. Es evidencia de preparación o uso previo de hosting del frontend; no demuestra el estado actual del despliegue.
- **PDF:** se genera localmente en el navegador; no depende de una API externa.

El backend se desarrolla con tsx watch src/index.ts en el puerto PORT o 3000. El frontend usa Vite en 5173. Prisma carga indirectamente el .env durante la construcción del cliente; comprobé que importar el middleware deja disponible JWT_SECRET sin una importación explícita de dotenv en index.ts. No corresponde afirmar que el arranque siempre falla por esa variable.

La configuración local contiene nombres de variables de base de datos, JWT, correo y respaldos. Se inspeccionó su presencia sin publicar valores. No hay archivos .env versionados en HEAD y la consulta de nombres en los 56 commits disponibles no encontró .env, variantes .env.*, PEM o KEY. Esto no equivale a una certificación exhaustiva de ausencia de secretos en toda la historia; sí se encontró una contraseña administrativa fija en crearAdmin.ts.

El diseño operativo combina una SPA estática con un servidor Node persistente y SQL Server. El cron por proceso y los archivos de backup requieren decidir expresamente la topología. No se encontró Docker, Compose, CI/CD, configuración reproducible del backend, health checks, estrategia de rollback ni restauración automatizada.

## C. Módulos encontrados

| Módulo | Responsabilidad y estado real |
|---|---|
| Autenticación y roles | JWT, bcrypt, alta de usuarios, contraseñas temporales, recuperación por correo y múltiples roles |
| Pacientes y expedientes | Adultos/menores, direcciones, información personal, expediente e historial; contratos parciales inconsistentes |
| Tutores | Datos de responsables y relaciones con menores; alta integrada principalmente en registro de menor |
| Psicólogos | Perfil, especialidades y cuenta de acceso; autorización administrativa incompleta |
| Agenda | Reservar, editar, cancelar, consultar horarios; creación automática de recibo |
| Sesiones | Notas, diagnóstico, evolución, criterios, exploraciones y tratamiento; guardado de UI actualmente bloqueado |
| Facturación | Consulta y PDF de recibos, agregados e informes; no es un ciclo completo de deuda, pagos parciales y devolución |
| Tests psicológicos | Instrumentos, enlace público, respuestas, cálculo y resultados; faltan controles de integridad y gestión completa en UI |
| Configuración | CRUD dinámico de 11 catálogos preseleccionados; escritura accesible con cualquier JWT |
| Auditoría | Registro de operaciones, filtros y resumen; no cubre accesos clínicos y respaldos de forma completa |
| Respaldos | BACKUP DATABASE, verificación, listado, descarga y borrado de .bak; falta separación de privilegios y topología |
| Dashboard y reportes | Indicadores, gráficos, PDF de expediente, receta y facturación; agregaciones y fechas requieren correcciones |
| Manual de usuario | Ayuda dentro de la SPA; contiene diferencias con la implementación y su ruta excluye algunos roles destinatarios |

## D. Flujo funcional

1. Un administrador crea una cuenta o un perfil de psicólogo. El servidor devuelve una contraseña temporal; el primer acceso debe cambiarla. La restricción está aplicada en auth, tests y auditoría, pero se omite en otros routers.
2. Recepción o el personal autorizado registra al paciente, su dirección y expediente. Un adulto incorpora cédula y contacto; un menor debe vincular un tutor. La validación actual no obliga todas esas relaciones.
3. Se agenda una cita con psicólogo, fecha, hora, ubicación, motivo y datos de cobro. El servidor comprueba disponibilidad por hora exacta y crea cita y recibo en una transacción.
4. Al atender, el profesional abre el modal clínico, captura notas, evolución, criterios y tratamientos. El flujo previsto guarda sesión, tratamientos y exploraciones y marca la cita realizada. Hoy la UI manda ID_Expediente=0 y el middleware lo rechaza; el cierre anticipado del modal agrava el fallo.
5. El expediente y el historial reúnen consultas para seguimiento y generación de documentos. Varias rutas restringen sesiones al psicólogo propio, pero la agenda permite a recepción recibir su contenido.
6. Un profesional asigna un test al paciente, opcionalmente a una sesión. Se genera un secreto aleatorio, se guarda su hash y se devuelve el enlace. El paciente responde sin cuenta. El servidor calcula puntaje, nivel y alerta; la API permite actualmente sustituir los valores del catálogo por un Valor enviado por el cliente.
7. Facturación muestra recibos y genera PDF. El sistema registra el cobro al crear la cita; no se encontró un proceso separado de factura pendiente, liquidación o devolución por cancelación.
8. El cron revisa cada minuto citas pendientes sin sesión. Tras la hora más 60 minutos de gracia, las marca no procesadas por inasistencia. La actualización vuelve a comprobar estado y ausencia de sesión, lo que es una protección útil.
9. Administración consulta auditoría y utiliza los respaldos. El frontend intenta reservar estas pantallas, pero esa intención no se aplica de forma uniforme en la API.

### Documentación frente a código

| Documentación | Implementación real |
|---|---|
| README exige ejecutar un script para crear la BD | Ese script no está versionado; tampoco hay migraciones o seed completos |
| Ejemplo de .env solo muestra DATABASE_URL | También se necesitan JWT_SECRET, correo, URL del frontend en despliegue y configuración de backups |
| Backend denominado MVC | En realidad son capas de rutas/controladores/servicios con una SPA separada; el backend no renderiza vistas |
| Dashboard “en tiempo real” | Fetch y efectos, sin suscripción ni actualización continua de datos del servidor; el reloj no vuelve vivos los KPIs |
| Disponibilidad automática | Se comprueba hora exacta, sin duración, reservas atómicas ni intervalos |
| Historial y sesiones operativos | El contrato del formulario impide finalizar normalmente una sesión |
| Último mensaje de commit dice permitir ID_Expediente=0 | El schema de sesión actual sigue exigiendo un valor positivo |
| Mensaje de implementación de tests dice evitar reutilización | La comprobación secuencial existe, pero los envíos concurrentes no están protegidos atómicamente |
| Manual describe NIO/USD y tasa de cambio | El formulario de cita fija ID_Divisa=1 y la API fija tasa 1 |
| Manual propone alta de tutor desde Tutores | La pantalla ofrece consulta/edición; el alta principal está integrada en pacientes menores |
| README frontend | Sigue siendo la plantilla general de React/Vite y no documenta el producto |
| Licencia descrita como académica; package backend ISC | No se encontró un archivo LICENSE que unifique claramente la intención |

Fuentes: [README](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/README.md:1), [descripción de tests](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/commit-tests-psicologicos.txt:1), [manual](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/ManualUsuario.tsx:144), [schema de sesión](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/sesion.schema.ts:7).

## E. Fortalezas

- La división por módulos facilita corregir y verificar flujos concretos.
- Hay transacciones reales para paciente/dirección/expediente, cita/recibo, sesión/tratamientos y profesional/cuenta/rol.
- La mayoría de consultas usa Prisma con valores parametrizados; no encontré concatenación de entrada HTTP como SQL en los servicios ordinarios.
- Los respaldos escapan identificadores y literales SQL y validan nombres de archivo; usar executeRawUnsafe en ese contexto no demuestra por sí mismo una inyección.
- Las contraseñas se almacenan con bcrypt; el secreto JWT se exige por configuración y no tiene un fallback incrustado en el código de autenticación.
- Los enlaces de tests usan 32 bytes aleatorios y hash SHA-256 en persistencia; también hay expiración y controles secuenciales de estado.
- Varios servicios aplican filtros reales por profesional y limitan la información clínica de recepción.
- Los selectores públicos de test no devuelven nombre del paciente ni observaciones del profesional.
- Helmet y rate limiting ya están incorporados, aunque necesitan ajustes y mayor cobertura.
- Auditoría protege campos de contraseña/token por nombre antes de serializarlos y restringe la consulta a administradores.
- El esquema conserva integridad referencial básica y usa Decimal para importes.
- TypeScript estricto está activado en ambos proyectos y la compilación pasa.
- Existen estados de carga, vacíos, confirmaciones y diseño adaptable en varias pantallas.
- React muestra el contenido clínico como texto. No encontré un sink explícito de HTML sin sanitizar en la interfaz revisada.
- El reloj limpia su intervalo y las descargas revocan el ObjectURL; no se demostró una fuga de memoria o streams.
- Los PDFs se generan sin añadir un servicio externo y los tests indican que el resultado requiere interpretación del profesional.

## F. Problemas encontrados

Las severidades valoran el impacto en este proyecto. Las cifras de severidad de bibliotecas proceden de sus avisos y se distinguen de la explotabilidad del flujo que realmente utiliza la aplicación.

### F01. Respaldos completos accesibles con cualquier cuenta

**Problema:** falta autorización administrativa en todas las operaciones de backup.  
**Severidad:** CRÍTICA.  
**Archivo(s):** [backup.routes.ts:8](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/routes/backup.routes.ts:8), [backup.controller.ts:73](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/backup.controller.ts:73), [backup.service.ts:218](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/backup.service.ts:218).  
**Descripción:** las rutas solo ejecutan verificarToken. No comprueban rol, propiedad ni cambio de contraseña temporal. Las pruebas con servicios simulados permitieron a Recepción listar, generar y eliminar; también permitieron generar usando una contraseña temporal.  
**Consecuencia:** si existen archivos accesibles, un usuario de bajo privilegio puede descargar la base completa, incluidos datos clínicos y hashes de cuentas, o eliminar su copia de recuperación. La descarga real y el borrado de archivos no se ejecutaron.  
**Solución recomendada:** autorización de administrador en servidor, bloqueo de contraseña temporal, permiso independiente para descarga/borrado, auditoría, límites de generación y credenciales de backup separadas de las operaciones ordinarias.

### F02. Administración de psicólogos y correos sin permisos

**Problema:** cualquier JWT permite crear profesionales y modificar cuentas vinculadas.  
**Severidad:** CRÍTICA.  
**Archivo(s):** [psicologo.routes.ts:14](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/routes/psicologo.routes.ts:14), [psicologo.controller.ts:70](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/psicologo.controller.ts:70), [psicologo.service.ts:303](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/psicologo.service.ts:303), [psicologo.service.ts:393](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/psicologo.service.ts:393).  
**Descripción:** el controlador no pasa req.user al servicio y este no comprueba rol ni propietario. Crear un profesional crea una cuenta con rol de psicólogo y devuelve su contraseña temporal. Actualizar permite cambiar el correo del usuario vinculado. Una prueba en memoria confirmó que Recepción alcanza la actualización de un profesional ajeno.  
**Consecuencia:** elevación a una cuenta profesional y posible toma de otra cuenta mediante cambio de correo seguido de recuperación. El impacto incluye administradores si el profesional objetivo tiene también ese rol; no se verificó que exista ese caso en los datos.  
**Solución recomendada:** separar administración de autoservicio, exigir rol/objeto en servidor, limitar qué campos puede editar cada capacidad, verificar cambios de correo y revocar sesiones de la cuenta afectada.

### F03. Recepción recibe contenido clínico desde la agenda

**Problema:** el listado de citas filtra registros, pero no los campos por rol.  
**Severidad:** ALTA.  
**Archivo(s):** [cita.service.ts:55](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:55), [cita.service.ts:167](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:167), [cita.service.ts:191](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:191).  
**Descripción:** Recepción obtiene todas las citas y la consulta incluye Sesion:true, con sus campos escalares de observaciones, diagnóstico, evolución y criterios. Pacientes e historial sí tienen exclusiones clínicas para ese rol.  
**Consecuencia:** la API de agenda permite eludir la separación de información que existe en otros módulos, aunque la pantalla no muestre todos los campos recibidos.  
**Solución recomendada:** proyecciones explícitas según capacidad; entregar a recepción solo metadatos administrativos de la sesión. Probar el JSON de cada endpoint por rol y no únicamente la visibilidad de botones.

### F04. Las sesiones no reflejan cambios de cuenta o permisos

**Problema:** autorización basada exclusivamente en claims antiguos y bloqueo temporal incompleto.  
**Severidad:** ALTA.  
**Archivo(s):** [auth.middleware.ts:94](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/middlewares/auth.middleware.ts:94), [auth.service.ts:87](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:87), [auth.service.ts:380](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:380), [configuracion.routes.ts:23](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/routes/configuracion.routes.ts:23).  
**Descripción:** verificarToken no comprueba estado actual, versión de sesión ni roles vigentes. Restablecer contraseña o cambiar roles no invalida tokens previos. El bloqueo requiereCambioPassword está en auth/tests/auditoría, pero no se aplica globalmente al resto de módulos.  
**Consecuencia:** retirar permisos, desactivar una cuenta o imponer contraseña temporal no corta sus accesos anteriores durante la vigencia del JWT —8 horas por defecto—. Una cuenta temporal puede operar en rutas que solo exigen token.  
**Solución recomendada:** política común de autenticación, comprobación de cuenta y versión de sesión/revocación; invalidar tras cambios sensibles. Mantener una excepción explícita para completar el cambio obligatorio.

### F05. Finalizar una sesión desde la UI falla siempre en el contrato

**Problema:** el frontend envía un ID de expediente rechazado por Zod.  
**Severidad:** ALTA.  
**Archivo(s):** [SesionModal.tsx:439](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:439), [sesion.schema.ts:7](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/sesion.schema.ts:7), [sesion.routes.ts:24](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/routes/sesion.routes.ts:24).  
**Descripción:** el formulario siempre envía ID_Expediente:0; el esquema exige entero positivo u omisión. El controlador sí contempla generación automática, pero no llega a ejecutarse. Reproduje el rechazo con el esquema real, sin BD.  
**Consecuencia:** no se guarda normalmente la consulta desde la pantalla y no se completa su transacción clínica.  
**Solución recomendada:** omitir el ID cuando el backend debe resolverlo, o definir un contrato explícito compatible. Validar con una prueba que use el payload completo de la pantalla y recorra el endpoint.

### F06. El formulario clínico se limpia antes de confirmar guardado

**Problema:** se cierra el modal sin esperar la persistencia.  
**Severidad:** ALTA.  
**Archivo(s):** [Citas.tsx:150](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Citas.tsx:150), [SesionModal.tsx:182](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:182), [SesionModal.tsx:452](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:452), [CancelarCitaModal.tsx:129](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/CancelarCitaModal.tsx:129).  
**Descripción:** handleFinalizarSesion inicia toast.promise sin esperarlo y cierra. El modal interpreta que onSubmit terminó y limpia el inicio de sesión. Al reabrir se reinicializan las notas. Cancelar cita tiene un patrón similar de cierre y limpieza sin esperar el resultado.  
**Consecuencia:** un rechazo de API puede hacer perder una consulta escrita o las notas de cancelación y habilitar reintentos mientras la operación sigue pendiente.  
**Solución recomendada:** devolver y esperar el resultado real; cerrar y limpiar solo tras éxito. Conservar borradores, mostrar error y mantener una única operación pendiente.

### F07. Se pierden todos los tratamientos posteriores al primero

**Problema:** la interfaz admite una lista, pero el contrato envía un solo elemento.  
**Severidad:** ALTA.  
**Archivo(s):** [SesionModal.tsx:410](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:410), [SesionModal.tsx:437](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:437), [sesion.service.ts:240](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/sesion.service.ts:240).  
**Descripción:** después de formatear listaTratamientos se selecciona únicamente el índice 0. El servicio también espera un Tratamiento singular.  
**Consecuencia:** al corregir F05, la UI podría indicar éxito y descartar silenciosamente otras terapias o fármacos que el profesional capturó.  
**Solución recomendada:** contrato de arreglo, validación discriminada de cada tratamiento y persistencia de todos en la misma transacción. Verificar dos terapias y una indicación farmacológica y conservar FechaFin, que se normaliza pero no se persiste.

### F08. Respuestas antiguas pueden mezclar pacientes en pantalla y PDF

**Problema:** cargas asíncronas sin comprobar que siguen correspondiendo al paciente activo.  
**Severidad:** ALTA.  
**Archivo(s):** [HistorialModal.tsx:376](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/HistorialModal.tsx:376), [HistorialModal.tsx:428](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/HistorialModal.tsx:428), [HistorialModal.tsx:492](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/HistorialModal.tsx:492), [usePacienteDetalle.ts:92](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/usePacienteDetalle.ts:92).  
**Descripción:** abrir A, luego B, permite que una respuesta tardía de A sobrescriba el historial mientras el encabezado toma el nombre de B. El botón de PDF combina ese nombre con las sesiones almacenadas. El hook de detalle tampoco descarta respuestas fuera de orden.  
**Consecuencia:** información o receta atribuida al paciente equivocado. La secuencia es deducible de los efectos; no se ejecutó una prueba visual con datos reales.  
**Solución recomendada:** cancelación y comprobación de vigencia por ID/contador de petición; limpiar al cambiar de paciente y vincular encabezado, datos y exportación a la misma respuesta.

### F09. El enlace público permite fabricar puntajes del test

**Problema:** el servidor acepta el valor numérico del cliente sin exigir una opción.  
**Severidad:** ALTA.  
**Archivo(s):** [testPsicologico.schema.ts:63](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/testPsicologico.schema.ts:63), [testPsicologico.service.ts:713](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:713), [testPsicologico.service.ts:725](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:725).  
**Descripción:** las preguntas creadas requieren opciones, pero responder permite omitir ID_Opcion y enviar Valor arbitrario. En ese caso el servicio usa ese valor o cero. El esquema real aceptó Valor=-999999 en una prueba aislada.  
**Consecuencia:** el titular de un enlace puede generar resultados fuera de escala o evitar el umbral de una respuesta crítica.  
**Solución recomendada:** exigir una opción perteneciente a cada pregunta y derivar el puntaje exclusivamente del catálogo. Si habrá preguntas numéricas o libres, modelar sus tipos y límites explícitamente.

### F10. Completar, anular o vencer un test tiene carreras

**Problema:** las transiciones y las respuestas no se protegen atómicamente.  
**Severidad:** ALTA.  
**Archivo(s):** [testPsicologico.service.ts:217](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:217), [testPsicologico.service.ts:596](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:596), [testPsicologico.service.ts:672](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:672), [testPsicologico.service.ts:755](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:755), [schema.prisma:429](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:429).  
**Descripción:** el estado se lee antes de la transacción; después se insertan respuestas y se actualiza por ID, sin condición PENDIENTE. Falta unicidad por aplicación/pregunta.  
**Consecuencia:** envíos concurrentes pueden duplicar respuestas o sobrescribir resultados; completar y anular pueden revertirse mutuamente. Es un riesgo confirmado por estructura de operaciones, no una carrera medida en SQL Server.  
**Solución recomendada:** transición condicional de una sola aplicación pendiente dentro de transacción, expiración comprobada allí, clave única de respuesta e idempotencia de reenvíos.

### F11. Dos solicitudes pueden reservar el mismo horario

**Problema:** disponibilidad separada de la reserva.  
**Severidad:** ALTA.  
**Archivo(s):** [cita.service.ts:114](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:114), [cita.service.ts:327](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:327), [cita.service.ts:431](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:431), [schema.prisma:11](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:11).  
**Descripción:** crear y editar consultan disponibilidad fuera de la transacción de escritura. El esquema no impide duplicar la reserva activa. Se comparan horas exactas, sin duración o solapamientos.  
**Consecuencia:** doble reserva concurrente; una cita de duración real puede solaparse con otra de diferente hora inicial.  
**Solución recomendada:** definir inicio y fin, comprobar disponibilidad del profesional y del paciente y reservar atómicamente con aislamiento/bloqueo adecuado. La restricción debe contemplar canceladas y el modelo de intervalos elegido.

### F12. Citas y sesiones pueden quedar clínicamente contradictorias

**Problema:** faltan reglas uniformes de transición e inmutabilidad de referencias.  
**Severidad:** ALTA.  
**Archivo(s):** [cita.service.ts:404](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:404), [cita.service.ts:483](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:483), [sesion.service.ts:150](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/sesion.service.ts:150), [sesion.service.ts:289](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/sesion.service.ts:289).  
**Descripción:** crear sesión no impone una transición desde una cita válida para atender; cancelar admite citas con sesión; editar puede cambiar paciente/estado sin proteger la cita ya vinculada a expediente y recibo.  
**Consecuencia:** consulta registrada sobre una cita cancelada, cita de un paciente con sesión en otro expediente, o historia que desaparece de listados filtrados por estado realizada.  
**Solución recomendada:** máquina de estados de dominio, transiciones condicionales e invariantes dentro de transacciones. Tras registrar/firma clínica, corregir mediante enmiendas auditadas y no cambiando identidad de la consulta.

### F13. Recuperación de contraseña: tiempo, persistencia y consumo inseguros

**Problema:** comparación de expiración en una escala temporal distinta y token en claro.  
**Severidad:** ALTA.  
**Archivo(s):** [auth.service.ts:20](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:20), [auth.service.ts:654](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:654), [auth.service.ts:694](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:694), [schema.prisma:508](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:508).  
**Descripción:** se crea expiración con Date.now, pero se compara contra una fecha desplazada por el offset local. En America/Managua, un token de 15 minutos pasa aún a los 20 minutos; la ventana se extiende aproximadamente a 6 h 15 min. ResetToken se guarda sin hash. La búsqueda y el consumo posterior no son una operación condicional única.  
**Consecuencia:** enlaces utilizables durante más tiempo del anunciado, exposición de credenciales de recuperación al leer la tabla/backup y posible doble consumo concurrente.  
**Solución recomendada:** instantes UTC reales, hash del token, índice apropiado y consumo atómico con expiración. Revocar sesiones al cambiar la contraseña. Probar expiración y concurrencia con reloj controlado.

### F14. La versión desplegada llama a localhost del visitante

**Problema:** URL de API fija.  
**Severidad:** ALTA.  
**Archivo(s):** [api.ts:28](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/api.ts:28), [vite.config.ts:4](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/vite.config.ts:4).  
**Descripción:** api.ts usa http://localhost:3000/api. Existe una variable local de producción VITE_API_URL en la preparación de Vercel, pero el servicio no la lee.  
**Consecuencia:** fuera del equipo del backend, el navegador consulta otro localhost; un frontend HTTPS también queda incompatible con ese HTTP.  
**Solución recomendada:** usar configuración por entorno validada o /api con proxy del mismo origen; comprobar la URL efectiva en el artefacto publicado y los enlaces públicos generados por FRONTEND_URL.

### F15. Compilar no produce el punto de entrada de producción

**Problema:** build y start no concuerdan.  
**Severidad:** ALTA.  
**Archivo(s):** [package.json backend:6](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/package.json:6), [tsconfig.json:5](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/tsconfig.json:5).  
**Descripción:** build ejecuta tsc; rootDir/outDir están comentados y se incluyen crearAdmin.ts y prisma.config.ts. La compilación normal emite junto a fuentes. Al redirigir la salida para probarla, el entry queda en src/index.js. start pide dist/index.js.  
**Consecuencia:** un build que termina correctamente no puede iniciarse con el script de producción. npm start devolvió MODULE_NOT_FOUND en esta copia, antes de activar cron o servicios.  
**Solución recomendada:** configuración de compilación de aplicación con entradas y salida explícitas, script de inicio concordante y comando separado para administración/migraciones. Verificar build e inicio desde un checkout limpio.

### F16. Dependencias con avisos y un camino de DoS aplicable

**Problema:** versiones fijadas con vulnerabilidades conocidas sin control automatizado de actualización.  
**Severidad:** ALTA para la revisión del proyecto; los escáneres también contienen avisos clasificados CRÍTICA.  
**Archivo(s):** [package-lock.json frontend](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/package-lock.json:1), [pnpm-lock.yaml backend](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/pnpm-lock.yaml:1), [index.ts:26](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:26), [pdfGenerator.ts:1](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/pdfGenerator.ts:1).  
**Descripción:** frontend reporta 22 paquetes afectados, 9 al omitir dependencias de desarrollo; jsPDF y AutoTable aparecen críticos y comparten parte de la cadena de riesgo. Backend resuelve body-parser 2.2.2 mediante Express y usa express.json con opciones predeterminadas antes de la autenticación. El aviso del mantenedor sobre cuerpos comprimidos afecta esa versión y corrige en 2.4.0.  
**Consecuencia:** el parser global tiene una condición documentada que puede terminar el proceso con una solicitud malformada. No ejecuté ese payload. Otras alertas dependen de uso: jsPDF de inclusión de archivo afecta especialmente Node, y aquí PDF está en navegador; avisos SSR/RSC de React Router no son automáticamente explotables en esta SPA. El crítico de proxy-addr requiere subredes de confianza específicas, ausentes en trust proxy numérico 1.  
**Solución recomendada:** actualizar primero el camino aplicable de Express/body-parser y después dependencias directas/transitivas con pruebas. Revisar cada aviso por función y contexto; no ejecutar audit fix --force indiscriminadamente.

Fuentes primarias: [body-parser, aviso y versiones corregidas](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828), [jsPDF, alcance de inclusión de archivos](https://github.com/parallax/jsPDF/security/advisories/GHSA-f8cm-6447-x5h2), [proxy-addr, precondiciones de subred](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h). Los JSON completos de escáner se adjuntan fuera del repositorio.

### F17. La base y los catálogos no se pueden reproducir desde Git

**Problema:** faltan migraciones, DDL inicial y semillas coherentes.  
**Severidad:** ALTA.  
**Archivo(s):** [prisma.config.ts:8](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma.config.ts:8), [README:63](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/README.md:63), [cita.service.ts:6](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:6), [psicologo.service.ts:44](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/psicologo.service.ts:44).  
**Descripción:** la configuración apunta a prisma/migrations, pero no hay migraciones versionadas ni el script SQL indicado por el README. El código presupone IDs como psicólogo=2, cita realizada=2, motivo inasistencia=5, efectivo=1 y parentesco=6.  
**Consecuencia:** instalación nueva incompleta, pruebas de integración no reproducibles y posibilidad de asignar significado equivocado a IDs en otra BD.  
**Solución recomendada:** obtener una línea base contrastada con la instancia autorizada, versionar migraciones y semillas idempotentes de catálogos; usar códigos de negocio estables y únicos en vez de IDs incidentales.

### F18. El bootstrap administrativo tiene contraseña fija y no asigna rol

**Problema:** crearAdmin.ts no crea de forma segura y completa un administrador funcional.  
**Severidad:** ALTA si se utiliza para preparar una instalación.  
**Archivo(s):** [crearAdmin.ts:9](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/crearAdmin.ts:9), [crearAdmin.ts:15](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/crearAdmin.ts:15), [crearAdmin.ts:27](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/crearAdmin.ts:27).  
**Descripción:** incluye y registra una contraseña fija y un correo predefinido. Crea Usuario, pero la asignación de rol está solo comentada y no inserta Usuario_Rol. No se ejecutó el script ni se verificó que esa cuenta exista.  
**Consecuencia:** si se reutiliza el valor predeterminado, deja una credencial conocida; además, la cuenta creada no tiene necesariamente las capacidades administrativas esperadas.  
**Solución recomendada:** bootstrap idempotente y controlado, contraseña aleatoria o entrada segura, rol explícito por código y entrega temporal con cambio obligatorio. No publicar contraseñas en logs. Si ese script ya se usó, revisar esa cuenta en un procedimiento autorizado.

### F19. La validación descarta sus resultados transformados

**Problema:** parse valida, pero el controlador recibe el objeto original.  
**Severidad:** MEDIA.  
**Archivo(s):** [validator.middleware.ts:8](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/middlewares/validator.middleware.ts:8), [auth.schema.ts:3](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/auth.schema.ts:3), [psicologo.schema.ts:9](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/psicologo.schema.ts:9).  
**Descripción:** no se guarda el resultado de schema.parse. Los trim, defaults, preprocess y eliminación de campos desconocidos no llegan al servicio. Una prueba confirmó que una contraseña conserva espacios y un campo no definido permanece después de validar.  
**Consecuencia:** contrato aparente diferente de los valores realmente utilizados y necesidad de normalización duplicada. No se demostró una asignación masiva arbitraria de campos en Prisma: los servicios revisados construyen sus escrituras explícitamente.  
**Solución recomendada:** entregar un DTO validado y tipado, por ejemplo en res.locals; aplicar de forma compatible los datos parseados, contemplando que req.query en Express 5 no debe reemplazarse sin un diseño específico.

### F20. Paciente, tutor y actualizaciones tienen contratos insuficientes

**Problema:** datos de subtipo opcionales y actualizaciones parciales que el servicio trata como completas.  
**Severidad:** MEDIA.  
**Archivo(s):** [paciente.schema.ts:14](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/paciente.schema.ts:14), [paciente.schema.ts:55](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/paciente.schema.ts:55), [paciente.service.ts:409](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:409), [paciente.service.ts:526](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:526), [tutor.controller.ts:147](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/tutor.controller.ts:147).  
**Descripción:** esAdulto no obliga datosAdulto; tampoco se exigen siempre datos de menor/tutor. El esquema de edición acepta campos parciales, pero paciente usa fecha y dirección incondicionalmente. En tutores los opcionales se convierten en cadenas vacías y después se exigen datos omitidos. Fechas y longitudes no reflejan todas las restricciones del modelo.  
**Consecuencia:** pacientes sin subtipo o tutor esperado, entradas incoherentes con edad y errores en solicitudes que el schema aceptó.  
**Solución recomendada:** unión discriminada adulto/menor y tutor nuevo/existente, validación de fechas reales y campos según reglas; elegir PUT completo o PATCH parcial y mantener la misma semántica entre schema, DTO y servicio.

### F21. El modelo financiero no sostiene de forma coherente lo que presenta

**Problema:** totales sin normalizar divisa y ausencia de ciclo de cobro separado.  
**Severidad:** MEDIA; pasa a un impacto mayor si existen operaciones en varias monedas.  
**Archivo(s):** [cita.service.ts:349](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:349), [cita.service.ts:450](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:450), [general.service.ts:230](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/general.service.ts:230), [useFacturacion.ts:120](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/useFacturacion.ts:120), [Facturacion.tsx:124](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Facturacion.tsx:124).  
**Descripción:** la API admite ID_Divisa, pero fija tasa 1; métricas suman importes sin agrupar/conversión y la pantalla etiqueta C$. La UI normal crea moneda 1, por lo que no se afirma que hoy existan USD. El recibo se crea como cobro al reservar. Editarlo ignora cambios solo de banco/divisa/referencia y no replica siempre las reglas de transferencia.  
**Consecuencia:** cifras engañosas con multimoneda y falta de conciliación para pendientes, cancelaciones y devoluciones.  
**Solución recomendada:** declarar moneda única o soportar tasa histórica real; separar obligación/pago/anulación/devolución y reutilizar validación financiera en creación y edición.

### F22. Tests “en sesión” pueden quedar sin su consulta

**Problema:** el contexto EN_SESION admite ID_Sesion nulo y no se vincula después.  
**Severidad:** MEDIA.  
**Archivo(s):** [SesionModal.tsx:285](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:285), [SesionModal.tsx:802](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:802), [TestAplicarModal.tsx:71](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/tests/TestAplicarModal.tsx:71), [testPsicologico.schema.ts:54](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/testPsicologico.schema.ts:54), [testPsicologico.service.ts:476](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:476).  
**Descripción:** una cita por atender aún no tiene sesión; el formulario crea la aplicación con ese ID nulo. No se encontró operación posterior para asociarla al finalizar. Además, el historial de tests no se refresca al responder en otra pestaña.  
**Consecuencia:** resultados disponibles por paciente pero ausentes del historial de esa consulta; estado PENDIENTE obsoleto durante la atención.  
**Solución recomendada:** sesión borrador o asociación transaccional al finalizar; exigir coherencia de contexto y vínculo. Añadir actualización explícita y al recuperar foco antes de introducir tiempo real adicional.

### F23. La dirección del tutor nuevo utiliza siempre municipio 1

**Problema:** la selección del formulario se reemplaza por un valor fijo.  
**Severidad:** MEDIA.  
**Archivo(s):** [PacienteFormModal.tsx:268](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/pacientes/PacienteFormModal.tsx:268), [PacienteFormModal.tsx:831](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/pacientes/PacienteFormModal.tsx:831).  
**Descripción:** se permite elegir departamento/municipio, pero el payload de nuevoTutor.direccion fija municipioId:1.  
**Consecuencia:** domicilio distinto del confirmado o fallo si ese ID no existe en otra base.  
**Solución recomendada:** enviar el ID seleccionado y validarlo en servidor, incluyendo pertenencia al departamento cuando ese sea parte del contrato.

### F24. Se pierden datos de expediente y terapia entre contratos

**Problema:** respuestas y normalizaciones de historial no comparten un DTO.  
**Severidad:** MEDIA.  
**Archivo(s):** [paciente.service.ts:391](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:391), [usePacienteDetalle.ts:96](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/usePacienteDetalle.ts:96), [PacienteDetalle.tsx:278](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/PacienteDetalle.tsx:278), [paciente.service.ts:215](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:215), [HistorialModal.tsx:279](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/HistorialModal.tsx:279).  
**Descripción:** backend devuelve expediente como metadata raíz; el hook lo descarta, aunque el PDF intenta usarlo. Un selector clínico omite la relación de tipo de terapia; otra respuesta usa TipoDe_Terapia y el modal espera TipoDeTerapia.  
**Consecuencia:** número de expediente ausente, especialmente sin sesiones, y terapia mostrada como genérica o incompleta en historial/receta.  
**Solución recomendada:** DTO estable y explícito de expediente/sesión, conservar metadata y eliminar recuperación mediante múltiples aliases especulativos.

### F25. Las fechas civiles cambian de día al generar documentos

**Problema:** fechas SQL Date se interpretan como instantes en la zona del navegador.  
**Severidad:** MEDIA.  
**Archivo(s):** [schema.prisma:321](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:321), [pdfGenerator.ts:286](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/pdfGenerator.ts:286), [pdfGenerator.ts:452](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/pdfGenerator.ts:452).  
**Descripción:** el PDF usa formato local sin una política para fechas civiles. Reproduje que 2026-11-01T00:00:00.000Z se muestra como 31/10/2026 en Managua. La agenda utiliza otras conversiones.  
**Consecuencia:** recibos y recetas pueden tener una fecha distinta de la persistida.  
**Solución recomendada:** distinguir fecha civil, hora civil e instante UTC en contratos y utilidades, y formatearlos sin conversiones accidentales. Probar medianoche, cambio de día y la zona de la clínica.

### F26. Fallos de API se confunden con “sin datos” o “disponible”

**Problema:** errores de carga convertidos en arreglos vacíos o ceros.  
**Severidad:** MEDIA.  
**Archivo(s):** [useCitas.ts:159](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/useCitas.ts:159), [CitaFormModal.tsx:636](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/CitaFormModal.tsx:636), [useHistorial.ts:49](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/useHistorial.ts:49), [useFacturacion.ts:75](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/useFacturacion.ts:75), [Dashboard.tsx:193](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Dashboard.tsx:193).  
**Descripción:** consultar horarios falla y devuelve []; el modal lo presenta como disponibilidad confirmada. Otros listados registran el error en consola y muestran vacío/ceros.  
**Consecuencia:** decisiones de agenda, clínica o cobro basadas en información que no llegó a consultarse.  
**Solución recomendada:** estados distintos de carga, éxito vacío y error, con aviso y reintento; impedir confirmar disponibilidad no verificada. El backend conserva la autoridad final de reserva.

### F27. El alta rápida no actualiza el selector de pacientes de la cita

**Problema:** dos estados locales mantienen catálogos distintos.  
**Severidad:** MEDIA.  
**Archivo(s):** [Citas.tsx:135](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Citas.tsx:135), [Citas.tsx:623](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Citas.tsx:623), [useCitas.ts:74](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/useCitas.ts:74).  
**Descripción:** crear paciente refresca usePacientes; el formulario de cita consume los pacientes guardados por useCitas, cargados inicialmente.  
**Consecuencia:** el paciente recién creado no aparece hasta recargar la página.  
**Solución recomendada:** invalidar el catálogo común o incorporar el resultado de creación y seleccionarlo directamente; reducir fuentes duplicadas del mismo dato.

### F28. Listados y catálogos crecen sin límites de consulta

**Problema:** carga completa, relaciones amplias y escasos índices de dominio declarados.  
**Severidad:** MEDIA.  
**Archivo(s):** [general.service.ts:89](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/general.service.ts:89), [paciente.service.ts:238](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:238), [cita.service.ts:167](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:167), [factura.service.ts:68](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/factura.service.ts:68), [schema.prisma:11](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:11).  
**Descripción:** se descargan pacientes, citas, recibos e historia para filtrar en el navegador. getCatalogos lanza 19 consultas Prisma y mezcla catálogos estables con personas. Dashboard descarga agenda para obtener solo hoy. El esquema no declara índices compuestos para las consultas centrales de agenda/historial/recibos/auditoría.  
**Consecuencia:** trabajo, memoria, tráfico y exposición de datos aumentan con el tamaño de la clínica. No encontré un N+1 inequívoco: incluir relaciones Prisma no basta para demostrarlo.  
**Solución recomendada:** paginación, filtros y proyecciones en servidor, catálogos separados y reutilizados; índices medidos con planes de una BD de pruebas. No asumir ausencia de índices manuales en la instancia.

### F29. Se multiplican pools y procesos programados por réplica

**Problema:** cliente de BD y scheduler sin ciclo de vida común.  
**Severidad:** MEDIA.  
**Archivo(s):** [auth.service.ts:7](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auth.service.ts:7), [cita.service.ts:4](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/cita.service.ts:4), [scheduler.ts:7](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/cron/scheduler.ts:7), [index.ts:53](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:53).  
**Descripción:** los 12 servicios crean un PrismaClient. Cada proceso que arranca la API programa el cron; no hay coordinación, cierre ordenado ni comprobación de solapamiento de ejecuciones. El cron recorre todas las pendientes en memoria cada minuto.  
**Consecuencia:** más conexiones por proceso/réplica y trabajo duplicado al escalar. La condición de updateMany del cron reduce carreras de estado, pero no elimina el coste ni la duplicación de ejecución. No se demostró fuga de memoria.  
**Solución recomendada:** cliente compartido inyectable, cierre ordenado y límites de conexiones; un único ejecutor o un mecanismo coordinado para jobs, con consulta acotada por vencimiento.

### F30. Respaldos dependen de que SQL Server y Node vean el mismo archivo

**Problema:** topología y recuperación no están resueltas.  
**Severidad:** MEDIA, además de la autorización crítica F01.  
**Archivo(s):** [backup.service.ts:25](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/backup.service.ts:25), [backup.service.ts:143](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/backup.service.ts:143), [backup.service.ts:169](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/backup.service.ts:169), [backup.service.ts:184](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/backup.service.ts:184).  
**Descripción:** Node crea un directorio; SQL Server escribe TO DISK esa ruta y después Node ejecuta stat/descarga local. Esto presupone disco o montaje compartido. El nombre tiene precisión de segundos y WITH INIT; faltan retención, copia externa, cifrado declarado, programación y pruebas de restauración.  
**Consecuencia:** un backup puede escribirse en otra máquina y no estar disponible en Node; generaciones simultáneas pueden colisionar. VERIFYONLY no demuestra que la aplicación sea recuperable. No se verificó cifrado o políticas configuradas externamente.  
**Solución recomendada:** definir dónde vive el archivo y sus permisos, identificar backups de forma única, limitar ejecución y separar privilegios; establecer copia externa, retención, recuperación y simulacro de restauración.

SQL Server usa la cuenta de su servicio para acceder al dispositivo o recurso de backup; crear la carpeta desde Node no le concede esos permisos. [Documentación de Microsoft](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/backup-devices-sql-server?view=sql-server-ver17).

### F31. La trazabilidad no cubre los accesos sensibles y admite datos engañosos

**Problema:** cobertura y privacidad de auditoría incompletas.  
**Severidad:** MEDIA.  
**Archivo(s):** [auditoria.service.ts:98](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auditoria.service.ts:98), [auditoria.service.ts:197](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auditoria.service.ts:197), [auditoria.service.ts:212](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/auditoria.service.ts:212), [backup.controller.ts:27](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/backup.controller.ts:27), [testPsicologico.controller.ts:369](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/testPsicologico.controller.ts:369).  
**Descripción:** no hay auditoría de lectura de expedientes y las acciones de backup no registran al usuario pese a recibir idUsuario. Se confía directamente en el primer X-Forwarded-For. La ruta original del test respondido incluye el token en el path y se persiste sin la redacción aplicada al body. Los fallos de registro se reducen a console.error.  
**Consecuencia:** faltan evidencias de quién consultó o extrajo información; IP falsificable si la cabecera no se sobrescribe en el proxy y credenciales de enlace conservadas en logs, aunque ese enlace normalmente ya queda completado.  
**Solución recomendada:** registrar acceso/exportación/backup con datos mínimos, ruta parametrizada sin tokens, req.ip bajo proxies realmente confiables, alertar fallos y definir retención y acceso separado a auditoría.

### F32. Manejo HTTP y límites de abuso son inconsistentes

**Problema:** errores sin contrato común, protección parcial y configuración abierta.  
**Severidad:** MEDIA.  
**Archivo(s):** [index.ts:21](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:21), [index.ts:25](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:25), [index.ts:29](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/index.ts:29), [auth.middleware.ts:125](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/middlewares/auth.middleware.ts:125), [api.ts:64](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/api.ts:64), [configuracion.controller.ts:9](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/configuracion.controller.ts:9).  
**Descripción:** token inválido devuelve 403, pero el cliente solo limpia sesión con 401. Muchos controladores devuelven error.message, incluidos posibles detalles Prisma; el código HTTP depende del texto del error. Falta un manejador global JSON para parser/404/errores. Solo login y forgot-password tienen límite, compartido por IP y en memoria. Reset, tests públicos y backups no tienen límites específicos. CORS admite cualquier origen y trust proxy=1 presupone una topología concreta.  
**Consecuencia:** sesiones aparentes obsoletas, respuestas difíciles de consumir, exposición técnica y resistencia limitada al abuso. Si la API es accesible sin el proxy previsto, un cliente puede influir en la IP usada para limitar. CORS abierto no permite por sí solo omitir JWT.  
**Solución recomendada:** errores tipados/códigos estables y sanitizados, 401/403 correctos, límite por propósito/cuenta e infraestructura, orígenes permitidos y proxies definidos. La API usa Bearer manual, por lo que no se confirmó un CSRF clásico por cookies.

### F33. La navegación y los avisos no reflejan capacidades reales

**Problema:** permisos de interfaz duplicados y ruta de ayuda inaccesible a sus destinatarios.  
**Severidad:** MEDIA.  
**Archivo(s):** [ProtectedRoute.tsx:96](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/ProtectedRoute.tsx:96), [Layout.tsx:398](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/Layout.tsx:398), [CambiarPasswordDefault.tsx:20](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/CambiarPasswordDefault.tsx:20), [App.tsx:33](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/App.tsx:33).  
**Descripción:** el manual aparece para todos, pero /manual-usuario no está permitido para Psicólogo/Recepción. El cambio obligatorio usa toast fuera de Layout sin un Toaster propio o común. Algunas acciones clínicas se muestran a recepción pese a rechazo en servicios. La sesión y sus aliases se normalizan en más de un sitio.  
**Consecuencia:** redirecciones inesperadas, fallos de formulario sin aviso visible y acciones destinadas a fallar. Manipular localStorage puede cambiar la UI, pero no es por sí solo un bypass de la API.  
**Solución recomendada:** contrato de sesión y capacidades compartidas, Toaster en raíz, error accesible en formulario y pruebas de navegación por rol.

### F34. Formularios, modales y test público tienen barreras de accesibilidad

**Problema:** controles sin asociación semántica y diálogos gestionados solo por CSS.  
**Severidad:** MEDIA.  
**Archivo(s):** [CitaFormModal.tsx:348](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/CitaFormModal.tsx:348), [PacienteFormModal.tsx:484](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/pacientes/PacienteFormModal.tsx:484), [TestPublico.tsx:169](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/TestPublico.tsx:169), [index.html:2](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/index.html:2).  
**Descripción:** hay labels sin htmlFor/id, cierres con solo iconos y modales sin un ciclo explícito de foco y diálogo nativo. Las respuestas del test son botones cuya selección depende de clases de color, sin radio/fieldset o aria-pressed. El documento declara inglés para contenido español.  
**Consecuencia:** teclado y lectores de pantalla reciben información incompleta de nombre, selección, error o contexto del modal.  
**Solución recomendada:** controles semánticos, nombres accesibles, asociaciones, foco inicial/devolución/Escape y anuncios de estado. Comprobar con teclado y herramienta accesible en una fase de verificación visual; no se cuantificó contraste.

### F35. Componentes grandes, contratos duplicados y guardados parciales

**Problema:** reglas, presentación, normalización y orquestación se mezclan.  
**Severidad:** MEDIA.  
**Archivo(s):** [SesionModal.tsx](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/SesionModal.tsx:1), [PacienteFormModal.tsx](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/pacientes/PacienteFormModal.tsx:1), [CitaFormModal.tsx](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/CitaFormModal.tsx:1), [usePsicologos.ts:325](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/hooks/usePsicologos.ts:325), [configuracion.service.ts:5](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/configuracion.service.ts:5).  
**Descripción:** hay modales de 1.000, 889 y 878 líneas; testPsicologico.service tiene 800 y auth.service 726. Se repiten iconos, cédula/teléfono/fechas, aliases de campos y tipos de roles. Configuración usa any y ts-ignore para delegados. El hook guarda perfil y roles en dos HTTP independientes.  
**Consecuencia:** mayor probabilidad de deriva y cambios parciales: si falla el segundo HTTP, el perfil ya cambió y la creación puede dejar credenciales sin mostrar.  
**Solución recomendada:** corregir primero contratos y luego extraer reglas/controladores de formulario; DTO único, validadores compartidos e inyección de dependencias. Guardar perfil/roles atómicamente o exponer recuperación explícita de éxito parcial.

### F36. Faltan pruebas y barreras automáticas para flujos críticos

**Problema:** no existe una suite que detecte los fallos descritos antes de publicar.  
**Severidad:** MEDIA como deuda de calidad, con impacto alto en los módulos clínicos.  
**Archivo(s):** [package.json backend:7](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/package.json:7), [package.json frontend:6](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/package.json:6), [eslint.config.js](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/eslint.config.js:1), [CancelarCitaModal.tsx:109](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/citas/CancelarCitaModal.tsx:109), [TestAplicarModal.tsx:32](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/tests/TestAplicarModal.tsx:32), [TestHistorialPaciente.tsx:69](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/components/tests/TestHistorialPaciente.tsx:69).  
**Descripción:** npm test del backend es un marcador que falla; frontend no define test. No hay CI. ESLint detecta 3 errores —dos set-state-in-effect y una variable no usada— y 2 advertencias de dependencias de hooks. El schema de query de auditoría existe pero no está conectado a sus rutas.  
**Consecuencia:** compilación correcta se confunde con corrección funcional; errores de contrato y permisos llegan al código principal. No se puede calcular cobertura real porque no hay suite instrumentada.  
**Solución recomendada:** empezar por regresiones de seguridad, persistencia y concurrencia; integrar lint/typecheck/build/test y escaneo de dependencias en CI con datos sintéticos.

### F37. Documentación, código huérfano y recursos aumentan el coste de mantenimiento

**Problema:** hay referencias incompletas y cargas innecesarias.  
**Severidad:** BAJA.  
**Archivo(s):** [README.md](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/README.md:1), [README frontend](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/README.md:1), [Backups.tsx](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/pages/Backups.tsx:1), [api.ts:276](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/services/api.ts:276), [factura.controller.ts:35](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/controllers/factura.controller.ts:35), [App.tsx:6](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/src/App.tsx:6), [index.html:4](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-frontend/index.html:4).  
**Descripción:** Backups.tsx no está enrutada —el componente sí vive en Configuración—; toggleEstado apunta a una ruta inexistente y sin consumidores; getFacturaById está sin ruta. Hay utilidades de fecha/hora y recursos antiguos sin referencias. El logo pesa 2,30 MB y el favicon SVG propio 558 KB. App importa todas las páginas estáticamente y el bundle principal medido fue 1,47 MB minificado, 413 KB gzip.  
**Consecuencia:** documentación engañosa, superficie de mantenimiento mayor y carga inicial elevada.  
**Solución recomendada:** actualizar guía/contratos, retirar solo código cuya ausencia de uso se confirme, optimizar identidad visual y dividir por rutas. Revisar nodemon/ts-node como candidatos a retirada porque los scripts actuales usan tsx; no eliminarlos sin confirmar usos externos. Revisar también dependencias de build declaradas como runtime.

### F38. Consultar expediente o historial puede escribir datos

**Problema:** operaciones GET crean un expediente faltante.  
**Severidad:** MEDIA.  
**Archivo(s):** [paciente.service.ts:338](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:338), [paciente.service.ts:673](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/paciente.service.ts:673).  
**Descripción:** estas lecturas insertan expediente cuando falta. Dos consultas pueden competir contra la unicidad de ID_Paciente. El historial puede intentar crear para un paciente inexistente sin comprobarlo antes.  
**Consecuencia:** lectura con efectos secundarios y errores de unicidad/FK en consultas concurrentes o IDs inexistentes, con códigos HTTP poco precisos.  
**Solución recomendada:** crear expediente en alta o reparación explícita y atómica; GET debe devolver la situación existente con 404 cuando corresponde.

### F39. La integridad semántica excede las restricciones versionadas

**Problema:** las FK no garantizan todas las reglas de negocio del modelo.  
**Severidad:** MEDIA.  
**Archivo(s):** [schema.prisma:358](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:358), [schema.prisma:429](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:429), [schema.prisma:490](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/prisma/schema.prisma:490), [testPsicologico.schema.ts:11](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/schemas/testPsicologico.schema.ts:11), [testPsicologico.service.ts:204](C:/Users/kiana/source/repos/3T1-COM/II-SEM/BaseDeDatos/PsicologiaResilencia/clinica-backend/src/services/testPsicologico.service.ts:204).  
**Descripción:** no se impiden órdenes duplicados de preguntas/opciones, rangos solapados/huecos ni dos respuestas por aplicación/pregunta. Una FK a opción y otra a pregunta no garantiza por sí sola que pertenezcan entre sí. Tutor_PacienteMenor permite más de un contacto principal y la edición masiva de tutor puede colisionar con su PK compuesta. Hay nombres de catálogo y booleanos de estado anulables sin una semántica uniforme.  
**Consecuencia:** resultados ambiguos, fallos bajo cambios válidos en apariencia y significado incierto de NULL. No se afirma que esos datos existan en producción.  
**Solución recomendada:** constraints e índices únicos donde corresponda y reglas transaccionales para invariantes de varias filas; declarar semántica de NULL, fechas y subtipos. Conservar instrumentos aplicados de manera inmutable/versionada y validar rangos al publicarlos.

## G. Mejoras técnicas

| Área | Recomendación específica |
|---|---|
| Arquitectura | Mantener el monolito modular. Introducir cliente Prisma compartido, DTOs explícitos e inyección de dependencias; centralizar capacidades y errores. Separar reglas de dominio de HTTP y del JSX después de fijar los contratos. |
| Backend | Usar los datos parseados; validar fechas/horas, subtipos y tratamientos. Incorporar transiciones atómicas, idempotencia para operaciones de creación/reenvío y límites por propósito. Estabilizar contratos antes de exponer una API externa versionada. |
| Frontend | Esperar el resultado antes de cerrar, preservar borradores, descartar respuestas antiguas, centralizar sesión y catálogo, distinguir errores de vacíos. Carga diferida por rutas y componente modal accesible compartido. |
| Base de datos | Migraciones/seed reproducibles; códigos estables de catálogo; unicidad de respuestas y reservas según modelo; restricciones y reglas de rangos, contactos principales y estados. Evaluar NULL y tipos de texto en función de datos reales y collation. |
| Seguridad | Corregir F01–F04; proteger cambios de correo, revocar sesiones y guardar hash de recuperación. Proyección mínima por capacidad, límites públicos, errores sanitizados y auditoría de accesos/exportaciones. localStorage amplifica un eventual XSS: valorar sesiones HttpOnly según la topología, junto con los controles CSRF que ese cambio requeriría. |
| Rendimiento | Paginación/filtrado/proyección en servidor; endpoint acotado para agenda de hoy; separar los 17 catálogos de pacientes/profesionales; reutilizar consultas y medir índices. Optimizar logo/favicon y el bundle medido. No introducir Redis antes de corregir estas cargas. |
| Testing | Priorizar permisos, pérdida/mezcla de datos, contrato clínico, puntajes, concurrencia, fechas y finanzas. Base SQL Server de pruebas con datos sintéticos; ninguna suite debe apuntar por defecto al .env de trabajo real. |
| DevOps | Alinear build/start, URL y FRONTEND_URL; fijar versiones de Node/gestor, instalar desde locks y generar Prisma. CI con verificación de secretos y dependencias; health/readiness, cierre ordenado, despliegue de API persistente y scheduler controlado. Copia externa, restore probado y rollback de versión compatible con esquema. |
| Documentación | Reescribir instalación completa, variables sin valores secretos, roles/capacidades, contratos API, estados, política financiera y operación de backups. Corregir manual y README para describir lo implementado; registrar decisiones de zona horaria y tratamiento de datos. |

### Pruebas que faltan, con objetivo concreto

No se encontró cobertura automatizada para las siguientes áreas; esta lista es un plan de pruebas, no implementación realizada.

| Tipo | Casos prioritarios | Resultado que deben proteger |
|---|---|---|
| Unitarias de contratos | Payload real de sesión, múltiples tratamientos, adulto/menor/tutor, fechas y horas imposibles | Un contrato aceptado es utilizable; entradas inválidas se rechazan antes de persistir |
| Unitarias de tests | Opción ajena, ID omitido, Valor manipulado, pregunta duplicada/faltante, rangos y umbral crítico | Puntaje derivado del instrumento, no del cliente |
| Autorización de API | Administrador, Psicólogo, Recepción, sin roles, temporal, desactivado y token viejo | Backups y administración protegidos; proyecciones sin notas para recepción |
| Autorización por objeto | Profesional A frente a paciente, sesión y test de B; cambios de correo y especialidades | Una política clínica explícita y uniforme |
| Integración SQL Server | Alta completa, rollback, unicidad, FK, catálogos, historia sin expediente | Integridad y ausencia de registros parciales |
| Concurrencia | Dos reservas, dos respuestas, responder/anular, completar/cancelar, cambio simultáneo de administradores | Una transición válida; conflicto controlado e idempotencia |
| Autenticación | Expiración con reloj controlado, consumo doble, reset administrativo, revocación y cambio de roles | Un token retirado no conserva privilegios |
| Componentes | Guardar/cancelar con fallo de API; alta rápida; formularios y manual por rol | Datos conservados y estado visible correcto |
| Cargas fuera de orden | A→B en expediente y modal, filtros rápidos de auditoría/configuración | Una respuesta antigua no sustituye el contexto actual |
| E2E clínico | Login→paciente→cita→sesión→expediente→PDF y test público→resultado | Recorrido principal coherente |
| Financiera | NIO/USD si se admite, cambio de método/banco, cancelación y devolución | Importes y moneda trazables |
| Fechas y PDF | Medianoche UTC en Managua, receta/recibo, cumpleaños y cambio de día | Fecha civil estable y edades correctas |
| Accesibilidad | Teclado, foco de modal, selección de respuestas, labels y anuncios de error | Flujos utilizables sin depender del ratón/color |
| Operación | Checkout limpio, generación Prisma, inicio, health, restauración y rollback | Instalación y recuperación verificables |

### Matices de seguridad y rendimiento

No se confirmó SQL injection en las consultas ordinarias, XSS directo en la interfaz, SSRF en un endpoint propio, traversal de nombres de backup ni una fuga de memoria. Los nombres .bak tienen una lista de caracteres permitidos que impide separadores; el uso de startsWith como comprobación secundaria no basta para declarar traversal explotable aquí. Las bibliotecas con avisos sí requieren evaluación y actualización.

Tampoco se debe presentar cada include de Prisma como N+1. Lo confirmado es carga sin límite, sobreselección, 19 consultas iniciales de catálogos y falta de índices compuestos declarados para consultas importantes. Se necesita una base aislada y planes para cuantificar el impacto.

## H. Nuevas integraciones recomendadas

Las estimaciones suponen una persona familiarizada con el código y un entorno de pruebas ya preparado. Son esfuerzo técnico aproximado, no fechas de compromiso. Primero deben resolverse permisos, contratos, migraciones y despliegue.

### H1. Correo operativo fiable y avisos con bandeja de salida

**Integración:** extender el correo existente mediante un adaptador SMTP y una outbox persistente; usar un proveedor transaccional solo cuando se necesite operación con dominio y entrega monitorizada.  
**Objetivo:** recuperación fiable y recordatorios/confirmaciones de citas; aviso interno de un test que requiere revisión.  
**Beneficio:** aborda las inasistencias que hoy solo se marcan después y elimina envíos manuales de enlaces.  
**Complejidad:** MEDIA.  
**Prioridad:** ALTA después de estabilizar seguridad y agenda.  
**Implementación aproximada:** 3–6 días para primer flujo: servicio de correo, tabla outbox, job único con reintentos e idempotencia, plantillas, preferencias y registro de entrega. Se puede reutilizar Nodemailer actualizado y node-cron coordinado; no hace falta introducir Redis de inicio.  
**Dependencias:** canal de contacto de paciente/tutor y preferencias; los correos existentes son de cuentas internas. Validar destinatario responsable de menores. URLs públicas y estados de cita fiables.  
**Costos:** con SMTP existente, principalmente operación. Como referencia de alternativa investigada, SES publica una tarifa base de salida a demanda de USD 0,10/1.000 mensajes, más conceptos adicionales; no es una cotización completa ni obliga a migrar. [Precio oficial](https://aws.amazon.com/ses/pricing/).  
**Riesgos:** destinatario equivocado, mensajes duplicados, rebotes y revelación de datos clínicos. Enviar datos mínimos y un acceso autorizado, no notas diagnósticas.  
**Impacto arquitectónico:** la transacción crea el evento/outbox; un worker entrega fuera de la petición. Las fallas de correo no revierten ni duplican la cita.

### H2. Respaldo externo cifrado y recuperación comprobada

**Integración:** proceso de copia/backup de SQL Server a un destino externo privado y versionado, según la infraestructura escogida.  
**Objetivo:** recuperar ante pérdida de disco/host, borrado o error operativo.  
**Beneficio:** el backup actual vive en un directorio que la misma API puede borrar; una copia independiente cierra ese fallo de recuperación.  
**Complejidad:** MEDIA–ALTA.  
**Prioridad:** ALTA, antes de uso con datos reales.  
**Implementación aproximada:** 3–7 días más simulacro: topología, credenciales separadas, cifrado, retención, manifiesto con checksum, notificación de fallo y restauración en instancia aislada. Definir cuánto dato y tiempo de caída se acepta perder.  
**Dependencias:** corregir F01/F30, conocer edición/versión de SQL Server, volumen y permisos; elegir almacenamiento compatible y acceso de la cuenta del servicio SQL.  
**Costos:** almacenamiento por GB, retención, transferencias y operación; no se puede estimar total sin volumen/frecuencia. SQL Server documenta discos, recursos compartidos y Azure Blob como dispositivos posibles. [Opciones oficiales](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/backup-devices-sql-server?view=sql-server-ver17).  
**Riesgos:** exposición de la copia, claves perdidas, retención insuficiente y falsas verificaciones.  
**Impacto arquitectónico:** extraer el trabajo pesado y el borrado de la API clínica; la UI consulta estado y solicita trabajos autorizados.

### H3. Monitoreo operativo con registros y métricas sanitizados

**Integración:** logs estructurados y, si se requiere trazabilidad distribuida o un servicio gestionado, OpenTelemetry en Node.  
**Objetivo:** detectar errores de API, caída de BD, cola atrasada, jobs fallidos y backup antiguo.  
**Beneficio:** hoy muchos fallos se reducen a console.error o se muestran al usuario como listas vacías; no hay health/readiness ni alerta operativa.  
**Complejidad:** BAJA–MEDIA para lo básico.  
**Prioridad:** ALTA antes de producción.  
**Implementación aproximada:** 2–4 días para request ID, registro de latencias/códigos, error seguro, métricas de job y monitor de disponibilidad; ampliar a trazas solo si ayudan. OpenTelemetry ofrece instrumentación JavaScript/Node y exportadores. [Documentación oficial](https://opentelemetry.io/docs/languages/js/).  
**Dependencias:** contrato global de errores, endpoints de salud y despliegue conocido; librería de logging y, si se elige, SDK/collector/exportador de telemetría.  
**Costos:** almacenamiento/retención de logs, tráfico y posible plan gestionado; un colector propio también tiene coste operativo.  
**Riesgos:** exportar cuerpos clínicos, JWT o tokens públicos. Aplicar lista de datos permitidos y redacción antes de salir del proceso.  
**Impacto arquitectónico:** middleware y ciclo de vida comunes. La auditoría de accesos clínicos sigue siendo un registro de dominio aparte de la telemetría técnica.

### H4. Calendario externo, empezando por exportación ICS

**Integración:** archivo ICS de una cita como primer paso; Google Calendar u otro calendario solo si los profesionales lo utilizan.  
**Objetivo:** consultar la agenda desde el calendario habitual y recibir sus recordatorios.  
**Beneficio:** encaja en el flujo de citas; no requiere crear una aplicación móvil para cubrir esa necesidad inicial.  
**Complejidad:** BAJA para ICS, MEDIA–ALTA para sincronización.  
**Prioridad:** MEDIA, opcional.  
**Implementación aproximada:** 1–2 días para ICS; 4–8 días para conexión OAuth, crear/actualizar/anular y reconciliar un calendario. La API de Google permite crear eventos con inicio/fin y calendario autorizado. [Guía oficial](https://developers.google.com/workspace/calendar/api/guides/create-events).  
**Dependencias:** duración y zona horaria correctas, permisos de cuenta, SDK del proveedor solo si se integra, ID externo persistido, secretos/refresh tokens protegidos, reintentos e idempotencia.  
**Costos:** trabajo de mantenimiento, posible licencia del proveedor y cuotas aplicables; ICS no añade un servicio.  
**Riesgos:** duplicados, conflictos y nombres/motivos clínicos en calendarios compartidos. Usar títulos neutros y considerar el sistema como autoridad de reserva.  
**Impacto arquitectónico:** adaptador y outbox; no llamar al proveedor dentro de la transacción clínica.

### H5. Identidad externa OIDC si existe una organización proveedora

**Integración:** inicio de sesión con el proveedor institucional que la clínica ya tenga.  
**Objetivo:** centralizar alta/baja y políticas de autenticación, por ejemplo MFA institucional.  
**Beneficio:** reduce recuperación local y administración de contraseñas si ya hay un directorio. No hay evidencia de que esa infraestructura exista; por eso es condicional.  
**Complejidad:** MEDIA–ALTA.  
**Prioridad:** BAJA/condicional; corregir autenticación local tiene prioridad.  
**Implementación aproximada:** 4–8 días para flujo de código autorizado, validación de emisor/audiencia, vinculación por identificador estable del proveedor, logout y recuperación administrativa. OIDC es la capa de identidad sobre OAuth; OAuth por sí solo no define el login del usuario. [Especificación oficial](https://openid.net/specs/openid-connect-core-1_0.html).  
**Dependencias:** tenant y políticas disponibles, cliente OIDC mantenido, callbacks HTTPS, gestión de secretos y cuenta de emergencia controlada.  
**Costos:** licencia/plan del proveedor y operación; no se seleccionó uno ni se presupone gratuidad.  
**Riesgos:** vinculación errónea de cuentas por correo y asignación automática de privilegios.  
**Impacto arquitectónico:** tabla de identidad externa y adaptación del login; roles clínicos y autorización por objeto permanecen en la aplicación.

### Integraciones que no se justifican ahora

- **Pagos en línea:** primero definir deuda, recibo, cancelación y devolución; el código actual solo registra cobro manual. Añadir una pasarela no corrige esa semántica.
- **Mapas/geolocalización:** no se encontró un flujo de visitas, rutas o sucursales que lo necesite.
- **Redis/colas complejas/buscador externo:** paginación, índices, catálogos y coordinación básica resuelven problemas observados sin esa infraestructura.
- **Servicio externo de generación PDF:** el proyecto ya produce recibos, recetas y expedientes en navegador. Deben corregirse datos y formato.
- **Analítica de producto sobre expedientes:** no se demostró una necesidad que justifique enviar datos a terceros; los indicadores operativos pueden calcularse con la BD.
- **IA clínica:** no hay una necesidad concreta que deba anteponerse a integridad, permisos y revisión profesional. Un eventual apoyo administrativo requeriría un caso de uso delimitado y evaluación propia.
- **Aplicación móvil dedicada:** navegación adaptable y enlaces/ICS cubren primero los recorridos existentes. Un portal móvil puede valorarse cuando se definan permisos y demanda.

## I. Nuevas funcionalidades recomendadas

### Necesarias para completar los recorridos existentes

1. **Sesión clínica con borrador, recuperación y confirmación de persistencia.** Conservar notas frente a error/cierre; guardar todos los tratamientos y vincular tests a la consulta. Una sesión finalizada debe poder corregirse mediante una enmienda identificada.
2. **Matriz de permisos y administración de acceso completa.** Alta/baja, revocación de sesiones, cambio seguro de correo y separación de acceso administrativo/clínico; la pantalla debe reflejar la misma capacidad del servidor.
3. **Bandeja de revisión de tests.** Pendientes, vencidos, completados y respuestas críticas, responsable asignado y acuse de revisión. Actualmente se guarda TieneAlertaCritica y un evento, pero no un circuito de atención.
4. **Gestión administrativa de instrumentos.** La API crea instrumentos y cambia estado, pero /tests es principalmente consulta. Añadir creación/importación validada, vista previa, rangos comprobados y versiones inmutables después de aplicar.
5. **Reglas de agenda completas.** Duración, intervalos, horario del profesional, indisponibilidad, reprogramación coherente y protección de la historia ya registrada.
6. **Operación de recuperación visible.** Último backup correcto, antigüedad, resultado de copia externa y fecha de restauración ensayada. El éxito de VERIFYONLY debe mostrarse con su alcance real.

### Mejoras importantes

- **Política financiera explícita.** Si se permite reservar sin pagar, modelar pendiente/pagado/parcial/anulado/devuelto; distinguir ingresos cobrados de sesiones atendidas. Si la clínica opera solo NIO, hacerlo explícito y no ofrecer multimoneda incompleta.
- **Preferencias de contacto y tutor responsable.** Canal, verificación, destinatario para menores y autorización para avisos; facilita recordatorios sin inventar correos inexistentes.
- **Auditoría de lectura y exportación.** Quién abrió un expediente o descargó documentos/respaldos y por qué capacidad; no copiar innecesariamente notas clínicas en cada evento.
- **Reportes por identificador y periodo.** Evitar contar homónimos como una sola persona; Historial calcula únicos por nombre. Corregir edad según cumpleaños, pues GeneralService usa diferencia de años.
- **Actualización visible y reintento.** Recargar test al recuperar foco, mostrar “última actualización” y distinguir fallos de una respuesta legítimamente vacía.

### Métricas útiles fundamentadas en datos existentes

| Métrica | Utilidad y precaución |
|---|---|
| Programadas, realizadas, canceladas e inasistencias por periodo/profesional | Medir capacidad; exige estados coherentes y denominador explícito |
| Tiempo hasta próxima cita y demora de atención | Requiere fechas/horas y duración normalizadas |
| Duración de sesión | Útil tras corregir inicio/final y conservación del reloj frente a errores |
| Ingreso cobrado, anulado y devuelto por moneda | Necesita política financiera; no sumar divisas directamente |
| Tests pendientes/vencidos y tiempo hasta revisión | Aprovecha aplicación, eventos y alertas; requiere acuse |
| Evolución de un instrumento por paciente | Comparar misma versión y contexto, con revisión profesional; no presentar diagnóstico automático |
| Latencia/error de API, antigüedad de backup y jobs fallidos | Distinguir salud técnica de indicadores clínicos |

### Funcionalidades opcionales

- Importar pacientes/tutores desde CSV con previsualización, detección de duplicados, validación y modo de prueba.
- Exportaciones filtradas y autorizadas; jsPDF ya cubre documentos, CSV puede cubrir trabajo administrativo.
- Historial de consentimientos/documentos si la clínica necesita conservar originales. Antes de añadir archivos: almacenamiento privado, límites/tipos, análisis, acceso por objeto y trazabilidad.
- Lista de espera y confirmación de asistencia, si el volumen de agenda lo requiere.
- Exportación ICS y recordatorios optativos de citas.

### Ideas futuras

Portal limitado de paciente/tutor para confirmar citas y responder instrumentos, sin heredar los privilegios del panel interno; varias sedes/organizaciones solo si aparece esa necesidad; integración con el directorio institucional existente. Una separación por servicios o una aplicación móvil no es requisito para mejorar el estado actual.

## J. Deuda técnica

| Deuda | Por qué puede agravarse |
|---|---|
| Contratos en tres capas más aliases | Un cambio exige sincronizar Zod, normalizadores/controladores, interfaces/hooks y PDF; ya produjo pérdida de expediente y tipo de terapia |
| Permisos en rutas, servicios, ProtectedRoute y Layout | Una nueva pantalla puede aparentar seguridad mientras la API conserva accesos amplios |
| Identificadores mágicos y BD manual | Cada instalación o cambio de catálogo puede cambiar el significado de un número |
| Cliente Prisma por módulo | El número de conexiones escala con servicios y réplicas y complica sustituir persistencia en pruebas |
| Modales de 750–1.000 líneas | Validación, estado y side effects quedan difíciles de probar y revisar |
| Fechas e instantes indistinguibles | Aumentan errores de expiración, recibos, agenda y métricas con cambios de zona |
| Guardados de perfil/roles en varios HTTP | No hay una unidad de trabajo de negocio y el usuario puede reintentar sobre un éxito parcial |
| Sin contrato de estados financiero/clínico | Se acumulan excepciones de cancelación, edición, devolución y corrección |
| Sin migraciones, CI o suite | La fiabilidad depende de la memoria del desarrollador y de datos locales |
| Scheduler y backup ligados al proceso web | Un despliegue con varias réplicas o máquinas cambia silenciosamente el comportamiento |
| Históricos sin política de versiones | Cambiar definiciones de instrumentos, catálogos o reglas puede alterar la interpretación de datos ya registrados |
| Artefactos compilados ignorados junto a fuente | Facilitan confusión sobre qué se ejecuta; Prisma validate cargó prisma.config.js local |
| Código/modelos huérfanos | AuditoriaCita, alergias/observaciones generales y sysdiagrams tienen presencia sin un flujo de producto completo; documentar intención antes de borrar |

## K. Plan de mejora

**Prioridad:** P0 = antes de exposición/uso clínico; P1 = estabilidad necesaria; P2 = mejora importante; P3 = opcional.  
**Dificultad:** baja, media o alta respecto al código actual. Las fases indican orden lógico; las tareas de infraestructura de pruebas pueden adelantarse para comprobar una corrección.

### Fase 1 — Contención y problemas críticos

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Restringir backup y auditar descarga/borrado | P0 | Media | Rutas, controlador y servicio de backups; middleware auth; F01/F31 | Ninguna; requiere pruebas por rol |
| Cerrar administración de psicólogos y cambios de identidad | P0 | Media–alta | Rutas/controlador/servicio de psicólogos; auth; F02 | Matriz de capacidades explícita |
| Proyectar datos mínimos de agenda por rol | P0 | Media | Servicio de citas, DTO y consumidores; F03 | Matriz de capacidades |
| Actualizar el parser vulnerable y revisar dependencias expuestas | P0 | Media | Manifiestos/locks, index.ts y pruebas de HTTP; F16 | Entorno de verificación aislado |
| Revisar el bootstrap administrativo sin ejecutarlo contra datos reales | P0 | Baja–media | crearAdmin.ts y semillas; F18 | Preparación del seed de roles |

**Criterio de salida:** recepción y usuarios temporales no alcanzan backups/administración ni reciben notas; regresiones negativas y controles positivos.

### Fase 2 — Seguridad y estabilidad del núcleo clínico

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Unificar payload de sesión y esperar confirmación | P0 | Media | SesionModal, Citas, schema/controlador de sesión; F05/F06 | Contrato de creación acordado |
| Guardar todos los tratamientos y conservar borrador | P0 | Media–alta | Modal, DTO, schema y servicio de sesiones; F07 | Contrato anterior |
| Evitar mezcla de pacientes y respuestas antiguas | P0 | Media | HistorialModal, usePacienteDetalle y hooks de carga; F08 | Identidad de consulta/paciente estable |
| Derivar puntajes y proteger estados del test | P0 | Alta | Schema/servicio de tests y restricción TestRespuesta; F09/F10 | Migración reproducible para nueva unicidad |
| Reservas y transiciones clínicas atómicas | P1 | Alta | Servicios cita/sesión, esquema y cron; F11/F12 | Definir duración y estados; migraciones |
| UTC, hash y consumo de recuperación; revocar sesiones | P0 | Media–alta | AuthService, middleware, Usuario y rutas protegidas; F04/F13 | Migración de sesión/token y política común |

**Criterio de salida:** consulta y test se guardan una sola vez; un fallo conserva notas; cambiar de paciente no mezcla datos; revocación y expiración tienen pruebas.

### Fase 3 — Arquitectura, calidad y ejecución reproducible

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Línea base SQL, migraciones y catálogos por código | P0 | Alta | Prisma, seed y servicios con IDs mágicos; F17/F39 | Inspección autorizada del esquema real y copia aislada |
| Alinear build/start y variables de frontend/backend | P0 | Baja–media | package/tsconfig backend, api.ts, configuración y README; F14/F15 | Topología y URL de despliegue elegidas |
| Cliente Prisma, DTO validado y errores comunes | P1 | Media | Servicios, validator, controladores y contrato API; F19/F20/F29/F32 | Contratos funcionales estabilizados |
| Suite crítica y CI con locks | P1 | Media–alta | Pruebas nuevas, scripts y workflow; F36 | BD sintética y baseline; puede comenzar en Fase 1 con mocks |
| Armonizar perfil/roles, DTO de historial y permisos de UI | P1 | Media | Psicólogos, expediente, hooks, Layout/ProtectedRoute; F24/F33/F35 | Autorización corregida |
| Corregir manual, setup y operación | P1 | Baja–media | README, manual y documentación de despliegue | Decisiones de fases anteriores |

### Fase 4 — Rendimiento y operación

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Paginar, filtrar, limitar proyecciones e indexar | P1 | Media–alta | Listados/servicios, hooks y migraciones; F28 | Datos sintéticos de volumen y planes |
| Compartir e invalidar catálogos y corregir alta rápida | P2 | Media | useCitas/usePacientes y formularios; F27 | Contratos de listados estables |
| Coordinar scheduler y acotar pendientes vencidas | P1 | Media | Scheduler, CitaService y ciclo de aplicación; F29 | Topología de despliegue |
| Dividir rutas y optimizar recursos gráficos | P2 | Baja–media | App, imports PDF/gráficos y assets; F37 | Medición de bundle como referencia |
| Health, logs seguros y estado de trabajos | P1 | Media | Arranque, errores, jobs y operación | API/errores comunes y permisos |
| Backup externo y simulacro de restore | P1 | Media–alta | Servicio/job y almacenamiento; F30/H2 | Fase 1 y acceso aislado a SQL Server |

### Fase 5 — Funcionalidades y experiencia

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Sesión borrador y vínculo de tests | P1 | Media–alta | Sesiones/tests, modales y esquema; F22 | Fase 2 y estados definidos |
| Bandeja de revisión y versiones de instrumentos | P1 | Media–alta | Tests, resultados, eventos y UI | Integridad de puntajes/transiciones |
| Política de cobro, monedas y correcciones | P1 | Alta si multimoneda/pagos parciales | Citas, Recibo, dashboard y PDF; F21 | Decisión funcional y migraciones |
| Formularios, municipios, errores y accesibilidad | P1–P2 | Media | Paciente/tutor/cita, modales y test público; F20/F23/F26/F34 | Contratos validados |
| Métricas por IDs, cumpleaños y periodos | P2 | Media | Historial, GeneralService y dashboard | Datos/estados financieros y clínicos confiables |

### Fase 6 — Integraciones justificadas

| Tarea | Prioridad | Dificultad | Archivos/módulos afectados | Dependencias |
|---|---|---|---|---|
| Outbox, correo de citas y alertas internas | P1 | Media | Correo, jobs, contactos, citas y tests; H1 | Seguridad, preferencias y estados fiables |
| Ampliar monitoreo si el despliegue lo requiere | P2 | Media | Instrumentación/collector; H3 | Logs sanitizados y health básicos |
| ICS y, si se usa, calendario OAuth | P2–P3 | Baja a alta | Agenda, exportador y adaptador; H4 | Intervalos, zona, outbox |
| OIDC institucional | P3 | Media–alta | Auth e identidades externas; H5 | Proveedor realmente existente y política de vinculación |
| Archivos o portal de pacientes, si se validan sus usos | P3 | Alta | Módulos nuevos y permisos por objeto | Autorización, auditoría y operación consolidadas |

## L. Top 10 de mejoras por impacto

1. **Cerrar el acceso a respaldos completos** y separar generación, descarga y borrado de los permisos ordinarios —F01.
2. **Corregir administración de psicólogos y cambios de correo**, con autorización por rol/objeto y protección de identidad —F02.
3. **Eliminar la exposición de notas a recepción** y probar respuestas de todos los endpoints por capacidad —F03.
4. **Actualizar el camino vulnerable de Express/body-parser** y establecer revisión de dependencias según su uso real —F16.
5. **Hacer fiable el guardado clínico completo:** contrato válido, espera, borrador, todos los tratamientos y protección contra mezcla de pacientes —F05–F08.
6. **Corregir recuperación y ciclo de sesión:** UTC, hash, consumo único, revocación y contraseña temporal uniforme —F04/F13.
7. **Asegurar cálculo y consumo de tests**, derivando opciones en servidor y haciendo atómicas las transiciones —F09/F10.
8. **Proteger reserva y estados de cita/sesión** para evitar dobles reservas e historias contradictorias —F11/F12.
9. **Hacer reproducible instalación y despliegue:** baseline SQL/seed, build/start y URL de API por entorno —F14/F15/F17/F18.
10. **Añadir regresiones y CI para esos flujos**, con BD sintética, verificación por rol, concurrencia y fechas; acompañarlas de errores visibles y monitoreo básico —F26/F32/F36/H3.

No se aplicó ninguna de estas mejoras. Las estimaciones, fases y dependencias anteriores constituyen el plan para revisión, no una autorización inferida para implementarlo.


## Anexo — Evidencia y límites de ejecución

- La comprobación de rutas sustituyó servicios por funciones que devolvían resultados simulados: no abrió conexiones SQL, generó archivos .bak, eliminó backups, envió mensajes ni expuso un servidor a la red.
- Se probó una cuenta Recepción: listar backups 200; generar 201; eliminar 200; crear catálogo 201; actualizar correo de profesional ajeno 200. El control positivo de autorización de auditoría devolvió 403 para ese mismo rol.
- Una cuenta que requiere cambio de contraseña obtuvo 201 en generación simulada de backup.
- El token expirado devolvió 403, reproduciendo la discordancia con el cliente.
- El payload clínico con expediente 0 fue rechazado; el schema público aceptó un Valor arbitrario sin opción; el schema de cita aceptó fecha no interpretable y hora 25:99.
- En America/Managua, la comparación actual de reset seguía aceptando un token después de su expiración nominal y una fecha civil de 1 de noviembre se mostraba el 31 de octubre.
- El build frontend emitió 958 módulos; chunk principal 1.472,84 KB (413,15 KB gzip), CSS 126,76 KB y logo 2.299,39 KB. Se observaron advertencias de tamaño, datos Browserslist/Baseline antiguos y optimización de CSS.
- El análisis de secretos no mostró valores de archivos locales. La contraseña fija del bootstrap se identifica por archivo/línea y debe revisarse si se usó; no se probó contra ninguna cuenta.
- Los contadores de tokens de los fragmentos de grafo no están medidos. Los ceros del generador son marcadores y no se usan como evidencia de coste o calidad.
- Las métricas de líneas incluyen líneas vacías; no se interpreta el tamaño por sí solo como un fallo, sino junto con responsabilidades mezcladas observadas.

**Evidencia complementaria fuera del repositorio:**

- [Resultado de ESLint](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/eslint.json).
- [Auditoría completa de dependencias frontend](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/frontend_audit_json.json).
- [Auditoría de dependencias frontend omitiendo dev](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/frontend_audit_prod_json.json).
- [Auditoría completa de dependencias backend](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/backend_audit_json.json).
- [Auditoría de dependencias backend de producción](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/backend_audit_prod_json.json).
- [Inventario versionado con hashes](C:/Users/kiana/.codex/visualizations/2026/11/01/01a19849-74a1-7832-b58c-843d788b9811/audit-temp/inventario-auditoria.json).

