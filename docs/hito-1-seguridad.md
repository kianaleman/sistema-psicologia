# Hito 1 — Accesos e información clínica

Implementación contrastada con el código del commit df3c7d4 y con
auditoria-sistema-psicologia-2026-11-01.md. Los hallazgos F01, F02, F03, F16 y F18
seguían presentes al comenzar. La auditoría de referencia se conserva sin cambios.

## Cambios

- Respaldos: todas las rutas usan la misma cadena de autenticación, cuenta vigente,
  cambio obligatorio y autorización administrativa. Generar, descargar y eliminar
  registran actor, acción, resultado y nombre validado del archivo. No se guarda
  el cuerpo de la petición, su autorización, contenido del respaldo ni errores SQL.
- Profesionales: crear y editar, incluido el propio perfil, son operaciones de
  Administrador. No hay un endpoint de autoservicio de perfil en este producto.
  Psicólogo y Recepción consultan un directorio de profesionales activos con ID,
  nombre, código MINSA y especialidades; sin cuenta vinculada, correo, credenciales
  ni dirección personal.
- Cuentas vinculadas: las credenciales temporales solo salen de endpoints
  administrativos y sus respuestas usan Cache-Control: no-store. Al cambiar el
  correo se invalidan los enlaces de recuperación anteriores. El rol del nuevo
  profesional se busca por nombre y no por el número 2.
- Configuración: lectura permitida a los tres roles reconocidos; toda escritura
  administrativa queda después de un único control de autorización.
- Agenda: consulta administrativa con listas positivas de campos en cada relación.
  Recepción no consulta las notas en SQL ni recibe MotivoConsulta, diagnósticos,
  observaciones clínicas, evolución, criterios, tratamientos o expedientes. De la
  sesión solo recibe ID_Sesion como metadato. Se omiten notas libres del recibo.
  Administrador puede consultar el contenido clínico; Psicólogo, el de sus citas.
  El rol combinado Psicólogo + Recepción ve toda la agenda administrativa y
  únicamente sus propias notas.
- Las respuestas de creación y cancelación de citas también se proyectan. Una
  edición administrativa no borra el motivo clínico que recepción no puede leer.
  La edición general no cambia paciente/profesional de una cita que ya tenga
  sesión: impide apropiarse del historial reasignando una consulta.
- Cuenta vigente: en estos módulos se consultan estado, roles, profesional
  vinculado y cambio obligatorio desde SQL Server. Un JWT anterior no conserva
  permisos administrativos retirados ni omite un cambio obligatorio pendiente.
  Si esa consulta falla, la operación se rechaza con 503.
- HTTP: se separó createApp del proceso que escucha el puerto e inicia el cron.
  Las pruebas construyen la API real sin iniciar jobs. Los errores conocidos del
  parser JSON tienen respuestas JSON controladas, sin devolver el cuerpo original.
- Dependencias: pnpm actualizó Express de 5.2.1 a 5.3.0. Se fija el mínimo de
  body-parser 2.4.0 mediante override de su dependencia en Express. El lock resuelve
  2.4.0 también a través de express-rate-limit.
- Administrador inicial: entrada de contraseña oculta o secreto inyectado,
  bcrypt, rol Administrador explícito por nombre, transacción Serializable,
  reintentos acotados y asociación idempotente mediante la PK compuesta. Las
  cuentas nuevas deben cambiar su contraseña en el primer acceso.

El aviso [GHSA-27r3-jxmh-p828 del mantenedor](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828)
afecta body-parser 2.x anterior a 2.4.0. Se comprobó el árbol resuelto y una
regresión HTTP pequeña y local de contenido comprimido con bytes posteriores.
El análisis posterior de pnpm no reporta ese aviso ni avisos de body-parser.
Persisten otras alertas de dependencias fuera del alcance de este hito.

## Matriz de permisos

Todas las operaciones de esta matriz exigen cuenta activa y cambio obligatorio
completado. Sin autenticación, sin roles reconocidos o con cambio pendiente se
rechazan antes de llegar a persistencia/archivos. El endpoint para completar el
cambio obligatorio permanece disponible.

| Operación | Administrador | Psicólogo | Recepción |
|---|---|---|---|
| Listar/generar/descargar/eliminar respaldos | Sí | No | No |
| Crear o editar profesionales/correo | Sí | No, tampoco perfil propio | No |
| Registro/reset administrativo de cuentas | Sí | No | No |
| Directorio de profesionales | Administración completa, sin hashes/tokens | Mínimo de activos | Mínimo de activos |
| Leer catálogos de configuración | Sí | Sí | Sí |
| Crear/editar/eliminar catálogos | Sí | No | No |
| Agenda administrativa | Todas las citas | Sus citas | Todas las citas |
| Notas clínicas en la agenda | Todas | Solo propias | No |
| Reservar/editar/cancelar citas | Todas, con restricciones históricas | Propias | Administrativas |
| Cambiar paciente/profesional de cita con sesión | No mediante edición general | No | No |

