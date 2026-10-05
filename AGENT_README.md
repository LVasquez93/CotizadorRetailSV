# AGENT ONBOARDING & ARCHITECTURAL SPECIFICATION
> **Documento maestro para Agentes IA y Desarrolladores Senior**  
> Este documento contiene el contexto completo, diseño de arquitectura, estructura de código, credenciales preconfiguradas, reglas de negocio y directrices para trabajar en el proyecto sin requerir contexto adicional.

---

## 1. Resumen Ejecutivo del Proyecto
El **Sistema de Cotizaciones Retail (El Salvador)** es una plataforma web empresarial diseñada para la generación ágil, gestión y descarga de cotizaciones comerciales con cálculo de impuestos locales (13% IVA), conversión automática de montos a letras y renderizado fiel de documentos PDF corporativos con membretes gráficos y firma digitalizada.

### Capacidades Principales
- **Cotizador Inteligente**: Formulario interactivo con autocompletado de clientes y equipos desde base de datos, cálculo financiero en tiempo real y vista previa inmediata en PDF sin guardar.
- **Soporte Multi-Sucursal**: Gestión independiente de sucursales, cada una con su propio membrete (encabezado/pie de página), clientes, equipos y vendedores asociados.
- **Generación de PDF de Alta Fidelidad**: Maquetación HTML/CSS convertida a PDF mediante OpenHTMLtoPDF y estampado multi-página con Apache PDFBox.
- **Gestión de Catálogos y Carga Masiva**: CRUD completo para Clientes, Equipos y Usuarios, con importación por lotes (CSV o copiar/pegar desde Excel).
- **Seguridad y Control de Acceso (RBAC)**: Autenticación Stateless JWT, contraseñas encriptadas con BCrypt y permisos diferenciados por roles (`ADMIN`, `GERENTE`, `VENTAS`).

---

## 2. Pila Tecnológica (Tech Stack)

### Backend
- **Lenguaje / Runtime**: Java 17 (Eclipse Temurin / Oracle OpenJDK).
- **Framework**: Spring Boot 3.3.4 (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `spring-boot-starter-thymeleaf`).
- **Base de Datos**: MySQL 8.x (Driver: `com.mysql:mysql-connector-j`).
- **Seguridad**: Spring Security 6 + JJWT (`io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` versión `0.12.6`).
- **Motor de PDF**: `com.openhtmltopdf:openhtmltopdf-pdfbox` (versión `1.0.10`) + `org.apache.pdfbox:pdfbox`.
- **Utilidades**: Project Lombok.

### Frontend
- **Framework / Runtime**: React 18 + Vite 5.4 con TypeScript (`strict`).
- **Estilos**: Tailwind CSS v4 (`@tailwindcss/vite`).
- **Navegación**: React Router DOM v6.
- **Formularios**: React Hook Form (`useForm`, `useFieldArray`).
- **HTTP Client**: Axios con interceptores automáticos de JWT y manejo de errores 401.
- **Iconos**: Lucide React.

---

## 3. Topología de Archivos y Repositorio

