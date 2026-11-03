# Hito 2 - Registro completo y fiable de consultas clínicas

Estado: criterios del Hito 2 validados en SQL Server 2022.

Verificación inicial: 2026-11-02. Cierre de pruebas frontend: 2026-11-03. Base: `65f19c2`, rama `kelvin`.
Al iniciar no había cambios locales ni commits posteriores a esa base. No se
modificaron la auditoría de referencia ni `docs/hito-1-seguridad.md`.
No se encontró un `AGENTS.md` aplicable en el repositorio o sus directorios padre.

## Ajuste de cierre (2026-11-03)

Se corrigió únicamente la dependencia temporal de `tests/clinica.test.mjs`.
Las pruebas de terapias y fármaco ahora introducen explícitamente
`FechaInicio = 2026-11-01`, antes de sus fechas finales de diciembre de 2026;
ninguna depende del valor predeterminado de inicio del día de ejecución.
Se comprueba además que los tres inicios enviados en el payload sean los esperados.

La validación del producto se conserva. Una nueva regresión del formulario real
rechaza una fecha final `2026-10-31` anterior al inicio, impide agregar/guardar esa
indicación, conserva el dato y permite corregirlo a `2026-12-01` y guardar.
No se modificó código del sistema para aceptar fechas inválidas.

Se incorporó el reloj opcional `HITO2_TEST_NOW` solo en la suite: `mock.timers`
controla `Date` y se restaura tras cada prueba. Se ejecutó la suite completa con
el reloj real y también con `2027-07-15T15:00:00.000Z`.

| Comprobación ejecutada el 2026-11-03 | Resultado |
|---|---|
| Frontend `npm test`, reloj real | 14/14; cero fallos, omisiones o cancelaciones. |
| Frontend `npm test`, reloj controlado en 2027 | Las mismas 14/14; cero fallos, omisiones o cancelaciones. |
| `npm run typecheck` | Correcto, código de salida 0. |
| `npm run build` | Correcto, código de salida 0; conserva avisos anteriores de bundle/CSS/compatibilidad. |
| `npm run lint` | Código de salida 1 por los mismos 2 errores y 1 advertencia preexistentes; ninguna incidencia nueva. |
| `node --check tests/clinica.test.mjs` y `git diff --check` | Correctos. |

Los 14 casos son una misma suite ejecutada dos veces, no 28 casos distintos.
Los resultados detallados están en `hito-2-verificacion.json`, sección `cierre`.
La evidencia anterior completa se conserva en `verificacion_anterior`, fechada
2026-11-02: **backend 132/132 y SQL Server real 29/29 no se reejecutaron en este
ajuste**. Tampoco se repitieron la revisión visual de PDF con Poppler ni la
verificación de locks. Las pruebas actuales sí vuelven a generar y comprobar
los PDF en memoria como parte de la suite frontend.

Para repetir la comprobación del año futuro en PowerShell, desde frontend:

~~~powershell
$env:HITO2_TEST_NOW = '2027-07-15T15:00:00.000Z'
npm test
Remove-Item Env:HITO2_TEST_NOW
~~~

F15 y las tres incidencias de lint detalladas en la verificación anterior
permanecen pendientes. El commit de cierre autorizado incorpora exclusivamente
los 39 archivos del inventario del Hito 2. No incluye `.env` ni credenciales.
No se realiza push. Su hash se obtiene del historial Git del commit que incluye
esta documentación; no se inserta un hash autorreferencial en el propio archivo.

## Contraste con la auditoría

