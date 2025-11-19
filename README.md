
# 🏥 **Sistema de Gestión Clínica – Psicológica Resiliencia**

¡Bienvenido al Sistema de Gestión Clínica!  
Una plataforma diseñada para administrar **pacientes, citas y sesiones psicológicas** de forma rápida, moderna y eficiente.

---

## 📚 **Características Principales**

- 🗂️ **Gestión completa de pacientes**  
  - Datos personales  
  - Soporte para **adultos y menores**  
  - Gestión de tutores y escolaridad  
  - Filtros inteligentes por nombre, cédula, estado, tipo

- 📅 **Agenda y manejo de citas**  
  - Programación con control de disponibilidad  
  - Tarjetas visuales de citas  
  - Estados: Programada · Completada · Cancelada  
  - Facturación automática al crear una cita

- 🩺 **Módulo de sesiones clínicas**  
  - Notas profesionales  
  - Diagnósticos y criterios DSM-5  
  - Historial cronológico de consultas  
  - Cálculo automático de tiempo por sesión  
  - Mini-expediente accesible desde la agenda

- 👥 **Gestión administrativa**  
  - Directorio de psicólogos  
  - Directorio de tutores  
  - Dashboard con **KPIs en tiempo real**

---

## 🚀 **Tecnologías Utilizadas**

### 🔧 Backend
- Node.js  
- Express  
- Prisma ORM (TypeScript)  
- SQL Server  

### 🎨 Frontend
- React  
- Vite  
- TailwindCSS  
- DaisyUI  
- TypeScript  

### 📐 Arquitectura
- Backend: **Modelo–Vista–Controlador (MVC)**  
- Frontend: Servicios reutilizables y componentes modulares  

---

# 🛠️ Instalación y Configuración

## 1️⃣ **Configurar la Base de Datos**

1. Abre **SQL Server Management Studio (SSMS)**.  
2. Ejecuta el script que crea la base de datos:  
   `ClinicaPsicologicaResilencia`  
3. Asegúrate de tener habilitado el puerto **1433** (TCP/IP).

---

## 2️⃣ **Configurar el Backend**

```bash
cd clinica-backend
npm install
```

Crear archivo **.env**:

```
DATABASE_URL="sqlserver://localhost:1433;database=ClinicaPsicologicaResilencia;integratedSecurity=true;trustServerCertificate=true"
```

Generar Prisma y levantar el servidor:

```bash
npx prisma generate
npm run dev
```

📌 **Backend disponible en:**  
http://localhost:3000

---

## 3️⃣ **Configurar el Frontend**

```bash
cd clinica-frontend
npm install
npm run dev
```

📌 **Frontend disponible en:**  
http://localhost:5173

---

# ✨ Módulos del Sistema

## 🗂️ Gestión de Pacientes
- Expediente digital completo  
- Adultos / Menores  
- Tutores y escolaridad  
- Filtros avanzados

---

## 📅 Agenda y Citas
- Gestión visual  
- Estados clínicos  
- Validación automática  
- Facturación integrada  

---

## 🩺 Módulo Clínico
- Notas · Diagnóstico · DSM-5  
- Historial evolutivo  
- Cálculo automático de tiempos

---

## 📄 **Licencia**
Proyecto de uso **académico y educativo**.