```text
Desarrollo/
├── AGENT_README.md                    <-- Este documento maestro
├── GUIA_DESPLIEGUE_PRODUCCION.md      <-- Guía paso a paso Cloudflare + Render + Aiven
├── ARQUITECTURA_Y_GUIA_SISTEMA_...md  <-- Especificación histórica inicial
├── iniciar_backend.bat                <-- Script rápido de arranque backend en raíz
├── iniciar_frontend.bat               <-- Script rápido de arranque frontend en raíz
│
├── backend/                           <-- Repositorio Independiente Backend (Spring Boot)
│   ├── Dockerfile                     <-- Contenedor para Render con fuentes Linux
│   ├── iniciar.bat                    <-- Script de arranque rápido local
│   ├── .gitignore                     <-- Ignora target/ e IDEs
│   ├── pom.xml
│   ├── src/main/resources/
│   │   ├── application.yml            <-- Configuración híbrida (dev por defecto + prod con env vars)
│   │   └── templates/
│   │       ├── cotizacion-template.html
│   │       └── assets/                <-- Imágenes empaquetadas internamente en classpath
│   └── src/main/java/com/retail/cotizador/
│       ├── CotizadorApplication.java
│       ├── common/
│       │   ├── config/                <-- CorsConfig, DataInitializer
│       │   ├── exception/             <-- GlobalExceptionHandler, ResourceNotFoundException
│       │   └── util/                  <-- NumeroALetrasUtil
│       ├── security/
│       │   ├── config/SecurityConfig.java
│       │   ├── jwt/JwtAuthenticationFilter.java, JwtTokenProvider.java
│       │   ├── service/CustomUserDetailsService.java
│       │   ├── controller/AuthController.java
│       │   └── dto/AuthRequestDto.java, AuthResponseDto.java
│       ├── sucursales/                <-- Entidad, DTO, Repo, Service, Controller
│       ├── catalogos/                 <-- Clientes, Equipos, Usuarios (CRUD + Carga Masiva)
│       └── cotizaciones/              <-- Cotización, Items, PDF Generator Service
│
└── frontend/                          <-- Repositorio Independiente Frontend (React + Vite)
    ├── public/
    │   └── _redirects                 <-- Enrutamiento SPA para Cloudflare Pages
    ├── iniciar.bat                    <-- Script de arranque rápido local
    ├── .gitignore                     <-- Ignora node_modules/ y dist/
    ├── .env.example                   <-- Plantilla de VITE_API_BASE_URL
    ├── package.json
    ├── vite.config.ts                 <-- Proxy dev local: /api -> http://localhost:8080
    ├── src/
    │   ├── vite-env.d.ts              <-- Definición de tipos Vite para variables de entorno
    │   ├── api/
    │   │   ├── axiosClient.ts         <-- BaseURL dinámico (dev: proxy, prod: VITE_API_BASE_URL)
    │   │   ├── authApi.ts
    │   │   ├── sucursalesApi.ts
    │   │   ├── catalogosApi.ts
    │   │   └── cotizacionesApi.ts
    │   ├── context/
    │   │   ├── AuthContext.tsx        <-- Estado global de usuario, token y RBAC
    │   │   └── SucursalContext.tsx    <-- Sucursal activa y aislamiento de datos
    │   ├── features/
    │   │   ├── auth/components/       <-- LoginModal.tsx, ProtectedRoute.tsx
    │   │   ├── cotizaciones/
    │   │   │   ├── components/
    │   │   │   │   ├── CotizacionForm.tsx        <-- Orquestador principal
    │   │   │   │   ├── ClienteCard.tsx           <-- Tarjeta y autocompletado de cliente
    │   │   │   │   ├── CotizacionMetadataCard.tsx<-- Fechas, emisor y términos
    │   │   │   │   ├── ItemsTable.tsx            <-- Tabla dinámica de ítems y totales
    │   │   │   │   ├── GuardarEquiposModal.tsx   <-- Diálogo para guardar nuevos equipos
    │   │   │   │   └── CotizacionesList.tsx      <-- Historial de cotizaciones
    │   │   │   ├── types/
    │   │   │   └── utils/ (calculosFinancieros.ts, numeroALetras.ts)
    │   │   ├── catalogos/
    │   │   │   ├── components/
    │   │   │   │   ├── CatalogosManagerView.tsx  <-- Vista orquestadora
    │   │   │   │   ├── ClientesTable.tsx         <-- Tabla de clientes
    │   │   │   │   ├── EquiposTable.tsx          <-- Tabla de equipos
    │   │   │   │   ├── UsuariosTable.tsx         <-- Tabla de usuarios
    │   │   │   │   ├── CatalogoFormModal.tsx     <-- Modal de creación/edición
    │   │   │   │   ├── BatchImportModal.tsx      <-- Modal de carga masiva CSV
    │   │   │   │   └── ConfirmDeleteModal.tsx    <-- Modal de confirmación de baja
    │   │   │   └── types/
    │   │   └── sucursales/
    │   │       ├── components/SucursalesManagerView.tsx
    │   │       └── types/
    │   └── components/layout/
    │       └── Navbar.tsx             <-- Barra superior con RBAC y selector de sucursal
```

---

## 4. Puesta en Marcha (Setup & Execution)

### Requisitos del Sistema
- Java 17 instalado y accesible en consola (`java -version`).
- Node.js 18+ y npm instalados.
- Servidor MySQL 8.x corriendo en el puerto `3306`.

### Configuración de Base de Datos
El backend crea automáticamente el schema si no existe, o se conecta a `cotizador_db`:
```properties
Host: localhost:3306
Database: cotizador_db
User: root
Password: root (o la configurada en application.yml)
```
> **Nota de Configuración**: Para modificar credenciales de base de datos, editar [application.yml](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/backend/src/main/resources/application.yml).

### Ejecutar Backend
```bash
cd backend
mvn spring-boot:run
```
El servidor arrancará en: `http://localhost:8080`.  
Los tests unitarios y de integración se ejecutan con: `mvn test`.

### Ejecutar Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación web se ejecutará en: `http://localhost:5173`.  
Vite tiene configurado un proxy transparente en `vite.config.ts` hacia `http://localhost:8080`.

---

## 5. Credenciales y Matriz de Control de Acceso (RBAC)