| Hallazgo | Estado encontrado en la base | Intervención |
|---|---|---|
| F05 | El esquema ya aceptaba cero; la afirmación de que siempre falla había quedado desactualizada. Persistía un contrato duplicado y poco preciso. | Frontend omite expediente automático. DTO validado con paciente y profesional esperados; comprobación transaccional. |
| F06 | `Citas.handleFinalizarSesion` ya esperaba la API. El modal aún reiniciaba notas al abrirse y cancelación cerraba anticipadamente. | Cadena única de promesas, borrador en memoria, error recuperable y bloqueo de envíos repetidos. |
| F07 | Solo se enviaba/persistía el primer tratamiento; `FechaFin` no se guardaba. | Colección discriminada y persistencia completa en una transacción. |
| F08 | Cargas de historial/detalle sin cancelación ni comprobación del paciente vigente. | Un único hook de carga, cancelación, descarte de respuestas tardías y comprobación antes de publicar/exportar. |
| F19 | `validateSchema` descartaba el resultado parseado. | Lo conserva en `res.locals.validated`; sesiones consume ese DTO tipado. No se reemplaza `req.query` de Express 5. |
| F24 | El hook descartaba metadatos del expediente; las proyecciones perdían campos y había varios nombres para la terapia. | Sobre explícito, proyección clínica compartida y transporte completo hasta ambos PDF. |
| Alias de autenticación | El commit base ya sincronizaba `req.user` y `req.usuario`, también tras consultar cuenta vigente. | Se conserva y prueba expresamente; no se reimplementa. |

## Implementación y recorrido

1. `SesionModal` construye el payload mediante `crearPayloadSesion`, sin seleccionar
   un tratamiento principal. Incluye paciente/profesional esperados y todas las
   exploraciones e indicaciones.
2. `Citas` delega en `useCitas.guardarSesion`. Toda la cadena espera la misma
   operación HTTP. El modal conserva datos y muestra un mensaje si se rechaza.
   `guardando` se comprueba también de forma síncrona en el almacén de borradores.
3. Las rutas de sesiones y pacientes reutilizan autenticación, cuenta vigente y
   bloqueo por contraseña temporal del Hito 1. El historial general aplica esos
   controles a su ruta clínica. Los permisos se recalculan desde la cuenta.
4. El controlador consume el resultado Zod, incluidas coerciones, `trim`, valores
   predeterminados y deduplicación de exploraciones. No vuelve a normalizar un
   segundo DTO incompatible.
5. El servicio comprueba autorización por profesional, referencias esperadas,
   expediente explícito si se recibió, estado de la cita y catálogos. La consulta
   inicial y todas las escrituras están dentro de una transacción `Serializable`.
6. La transición condicional de cita pendiente a realizada adquiere el bloqueo
   sobre la cita. En esa misma transacción se obtiene/crea el expediente, se crea
   la sesión, cada tratamiento con su subtipo y las exploraciones. Cualquier error
   revierte también expediente y estado de la cita.
7. La lectura de expediente e historial comparte la misma respuesta. No crea
   expedientes como efecto secundario de un GET. Una consulta nueva crea el
   expediente al guardar cuando aún no existe.
8. `usePacienteDetalle` conserva el sobre completo, aborta la petición anterior y
   usa una bandera de vigencia. Oculta datos anteriores desde el primer render al
   cambiar de ID, incluso antes de ejecutar el nuevo efecto. HistorialModal usa
   ese mismo hook y no combina dos respuestas con un fallback independiente.
9. `prepararPDFExpediente` y `prepararPDFReceta` comprueban paciente, expediente,
   citas y sesiones. Los encabezados proceden de la respuesta vigente. La receta
   recibe un ID de sesión perteneciente a ese historial, nunca una sesión suelta
   combinada con el nombre de otra cita.

Se mantiene la arquitectura router -> middleware -> controlador -> servicio ->
Prisma. Las selecciones compartidas están en `sesion.projection.ts`. Los módulos
intervenidos y auditoría reutilizan el cliente Prisma del Hito 1; no se refactoriza
el resto de servicios.

## Contrato de creación

`POST /api/sesiones`, JSON, JWT y cuenta vigente. Administrador o Psicólogo
asignado a la cita. Recepción no registra consultas clínicas.

