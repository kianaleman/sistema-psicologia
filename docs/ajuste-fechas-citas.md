# Ajuste posterior al Hito 2: fechas de citas y tratamientos

Verificación ejecutada el **2026-11-03**, en `kelvin`, sobre el commit del Hito 2
`2f6ee6a9977dc948e24643328e0626f9fb6d03c8`. No se reescribe ese commit ni el Hito 1.
El inventario y los resultados están en
[ajuste-fechas-citas-verificacion.json](ajuste-fechas-citas-verificacion.json).
La evidencia histórica de los hitos permanece en sus documentos originales.

## Diagnóstico contrastado

- Los esquemas de citas aceptaban cualquier cadena para fecha/hora y la ruta de
  disponibilidad no validaba el calendario. El servicio construía un `Date`
  directamente. JavaScript acepta `20026-10-04` como un año extendido y normaliza
  `2026-02-30` a marzo: no basta con comprobar que el `Date` exista.
- `Cita.FechaCita` y las fechas de tratamiento usan `@db.Date`. Se admite el rango
  **0001-01-01 a 9999-12-31**, con calendario gregoriano, conforme a
  [SQL Server DATE](https://learn.microsoft.com/en-us/sql/t-sql/data-types/date-transact-sql?view=sql-server-ver16).
- `useCitas` y el seguimiento de `SesionModal` convertían un fallo de disponibilidad
  en `[]`. La interfaz podía anunciar horarios libres sin haberlos comprobado.
- Los controladores devolvían `Error.message` directamente, incluidos errores
  internos de Prisma, y clasificaban casi cualquier fallo como HTTP 400.
- La versión instalada de Recharts es **3.4.1**. Las dos gráficas de `Dashboard`
  tenían dimensiones porcentuales mientras `ResponsiveContainer` iniciaba la
  medición en `-1/-1`. Se verificó el código instalado y la
  [API de ResponsiveContainer](https://recharts.github.io/en-US/api/ResponsiveContainer/).

No se dispone del cuerpo de las **dos respuestas POST 400 originales**. No puede
atribuirse retrospectivamente una causa concreta a ambas. Sí se reprodujeron las
fechas inválidas, los rechazos legítimos por fecha pasada y el pago sin banco o
referencia. También se comprobó una creación válida real con recibo en SQL Server.

## Contratos y comportamiento resultantes

- `GET /api/citas/horarios-ocupados`: `psicologoId` entero positivo compatible con
  SQL INT; `fecha` exactamente `YYYY-MM-DD`, día real y año 0001–9999. Crear y
  editar aplican el mismo calendario y hora `HH:mm`, antes de acceder a citas.
  El servicio valida otra vez para sus consumidores directos.
- Se usan los valores transformados de `res.locals.validated`. FechaCita se
  almacena a medianoche UTC como fecha de calendario y HoraCita en un ancla UTC
  independiente de la fecha. Se conserva el control de pasado en Nicaragua
  (UTC−06), sin introducir un límite artificial para citas futuras.
- Errores de entrada/negocio: 400; permisos: 401/403; cita inexistente: 404;
  conflicto: 409; fallo inesperado: 500 con mensaje público. El JSON no contiene
  rutas internas, consultas ni mensajes de Prisma. La auditoría de citas registra
  identificadores, nombres de campos y mensajes controlados, sin copiar el body.
- Los campos obligatorios del formulario se comprueban antes de construir IDs;
  no se envían `NaN`/`null` por selecciones vacías. Se conserva la regla existente
  de banco y referencia para métodos distintos de efectivo, ahora también en el
  esquema. El cliente presenta los detalles comprensibles de validación.
- La disponibilidad tiene estados separados: inactiva, cargando, error y cargada.
  No se consulta una fecha incompleta/inválida. Un fallo bloquea el guardado y
  ofrece reintento; no significa disponibilidad libre. Cada selección de fecha y
  profesional invalida la respuesta anterior, incluso al volver de A → B → A.
  El formulario de seguimiento utiliza el mismo control.
- Se evita competir con la propia hora al editar; otra coincidencia continúa
  bloqueada y el servidor comprueba el conflicto al guardar. Los estados
  cancelada/no procesada se excluyen igual que en el control de conflictos.
- Ambos tipos de tratamiento comparten «Fechas del tratamiento»: dos columnas
  desde `md`, una en móvil; campos de 44 px, etiquetas visibles y errores
  asociados debajo de cada campo. Inicio obligatorio, fin opcional, fin anterior
  rechazado. Corregir un error conserva la indicación y las notas clínicas.
- Las gráficas conservan sus alturas de diseño (320/224 px), ahora numéricas,
  con ancho medido y `minWidth=0`. Recharts espera un ancho positivo para dibujar y
  vuelve a medir al mostrarse o redimensionarse. No se silencia `console.warn`.
- Se mantienen autenticación, cuenta vigente, autorización y separación de
  información clínica del Hito 1, y la persistencia transaccional del Hito 2.

## Comprobaciones ejecutadas

| Módulo / comando | Resultado |
| --- | --- |
| Backend: `pnpm test` | **164/164**, sin fallos ni omisiones. HTTP real y middlewares; persistencia simulada. Conserva las 132 pruebas anteriores. |
| Backend: `pnpm test:sql` | **33/33**, sin fallos ni omisiones, SQL Server 2022 real aislado. Conserva las 29 anteriores. |
| Backend: `pnpm run typecheck`, `pnpm run build` | Ambos correctos. |
| Frontend: `npm test` | **37/37**, sin fallos ni omisiones. Conserva las 14 regresiones del Hito 2, incluido historial/PDF. |
| Frontend con `HITO2_TEST_NOW=2027-07-15T15:00:00.000Z`: `npm test` | **37/37**. Segunda ejecución, no pruebas distintas. |
| Frontend: `npm run typecheck`, `npm run build` | Ambos correctos. |
| Frontend: `npm run lint -- --format json` | Salida 1, las mismas 2 incidencias de error y 1 advertencia anteriores; **0 nuevas**. |
| Sintaxis de las tres suites modificadas y `git diff --check` | Correctos. |

Total: **234 pruebas distintas aprobadas**, más la repetición de las 37 de frontend
con reloj de 2027. Casos nuevos: fechas incompletas, año 20026, año cero, días
inexistentes, reglas de bisiestos, límites de DATE, horas inválidas, rechazo antes
de Prisma, errores sin detalles internos, disponibilidad fallida/reintento,
respuestas tardías, doble envío, conservación del formulario, ambos tratamientos y
medición de las gráficas.

Las 33 pruebas SQL se ejecutaron contra `SQLEXPRESS 16.0.1000.6`, en la base local
aislada `Hito2Test_20261102_9b71`, con datos exclusivamente sintéticos. La suite
verifica host local, prefijo y `DB_NAME()`. Además de rollback, concurrencia y
relaciones del Hito 2, se consultaron los límites 0001/9999 y el bisiesto 2028;
se creó una cita de 2099 con recibo y se editó conservando el día y las 09:30.

Se ejecutó también una comprobación en **Chrome headless con Playwright**, usando
los componentes reales y CSS compilado, con API sintética local: escritorio de
1280 px y móvil de 390 px, campos alineados/iguales y error visible. Se inspeccionaron
las capturas. Redimensionar y ocultar/mostrar Dashboard produjo **0 avisos de
dimensiones negativas y 0 errores JavaScript**. Esta comprobación visual no
representa un recorrido de producción conectado a datos reales.

## Repetición y verificación manual

Usar `pnpm` en backend y `npm` en frontend, con las dependencias existentes. No se
añaden paquetes ni cambian lockfiles. No se modifica el esquema ni se requiere
migración/configuración nueva. Publicar ambos módulos para disponer también de
la validación y errores controlados del servidor.

Ejecutar los comandos de la tabla desde su módulo. Para repetir SQL, seguir la
preparación de base **aislada** y `HITO2_TEST_DATABASE_URL` descrita en
[hito-2-sesiones.md](hito-2-sesiones.md); la ausencia de esa variable omite SQL y
no certifica persistencia. El reloj de frontend se controla en PowerShell así:

```powershell
$env:HITO2_TEST_NOW = '2027-07-15T15:00:00.000Z'
npm test
Remove-Item Env:HITO2_TEST_NOW
```

1. Con datos sintéticos, seleccionar profesional y escribir una fecha parcial,
   `20026-10-04` o un día inexistente: no debe salir una consulta de disponibilidad.
   Una petición directa autenticada inválida debe devolver 400 comprensible.
2. Elegir una fecha futura válida y una hora libre. Crear y editar: comprobar día,
   hora, recibo y permisos. Una fecha pasada debe seguir siendo rechazada.
3. Interrumpir solo la consulta de disponibilidad: mostrar error, impedir guardar,
   conservar campos y poder reintentar. Cambiar fecha/profesional con red lenta:
   una respuesta antigua no modifica los horarios actuales.
4. En sesión clínica probar ambos tratamientos en móvil/escritorio, inicio vacío,
   fin anterior y fin vacío. Corregir sin perder datos y verificar historial/PDF.
5. Abrir Dashboard, cambiar el ancho y ocultar/mostrar su contenedor: las gráficas
   vuelven a dibujarse sin el aviso de medidas negativas.

## Pendientes conservados

- **F15**: desajuste preexistente de `build/start` del backend, fuera de alcance.
- Lint: `TestAplicarModal.tsx:32` (`react-hooks/set-state-in-effect`, error);
  `TestHistorialPaciente.tsx:69` (`@typescript-eslint/no-unused-vars`, error) y
  `:67` (`react-hooks/exhaustive-deps`, advertencia). Comparación exacta antes y
  después por archivo, línea, columna, regla, severidad y mensaje: sin cambios.
  El backend sigue sin script/configuración de lint; se verificó TypeScript.
- Siguen los avisos anteriores de tamaño del bundle, `@property` de CSS y datos
  Browserslist/Baseline desactualizados; el build termina correctamente.
- SQLDEV 2025 y su fallo anterior P1001 no se revalidaron; la evidencia SQL nueva
  corresponde exclusivamente a SQL Server 2022 aislado.
- Los dos POST 400 históricos necesitan sus respuestas originales para atribuir
  su causa exacta. El manejo y los casos reproducidos sí quedan comprobados.
- No se repitió el render de PDF con Poppler; sí sus pruebas de contenido y
  atribución al paciente activo. No se cambió el generador de PDF.

Mensaje del commit independiente:
`fix(citas): validar fechas y mejorar campos de tratamientos`. Sin push.