El componente `DataInitializer.java` ejecuta al iniciar la aplicación una siembra y validación automática de usuarios con contraseñas encriptadas mediante `BCryptPasswordEncoder`:

| Usuario | Contraseña | Rol | Sucursal Asignada | Permisos Clave |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ROLE_ADMIN` | Sucursal 1 (Global) | Acceso total: cambiar sucursal, CRUD catálogos, crear sucursales, importar lotes. |
| `gerente` | `gerente123` | `ROLE_GERENTE` | Sucursal 1 | Supervisión: cambiar sucursal, CRUD catálogos, ver historial y cotizar. |
| `vendedor1` | `ventas123` | `ROLE_VENTAS` | Sucursal 1 (San Salvador) | Operativo: solo cotizar e historial. **Bloqueado a Sucursal 1**, no ve catálogos ni selector de sucursal. |
| `vendedor2` | `ventas123` | `ROLE_VENTAS` | Sucursal 2 (Santa Ana) | Operativo: solo cotizar e historial. **Bloqueado a Sucursal 2**, no ve catálogos ni selector de sucursal. |

### Reglas de Seguridad en Backend (`SecurityConfig.java`)
- `POST /api/v1/auth/login`: **Público**.
- `GET /api/v1/sucursales`: Permitido para todos los autenticados (los vendedores obtienen sucursales para visualización).
- `POST /api/v1/sucursales`, `PUT /api/v1/sucursales/**`, `DELETE`: Requiere rol `ADMIN` o `GERENTE`.
- `/api/v1/usuarios/**`: Requiere rol `ADMIN` o `GERENTE`.
- `/api/v1/clientes/lote`, `/api/v1/equipos/lote`: Requiere rol `ADMIN` o `GERENTE`.
- `DELETE /api/v1/clientes/**`, `DELETE /api/v1/equipos/**`: Requiere rol `ADMIN` o `GERENTE`.
- `/api/v1/cotizaciones/**`: Permitido para cualquier usuario autenticado (`ADMIN`, `GERENTE`, `VENTAS`).

### Reglas de Seguridad en Frontend
- `ProtectedRoute.tsx`: Envuelve rutas restringidas (`/catalogos`, `/sucursales`) y redirige automáticamente al cotizador (`/`) si el usuario no tiene los roles permitidos.
- `Navbar.tsx`: El selector desplegable de sucursal y los enlaces a "Catálogos" y "Sucursales" están completamente ocultos para usuarios con rol `ROLE_VENTAS`.
- `SucursalContext.tsx`: Al iniciar sesión un usuario `ROLE_VENTAS`, el contexto fuerza automáticamente su `sucursalId` asignado y deshabilita cualquier cambio manual.

---

## 6. Modelo de Datos y Entidades Clave

### 1. `Cotizacion` y `ItemCotizacion`
- **Código**: Generado automáticamente con formato secuencial `#COT-YYYYMM###` o `#YYYYMMDD###`.
- **Relación**: `Cotizacion (1) -> (N) ItemCotizacion` con `CascadeType.ALL` y `orphanRemoval = true`.
- **Campos**: `contactoCliente`, `razonSocialCliente`, `nombreComercial`, `formaPago`, `notaImportante`, `subtotalSinIva`, `montoIva`, `totalInversion`, `totalEnLetras`, `sucursal_id`, `firmaDigitalBase64`.

### 2. `Sucursal`
- `nombre`: Nombre descriptivo (ej: "Sucursal Central San Salvador").
- `codigo`: Identificador corto (ej: "SUC-01").
- `logoBase64`: Logo corporativo de la empresa o división.
- `encabezadoBase64`: Imagen del banner superior (formato JPG/PNG en Base64).
- `pieBase64`: Imagen del banner inferior (formato JPG/PNG en Base64).
- `colorPrimario`: Hexadecimal del color corporativo para la cabecera de tablas (default: `#6394EC`).

### 3. Catálogos: `Cliente`, `Equipo`, `Usuario`
- Todas las entidades de negocio cuentan con `sucursalId` (salvo usuarios globales) para garantizar que los clientes y equipos pertenezcan a la sucursal activa seleccionada.

---

## 7. Lógica Financiera y Motor de PDF

### Cálculo Financiero Estándar
1. `totalLinea = ROUND(cantidad * precioUnitario, 2)`
2. `subtotalSinIva = ROUND(SUM(totalLinea), 2)`
3. `montoIva = ROUND(subtotalSinIva * 0.13, 2)`  *(13% IVA estándar El Salvador)*
4. `totalInversion = ROUND(subtotalSinIva + montoIva, 2)`
5. `totalEnLetras`: Convertido automáticamente a español legal salvadoreño (ejemplo: `DOSCIENTOS DOLARES CON 08/100`). Implementado de forma idéntica en:
   - Backend: [NumeroALetrasUtil.java](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/backend/src/main/java/com/retail/cotizador/common/util/NumeroALetrasUtil.java)
   - Frontend: [numeroALetras.ts](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/frontend/src/features/cotizaciones/utils/numeroALetras.ts)

### Pipeline de Generación de PDF ([PdfGeneratorService.java](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/backend/src/main/java/com/retail/cotizador/cotizaciones/service/PdfGeneratorService.java))
1. **Compilación de Plantilla Thymeleaf**: Se alimenta [cotizacion-template.html](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/backend/src/main/resources/templates/cotizacion-template.html) con los datos de la cotización y assets gráficos en Base64.
2. **Renderizado OpenHTMLtoPDF**: `PdfRendererBuilder` compila el HTML en modo rápido (`useFastMode()`) produciendo un PDF base con márgenes reservados (`@page { margin-top: 130px; margin-bottom: 120px; }`).
3. **Estampado Multi-Página con Apache PDFBox**:
   - `estamparBannersYFirma(byte[] pdfBase, Cotizacion c)` abre el documento generado.
   - En **todas las páginas**: estampa el banner de encabezado (`encabezadoBase64`) arriba a sangre (full-width) y el banner de pie (`pieBase64`) en la parte inferior.
   - En la **última página**: estampa la firma digital (`firmaDigitalBase64`) sobre el bloque de "Atentamente" del emisor.
4. **Endpoint Preview sin Persistir**: `POST /api/v1/cotizaciones/preview-pdf` mapea el DTO a una entidad transitoria en memoria y devuelve el `application/pdf` directamente, permitiendo ver el resultado en un modal o nueva pestaña antes de guardar.

---

## 8. Arquitectura y Componentes Frontend

### Principio de Responsabilidad Única (SOLID)
El frontend fue refactorizado para evitar componentes monolíticos:
- [CotizacionForm.tsx](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/frontend/src/features/cotizaciones/components/CotizacionForm.tsx) delega en:
  - `ClienteCard.tsx`: Manejo de campos y dropdown de autocompletado de clientes.
  - `CotizacionMetadataCard.tsx`: Fecha, emisor (con badge de rol) y términos comerciales.
  - `ItemsTable.tsx`: Tabla dinámica con autocompletado de ítems, adición/eliminación de filas y panel de totales (#FFE3E7).
  - `GuardarEquiposModal.tsx`: Diálogo para detectar ítems ingresados manualmente que no existen en la base de datos y ofrecer guardarlos en el catálogo con un solo clic.
- [CatalogosManagerView.tsx](file:///c:/Users/luizi/OneDrive/Escritorio/Desarrollo/frontend/src/features/catalogos/components/CatalogosManagerView.tsx) delega en:
  - `ClientesTable.tsx`, `EquiposTable.tsx`, `UsuariosTable.tsx`.
  - `CatalogoFormModal.tsx`: Formulario reutilizable para alta/edición de cualquier entidad.
  - `BatchImportModal.tsx`: Asistente de importación masiva con validación y vista previa de registros parseados.
  - `ConfirmDeleteModal.tsx`: Confirmación segura con aviso de consecuencias.

### Manejo de Memoria en Navegador
Al descargar o previsualizar archivos Blob (PDF):
- Siempre se utiliza `setTimeout(() => window.URL.revokeObjectURL(url), 60000)` para liberar memoria en el hilo del navegador.

---

## 9. Directrices y Convenciones para Futuros Agentes IA

1. **No mezclar responsabilidades en componentes gigantes**: Si un componente de React supera las 400 líneas, descompóngalo en subcomponentes especializados en `components/`.
2. **Preservar el cálculo financiero y número a letras**: Mantener siempre la sincronización de fórmulas entre frontend y backend (`calculosFinancieros.ts` y `NumeroALetrasUtil.java`).
3. **Seguridad primero**: Nunca desactive las comprobaciones de JWT o los roles en `SecurityConfig.java`. Cualquier endpoint nuevo que manipule datos sensibles debe exigir `@PreAuthorize` o estar configurado en el filtro de seguridad.
4. **Validación de compilación continua**:
   - Tras modificar el backend: Ejecutar `mvn test` en el directorio `backend`.
   - Tras modificar el frontend: Ejecutar `npm run build` en el directorio `frontend`.
5. **No romper la compatibilidad de base de datos**: Los cambios en entidades JPA deben ser retrocompatibles con la estructura existente en MySQL (`ddl-auto: update`).