~~~json
{
  "ID_Cita": 40,
  "ID_Paciente": 205,
  "ID_Psicologo": 10,
  "HoraDeInicio": "2026-11-02T15:00:00.000Z",
  "Observaciones": "Notas sintéticas",
  "DiagnosticoDiferencial": "Diagnóstico sintético",
  "HistorialDeEvolucion": "Evolución sintética",
  "Criterios_DeDiagnostico": "DSM-5",
  "ExploracionesIds": [1, 2],
  "Tratamientos": [
    {
      "Tipo": "terapeutico",
      "Frecuencia": "Semanal",
      "FechaInicio": "2026-11-02",
      "FechaFin": "2026-12-02",
      "Terapeutico": { "ID_Tipo_Terapia": 1, "Objetivo": "Objetivo uno" }
    },
    {
      "Tipo": "terapeutico",
      "Frecuencia": "Diaria",
      "FechaInicio": "2026-11-02",
      "FechaFin": "2026-12-03",
      "Terapeutico": { "ID_Tipo_Terapia": 2, "Objetivo": "Objetivo dos" }
    },
    {
      "Tipo": "farmaceutico",
      "Frecuencia": "Según indicación profesional",
      "FechaInicio": "2026-11-02",
      "FechaFin": "2026-12-04",
      "Farmaceutico": {
        "ID_ViaAdministracion": 1,
        "Nombre_Medicamento": "Medicamento sintético de prueba",
        "Dosis": "Dosis sintética de prueba"
      }
    }
  ]
}
~~~

- Los tres IDs de cita/paciente/profesional son enteros positivos. El servidor
  contrasta todos con la cita; el paciente no se deduce de un encabezado de UI.
- `ID_Expediente` es opcional y positivo. Omitirlo para resolución automática;
  cero deja de ser parte del contrato. Un expediente ajeno se rechaza, sin
  sustituirlo silenciosamente por otro.
- `HoraDeInicio` es un instante ISO con zona. La hora final la obtiene el servidor;
  no se admite una `HoraFinal` enviada por el cliente. Los campos SQL TIME guardan
  el reloj de `America/Managua` sobre fecha base UTC. Las fechas DATE de
  tratamientos y cita se conservan como fechas de calendario, sin restar un día
  al generar la receta.
- Diagnóstico y criterios son obligatorios y no admiten solo espacios. Notas y
  evolución admiten vacío. Sus límites son 50.000 caracteres por campo.
- `Tratamientos` admite de cero a 100 elementos. Terapia exige objetivo y tipo;
  fármaco exige nombre, dosis y vía. Ambos exigen frecuencia (máximo 100), fecha
  inicial válida y fecha final opcional no anterior al inicio. No se admite
  mezclar subtipos ni un objeto `Tratamiento` singular obsoleto.
- Exploraciones: máximo 100 IDs positivos, sin duplicación tras validar.
- Se conserva el límite HTTP global de 100 KB del Hito 1.

Respuesta: sesión con `ID_Sesion`, `ID_Cita`, `ID_Expediente`, horas, cuatro campos
clínicos, `Expediente`, `Tratamiento[]`, exploraciones y `creada`.
El nombre **de entrada** es `Tratamientos`; el nombre **de lectura** conserva la
relación Prisma `Tratamiento[]`. Los tipos de ambos lados y el constructor del
formulario declaran esa distinción explícitamente.

| Resultado | HTTP | Comportamiento |
|---|---|---|
| Primera persistencia confirmada | 201, `creada: true` | Cerrar y retirar borrador. |
| Reenvío idéntico ya confirmado | 200, `creada: false` | Misma sesión, sin agregar tratamientos. |
| Otro contenido para una cita atendida | 409 | No sobrescribir; conservar borrador para revisión. |
| Cita/referencias/estado cambiados | 409 | Rechazar toda la operación y conservar datos. |
| Esquema/catálogo inválido | 400 | No persistir parcialmente. |
| Sin autenticación/cuenta inactiva | 401 | Rechazo previo a datos clínicos. |
| Rol ajeno/cambio obligatorio | 403 | Rechazo previo a la operación. |
| Fallo inesperado de persistencia | 500 | Mensaje controlado sin consulta SQL ni notas. |