Con varios roles se combinan las capacidades administrativas, pero las notas
clínicas siguen comprobándose por cita. La presencia de Recepción no convierte
al psicólogo en lector clínico de otros profesionales.

## Uso

Entorno verificado: Windows, Node 24.22.1 y pnpm 10.16.1. Backend usa
pnpm-lock.yaml; frontend conserva su package-lock.json y utiliza npm. No se
añadieron dependencias de pruebas: se usan node:test, HTTP local, JWT real y tsx.

Desde clinica-backend:

~~~powershell
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run typecheck
pnpm run build
pnpm test
~~~

Se necesitan las variables que ya utilizaba el backend, en particular
DATABASE_URL y JWT_SECRET. No hay cambios de esquema ni migraciones nuevas.
La consulta de cuenta requiere Usuario, Usuario_Rol, Rol y el vínculo Psicologo
conforme al esquema existente. Para altas profesionales debe existir el rol
Psicologo; se busca por Nombre_Rol y no por un ID predeterminado.

Para crear el administrador inicial, una persona autorizada ejecuta desde una
terminal interactiva:

~~~powershell
pnpm admin:crear administrador@tu-dominio.example
~~~

La contraseña se escribe en un prompt oculto: al menos 12 caracteres y como
máximo 72 bytes UTF-8. No se pasa por argumentos ni se imprime. Para un proceso
automatizado pueden inyectarse BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD
desde su almacén de secretos; no deben guardarse en Git ni en comandos que
impriman sus valores.

Reejecutar asegura la asociación con Administrador sin duplicarla y conserva la
contraseña, el estado activo/inactivo y el cambio obligatorio de una cuenta que
ya existía. No es un comando de restablecimiento de contraseña. Si se utilizó el
bootstrap anterior, la credencial conocida requiere rotación por el procedimiento
administrativo autorizado; reejecutar no la cambia silenciosamente.

Las pruebas fijan una DATABASE_URL ficticia antes de importar servicios; no usan
el .env real para persistencia. Sustituyen los métodos de base de datos y
archivos, y escuchan únicamente un puerto efímero en 127.0.0.1. Si un sandbox
bloquea conexiones loopback se necesita habilitar esa ejecución local. No se
debe modificar la suite para apuntarla a producción.

## Validación

- 116 pruebas: 103 de API/seguridad/parser y 13 de bootstrap.
- Rutas reales para los casos sin JWT, administrador, psicólogo, recepción, sin
  roles y administrador temporal; también JWT inválido, roles retirados, cuenta
  inactiva, cambio obligatorio posterior a la firma y fallo de comprobación.
- Cambio de correo ajeno y del propio perfil por no administrador rechazados;
  cambio administrativo válido invalida recuperación previa.
- Comprobación del JSON serializado y de consultas Prisma para recepción,
  psicólogo, administrador y roles combinados; creación, edición, cancelación,
  horarios y directorio legítimos conservados.
- Generación/descarga/eliminación simuladas con actor y sin secretos en auditoría;
  descarga fallida registrada como fallo.
- JSON válido y gzip válido; JSON inválido, límite de 100 KB, codificación y
  charset inválidos; regresión del aviso comprimido sin terminar la API.
- Bootstrap con hash, primer cambio, rol de ID arbitrario, reejecución, asociación
  faltante, validaciones, reintentos y rechazo de contraseña por argumentos.
- Typecheck y build de backend: correctos.
- Typecheck y build de frontend: correctos; frontend no se modificó.
- Lint frontend: mismos 3 errores y 2 advertencias, comparados antes/después.
  Son preexistentes en CancelarCitaModal, SesionModal, TestAplicarModal y
  TestHistorialPaciente. El backend no tenía configuración de lint; sus archivos
  TypeScript se verifican con tsc y los tests además con node --check.
- pnpm install --lockfile-only --frozen-lockfile --ignore-scripts --offline:
  correcto; manifiesto y lock sincronizados. No se hizo reinstalación limpia
  de todas las dependencias del usuario.
- git diff --check: correcto.

Los resultados detallados se entregan junto al cierre del hito. Las pruebas de
SQL y archivos usan simulaciones, tal como permite el alcance; no certifican
restauración real, disponibilidad de un servidor SQL ni comportamiento bajo
concurrencia real de esa instancia.

## Límites conservados

El hito cubre los cinco hallazgos indicados y la escritura de configuración.
No convierte la aplicación completa en apta para producción. Continúan fuera
de alcance el contrato roto de guardar sesiones, la integridad/concurrencia de
tests, la reserva concurrente, el despliegue build/start, paginación, restauración
y otras dependencias vulnerables descritas en la auditoría.

La validación de cuenta vigente se aplica a respaldos, profesionales,
configuración, agenda y administración de auth. Los otros módulos aún necesitan
la revisión global de ciclo de sesión F04. No se añadió revocación general de
todos los JWT tras un cambio de contraseña.

La auditoría mantiene su mecanismo existente de registrar errores de persistencia
sin detener el negocio. La disponibilidad/retención de ese registro se debe
verificar operativamente; no se escribió en la base real durante esta entrega.