La idempotencia utiliza la relación única existente `Sesion.ID_Cita`. Un reenvío
se compara con el contenido persistido: hora inicial, cuatro textos, tratamientos
completos y exploraciones, sin depender del orden del JSON o de la colección.
No hay actualización silenciosa de una sesión finalizada. Se reintentan hasta
3 veces los conflictos Prisma P2034/P2002, con pausa breve; después se responde
409. Plazo de la transacción: 20 s; espera de inicio: 10 s.

Una cita nueva debe estar pendiente (ID 1), con paciente y profesional activos.
La transición final es realizada (ID 2). Cancelada y no procesada no admiten
registro nuevo. Una sesión existente solo se confirma como reintento si sigue
siendo coherente. La edición general no reasigna paciente/profesional ni cambia
el estado de una cita atendida. Edición y cancelación añaden condiciones SQL para
que una sesión creada concurrentemente no quede reasignada o cancelada después.

## Borradores y errores

El borrador permanece exclusivamente en memoria de la pestaña. Su clave incluye
sesión autenticada, paciente, cita y referencia al profesional. Conserva notas,
tratamientos agregados y en edición, exploraciones y hora de inicio. Cambiar de
pantalla o de cita no lo elimina. Cerrar voluntariamente un modal con cambios
requiere confirmar el descarte. Guardar o descartar retira ese borrador.

Logout, nuevo login, expiración autenticada y cambio de token limpian o separan
el almacén. No se escriben notas clínicas en localStorage/sessionStorage. Como
requiere el alcance, no hay persistencia duradera del borrador: recargar/cerrar
la pestaña termina esa memoria. El error de API no cierra ni limpia el formulario.

Cancelar cita también espera su promesa, bloquea envíos simultáneos y mantiene
motivo y notas ante un rechazo. Solo limpia/cierra tras confirmación del servidor.

## Historial, expediente y PDF

Los GET `/api/pacientes/:id/expediente` y `/:id/historial` devuelven el mismo sobre:

~~~typescript
{
  paciente: PacienteDetalle;
  expediente: { ID_Expediente; ID_Paciente; No_Expediente; FechaIngreso } | null;
  citas: CitaExpediente[];
  sesiones: SesionExpediente[];
}
~~~

Cada sesión incluye ID de paciente y profesional, cita, expediente, fecha de cita,
profesional resumido, exploraciones y tratamientos. Cada tratamiento conserva ID,
firmante, frecuencia, fechas inicial/final y su subtipo completo. Se utiliza
`Tratamiento_Terapeutico.TipoDe_Terapia.Nombre_De_Terapia` y
`Tratamiento_Farmaceutico.ViaAdministracion.Nombre_De_Presentacion` en API, tipos,
componentes y PDF. No hay normalizador que reduzca esos objetos a solo objetivo.

Un expediente sin sesiones conserva su número en pantalla y PDF. Si un paciente
legado no tiene expediente, el sobre indica `null`, sin inventar ni crear uno al
leer. Los datos legados con sesión/expediente de otro paciente se rechazan para
consulta clínica; no se reparan cambiando la atribución del registro.

Recepción recibe datos administrativos y sesiones vacías; no se selecciona el
motivo clínico en sus citas de expediente. Psicólogo recibe solo sus consultas;
Administrador puede consultar todas. Los roles combinados no amplían el acceso
clínico a consultas de otros profesionales. El historial general conserva sus
permisos clínicos y ahora usa cuenta vigente y tratamientos completos.

Los PDF incluyen número de expediente, nombre vigente, tipos de terapia,
objetivos, fármacos, dosis, vía, frecuencia y fechas. El expediente completo
conserva además observaciones, diagnóstico, evolución, criterios y exploraciones.
Se ajustó el ancho de la tabla demográfica y el espacio de firma de la receta.
Se renderizaron e inspeccionaron muestras sintéticas con Poppler mediante la
skill `pdf`; se comprobaron también documentos de varias páginas.

## Verificación anterior (2026-11-02)

Evidencia inicial y comparación histórica de lint: `hito-2-verificacion.json`,
sección `verificacion_anterior`. Esta tabla corresponde al 2026-11-02; las
ejecuciones nuevas del cierre se describen al inicio del documento.
Inventario del cambio: `archivos-afectados-hito-2.json`.

| Comprobación | Resultado |
|---|---|
| Backend `pnpm run typecheck` | Correcto. |
| Backend `pnpm run build` | Correcto. |
| Backend `pnpm test` | 132/132: 116 regresiones Hito 1 y 16 pruebas nuevas de contrato/API. |
| Backend `pnpm test:sql` | 29/29, sin omisiones: persistencia, rollback, concurrencia, autorización y relaciones legadas reales. |
| Frontend `npm run typecheck` y `npm run build` | Correctos. |
| Frontend `npm test` | 13/13 con componentes/hooks reales, React DOM, jsdom y generadores PDF reales. |
| Frontend `npm run lint` | 2 errores y 1 advertencia preexistentes, sin incidencias nuevas. |
| Backend lint | No existe script/configuración ESLint; se ejecutaron TypeScript y `node --check` sobre las suites. |
| Lockfiles | Manifiestos coherentes; `pnpm install --lockfile-only --frozen-lockfile --ignore-scripts --offline` correcto en ambos módulos. Frontend instala con npm y se actualizó también su lock pnpm, conservando sus resoluciones anteriores cuando eran compatibles. |
| Revisión de whitespace | `git diff --check` correcto. |

Antes: frontend tenía 3 errores y 2 advertencias de lint. Se resolvieron la
incidencia de CancelarCitaModal y la dependencia de efecto de SesionModal como
parte del flujo. Permanecen exactamente las incidencias originales:

- `TestAplicarModal.tsx:32`: react-hooks/set-state-in-effect.
- `TestHistorialPaciente.tsx:69`: @typescript-eslint/no-unused-vars.
- `TestHistorialPaciente.tsx:67`: advertencia react-hooks/exhaustive-deps.

Las pruebas predeterminadas de backend sustituyen persistencia en las pruebas
HTTP y archivos del Hito 1. Verifican JWT, rutas, middlewares, validación y
controladores reales; el payload se obtiene del constructor real del formulario.
No se presentan esas pruebas como evidencia de rollback SQL.

La suite SQL usa la API real, Prisma real y una base nueva **aislada con datos
sintéticos**: `Hito2Test_20261102_9b71`, instancia local SQLEXPRESS, SQL Server 2022
16.0.1000.6, autenticación Windows. Crea pacientes y profesionales de prueba y un
trigger que solo falla al insertar `FALLAR_HITO2`. Comprueba los conteos reales
antes/después, estado de cita y ausencia de sesión, expediente y tratamientos
parciales. No sustituye persistencia ni transacciones. Los usuarios tienen hashes
ficticios y los JWT se firman con una clave exclusiva de pruebas.

También se probó la instancia local SQLDEV 17.0.1000.7: las conexiones adicionales
produjeron P1001 y no se certificó su concurrencia. La verificación completa se
realiza en SQL Server 2022. No se alteraron protocolos, credenciales o bases
clínicas para eludir ese fallo. Las dos bases Hito2Test nuevas contienen solo
fixtures sintéticas; la suite deja sus filas para inspección y no ejecuta resets
ni borrados de bases. Incluye deliberadamente una relación legada incompatible
para probar el rechazo: esa base de fixtures no debe usarse como base de clínica.

## Criterios de aceptación

| Criterio | Evidencia | Estado |
|---|---|---|
| Payload real aceptado, sin expediente cero | Constructor UI + endpoint real, coerciones y defaults verificados. | Validado |
| Cita/paciente/expediente/profesional coherentes | Comprobaciones dentro de transacción y rechazos HTTP con SQL real. | Validado con SQL real |
| Guardado esperado antes de cerrar | React + useCitas + promesa diferida; cierre solo tras resolver. | Validado |
| Error conserva notas, tratamientos y hora | Rechazo de API, mismo formulario y borrador recuperable. | Validado |
| Borrador en memoria por paciente/cita | Desmontar/reabrir, cambiar de paciente y nueva autenticación. | Validado |
| Confirmación de descarte voluntario | Cancelar confirmación mantiene el formulario y los datos. | Validado |
| Cancelación de cita sin cierre anticipado | Promesa pendiente, doble envío, error y reintento. | Validado |
| Dos terapias y un fármaco completos | Fechas finales, objetivos, dosis, vía y firmante en SQL. | Validado con SQL real |
| Rollback de toda la consulta | Fallo real del motor tras iniciar escrituras; conteos y estado sin cambios. | Validado con SQL real |
| Doble clic y reintento sin duplicados | Bloqueo UI y envíos HTTP simultáneos, respuesta perdida/reintento idéntico. | Validado con SQL real |
| Dos citas concurrentes/un expediente | SQL real, dos sesiones, misma clave de expediente. | Validado con SQL real |
| Cambio A -> B con respuesta tardía de A | Modal y hook reales; petición abortada y respuesta descartada. | Validado |
| Historial/PDF del paciente activo | Validación de sobre y bytes de PDF generado desde modal/detalle reales. | Validado |
| Número de expediente sin sesiones | API real y PDF de paciente sin sesiones. | Validado |
| Campos/terapias/tratamientos completos en PDF | Contenido real, fechas de calendario y receta de varias páginas. | Validado |
| Restricciones clínicas y cuenta vigente | Recepción, profesional ajeno, sin roles, temporal y anónimo. | Validado con SQL real |
| Alias de usuario sincronizados desde cuenta vigente | Token con privilegios falsos y cuenta actual; identidad de ambos alias. | Validado |
| Seguridad Hito 1 | 116 regresiones conservadas y correctas. | Validado |
| Relación clínica legada incompatible | Fixture SQL con cita de A y expediente de B; no devolver datos clínicos. | Validado con SQL real |

## Ejecución y configuración

No hay cambios de esquema ni migración nueva. Se reutilizan las restricciones
únicas existentes de `Sesion.ID_Cita` y `Expediente.ID_Paciente`, claves foráneas y
tablas de subtipos. La instancia debe corresponder al esquema Prisma vigente.
Se conservan las variables de entorno existentes `DATABASE_URL` y `JWT_SECRET`.
Backend y frontend deben publicarse juntos: el contrato antiguo singular/cero se
rechaza en vez de descartar indicaciones silenciosamente.

Backend, desde `clinica-backend`:

~~~powershell
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run typecheck
pnpm run build
pnpm test
pnpm dev
~~~

Frontend, desde `clinica-frontend`:

~~~powershell
npm ci
npm run typecheck
npm run build
npm run lint
npm test
npm run dev
~~~

Para repetir SQL, crear manualmente una base **nueva y vacía** `Hito2Test_*` en una
instancia local de pruebas. La suite solo admite ese prefijo y host local, y
comprueba `DB_NAME()` antes de crear fixtures. No usa `DATABASE_URL` como fallback:

~~~powershell
$env:HITO2_TEST_DATABASE_URL = 'sqlserver://127.0.0.1:1433;database=Hito2Test_Clinica;integratedSecurity=true;trustServerCertificate=true'
$env:DATABASE_URL = $env:HITO2_TEST_DATABASE_URL
# Solo sobre esa base nueva y aislada:
pnpm exec prisma db push --skip-generate
pnpm test:sql
~~~

No ejecutar `db push` sobre producción como paso de este hito. Sin la variable
HITO2_TEST_DATABASE_URL, la prueba SQL se marca omitida; eso no demuestra rollback
ni concurrencia. El sandbox puede requerir habilitar HTTP en 127.0.0.1 y conexión
SQL local para ejecutar las suites. Los catálogos sintéticos usan los estados
preexistentes 1/2/3/4 y no se requiere que los roles tengan IDs específicos.

Las muestras de PDF son opcionales y sintéticas: establecer `HITO2_PDF_DIR` en un
directorio de artefactos antes de `npm test`. No se generan PDFs con pacientes
reales en las pruebas.

## Verificación manual

Usar una base de demostración aislada con cuentas válidas y datos sintéticos,
separada de las fixtures deliberadamente inconsistentes de la suite SQL.

1. Entrar como psicólogo sin cambio de contraseña pendiente. Abrir su cita
   pendiente; escribir notas, diagnóstico, evolución, criterios y exploraciones.
2. Añadir dos terapias con objetivos/tipos distintos y un fármaco con dosis/vía.
   Establecer fechas finales distintas; verificar que las tres indicaciones se
   ven antes de guardar. Una indicación en edición debe agregarse al plan.
3. Interrumpir el backend o simular error HTTP solo en ese entorno. Guardar dos
   veces: permanece abierto, no hay segundo envío pendiente, muestra error y
   conserva inicio, notas y las tres indicaciones. Cerrar con Cancelar y rechazar
   el descarte mantiene los datos.
4. Navegar dentro de la aplicación y reabrir la misma consulta: recuperar borrador.
   Abrir otro paciente/cita: comprobar que no hereda datos del anterior.
5. Restablecer el backend y reintentar. Solo tras respuesta 201/200 se cierra.
   Revisar en la agenda el estado realizada y una sola sesión. Reenviar el mismo
   payload: misma sesión y tres tratamientos; variar contenido: conflicto visible.
6. Abrir expediente y exportar receta/expediente. Comparar número, nombre, tipos
   de terapia, objetivos, dosis, vía, frecuencia y fechas con lo escrito. Comprobar
   además un paciente con expediente y sin sesiones.
7. Con red lenta, abrir A, cambiar a B y esperar la respuesta de A: no aparecen
   notas de A bajo B y no se habilita exportación con datos antiguos.
8. Entrar como recepción: conservar agenda/administración de citas y no recibir
   notas en el JSON. Un psicólogo ajeno, usuario sin roles o cuenta temporal no
   puede guardar ni consultar sesiones clínicas.
9. Cancelar una cita pendiente con un fallo HTTP simulado: mantener motivo/notas;
   reintentar con éxito. Intentar reasignar/cancelar una cita atendida: rechazar.

## Límites conservados

- Borradores en memoria, sin recuperación después de recargar/cerrar la pestaña.
  No hay autosave clínico duradero ni escritura de notas en almacenamiento web.
- No se reparan datos reales inconsistentes. Se bloquea su publicación/exportación
  para que una revisión autorizada determine la atribución correcta.
- Una cita que el cron u otro usuario cambie a no procesada/cancelada durante la
  atención exige revisar la agenda; el rechazo conserva el borrador. No se añadió
  un estado persistente de atención en curso ni se modificó el cron de ausencias.
- F19 queda resuelto para sesiones; otros controladores aún pueden consumir
  `req.body` original. No se cambian todos los contratos del producto en este hito.
- No se certificó el entorno SQLDEV 2025, carga masiva ni múltiples nodos de
  producción. SQL Server 2022 y concurrencia local sí tienen pruebas reales.
- Permanecen los dos errores/una advertencia de lint indicados, avisos existentes
  de bundle/CSS/Browserslist y el problema previo build/start F15. Para desarrollo
  se usa `pnpm dev`; el ajuste de despliegue queda fuera de este hito.
- No se hizo reinstalación limpia del workspace del usuario. Se instalaron las
  dependencias nuevas de prueba y se verificaron árbol y locks.
- No se realizó push, publicación ni modificación de datos clínicos reales. El
  commit local del Hito 2 se autoriza en el cierre del 2026-11-03.

Mensaje del commit exclusivo de cierre:
`feat(clinica): completar registro transaccional de consultas (hito 2)`.
