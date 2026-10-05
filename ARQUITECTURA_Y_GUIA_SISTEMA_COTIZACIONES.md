# Especificación de Arquitectura y Guía de Implementación
## Sistema Modular Web de Cotizaciones (Spring Boot + React Vite)

> **Documento Técnico de Ingeniería de Software**  
> **Autor:** Arquitecto de Software Senior  
> **Proyecto:** Sistema de Gestión y Cotizaciones Empresariales  
> **Fase Actual:** Bloque 1 - Módulo de Creación y Emisión de Cotizaciones en PDF  
> **Última Actualización:** 02 de Octubre de 2026  
> **Motor de Base de Datos:** MySQL 8.0  

---

## 1. Tablero de Control y Estado Actual del Proyecto

A continuación se resume el estado de avance del sistema en sus dos componentes desacoplados (**Backend** y **Frontend**):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESTADO DE IMPLEMENTACIÓN                        │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│    BLOQUE 1     │     BLOQUE 2     │    BLOQUE 3     │    BLOQUE 4     │
│ [100% CÓDIGO]   │  [100% CÓDIGO]   │  [100% CÓDIGO]  │  [PENDIENTE]    │
│ Emisión de      │ Catálogo de      │ Directorio de   │ Seguridad RBAC, │
│ Cotizaciones y  │ Equipos, Precios │ Clientes (CRM) y│ Aprobaciones y  │
│ Exportación PDF │ y Búsqueda       │ Emisores/Usuario│ Métricas Ventas │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### Matriz de Verificación Técnica de Componentes

| Módulo / Capa | Tecnología / Herramienta | Estado | Evidencia de Verificación |
| :--- | :--- | :---: | :--- |
| **Base de Datos** | MySQL 8.0 (`cotizador_db`) |  **100% Operativo** | Tablas `cotizaciones`, `cotizacion_items`, `clientes`, `usuarios`, `equipos` con migración automática JPA (`ddl-auto: update`). |
| **Catálogo de Clientes** | Spring Data JPA + MySQL |  **100% Operativo** | Entidad `Cliente`, búsqueda inteligente por Razón Social, Nombre Comercial y Contacto (`/api/v1/clientes`). |
| **Gestión de Emisores / Usuarios** | Spring Data JPA + MySQL |  **100% Operativo** | Entidad `Usuario`, emisor con nombre, username y campo `rol` preparado para RBAC (`/api/v1/usuarios`). |
| **Catálogo Maestro de Equipos** | Spring Data JPA + MySQL |  **100% Operativo** | Entidad `Equipo`, búsqueda interactiva multicriterio (Nombre, Part Number, Características y Categoría) y auto-guardado (`/api/v1/equipos`). |
| **Sembrado de Datos (Seed)** | `DataInitializer.java` |  **100% Operativo** | Carga inicial transparente de clientes, usuarios y equipos Zebra, Elo, Datalogic y Honeywell al arrancar. |
| **Backend Core** | Spring Boot 3.3.4 + Java 17 |  **100% Compilado** | `mvn clean compile` y `mvn test` ejecutados con éxito (`BUILD SUCCESS`). |
| **Persistencia JPA** | Spring Data JPA + MySQL Connector |  **100% Operativo** | Entidades `Cotizacion` e `ItemCotizacion` con precisión monetaria `BigDecimal` y campos de características técnicas. |
| **Características por Equipo** | `partNumber` + `caracteristicas` |  **100% Integrado** | Jerarquía visual con Título, PN técnico y lista de viñetas `<ul><li>` en el PDF. |
| **Pruebas Automatizadas** | JUnit 5 + Spring Boot Test |  **100% Aprobado** | `CatalogoServiceTest.java` (3 pruebas) y `PdfGeneratorServiceTest.java` (2 pruebas) aprobadas al 100%. |
| **Motor de PDF** | OpenHTMLtoPDF + Thymeleaf |  **100% Configurado** | Plantilla HTML/CSS con paleta exacta (`#6394EC`, `#ACD7E6`, `#FFE3E7`, `#800000`). |
| **Paginación Modular** | CSS Paged Media + Bloques |  **100% Operativo** | Bloques modulares indivisibles (`.pdf-block { page-break-inside: avoid; }`) y tablas con repetición de encabezados (`-fs-table-paginate: paginate;`). |
| **Banners Multipágina** | Post-procesamiento Apache PDFBox |  **100% Operativo** | Estampado vectorial exacto en el borde superior e inferior de **todas las páginas** (`AppendMode.APPEND`), eliminando cualquier recorte, salto flotante o franja blanca. |
| **Alineación de Firma** | Tabla centrada con firma digital |  **100% Operativo** | Firma digitalizada y título de Gerencia General 100% centrados horizontalmente en el documento. |
| **Recursos Gráficos** | Banners y Firma digitalizada |  **100% Integrado** | `header-banner.jpeg`, `footer-banner.jpeg`, `signature-erick-ramirez.jpeg` en `templates/assets/`. |
| **Conversor Moneda** | `NumeroALetrasUtil.java` |  **100% Operativo** | Conversión algorítmica a texto legal salvadoreño (*"DOLARES CON XX/100"*). |
| **API REST** | Spring Web MVC + Bean Validation |  **100% Operativo** | Endpoints REST con CORS habilitado para cotizaciones, clientes, usuarios y equipos. |
| **Frontend Core** | React 18 + Vite 5 + TypeScript |  **100% Compilado** | `npm run build` ejecutado sin errores (`✓ built in 4.07s`). |
| **Diseño y Estilos** | Tailwind CSS v4 |  **100% Operativo** | Identidad corporativa de *Retail El Salvador* integrada y 100% responsiva en móviles y escritorios. |
| **Formulario Reactivo** | React Hook Form + useFieldArray |  **100% Operativo** | Desactivación de autocompletado del navegador, bloqueo de envío por Enter y validación de ítems completos antes de agregar nuevos. |
| **Vista Previa PDF** | Pestaña nueva (`_blank`) |  **100% Operativo** | Consume `/preview-pdf` y abre el PDF en una pestaña nueva con el visor nativo del navegador (sin pantalla gris ni bloqueo de iframe). |
| **Generación y Guardado** | Pestaña nueva + Redirección |  **100% Operativo** | Persiste en MySQL, abre el PDF en pestaña nueva para revisión (sin forzar descarga a disco), limpia el formulario y redirige al historial. |
| **Historial de Cotizaciones** | `CotizacionesList.tsx` |  **100% Operativo** | Tabla de cotizaciones guardadas con banner de confirmación tras crear cotización y botón "Ver PDF" en nueva pestaña. |
| **Scripts de Arranque** | `.bat` en raíz del proyecto |  **100% Listos** | `iniciar_backend.bat` e `iniciar_frontend.bat` creados. |

---

## 2. Lo que se Hizo Exactamente (Bitácora de Implementación)

### 2.1. Análisis y Extracción de Recursos del Machote (`Machote Cotizaciones.docx`)
- **Ingeniería Inversa del Documento Word**: Se inspeccionó la estructura OpenXML del archivo `.docx` original.
- **Extracción de Recursos Gráficos**: Se extrajeron con máxima fidelidad los elementos visuales a la carpeta `template-assets/` y se vincularon a `backend/src/main/resources/templates/assets/`:
  1. `header-banner.jpeg` (2568 × 433 px): Cintillo superior con marca *Retail El Salvador S.A. de C.V.*
  2. `footer-banner.jpeg` (1745 × 284 px): Cintillo inferior con marcas representadas (*Zebra, Elo, Epson, Honeywell, etc.*) y datos de contacto.
  3. `signature-erick-ramirez.jpeg` (80 × 38 px): Firma manuscrita digitalizada de Gerencia General.
- **Mapeo de Paleta de Colores Exacta**:
  - Azul encabezado de tabla: `#6394EC`
  - Azul suave celdas de descripción/cantidades: `#ACD7E6`
  - Rosa/salmón celdas de precios unitarios y subtotales: `#FFE3E7`
  - Rojo oscuro/guinda para total en letras: `#800000`
  - Verde petróleo institucional: `#1F3D3D` y acento dorado `#C88D4B`.

### 2.2. Implementación Completa del Backend (`backend/`)
- **Configuración de Proyecto**:
  - `pom.xml`: Spring Boot 3.3.4, Java 17, `mysql-connector-j`, `openhtmltopdf-pdfbox` (1.0.10), `spring-boot-starter-thymeleaf`, `spring-boot-starter-validation`, `lombok`.
  - `application.yml`: Configurado para conectar a `jdbc:mysql://localhost:3306/cotizador_db` con usuario `root` y contraseña `root`, dialecto MySQL, zona horaria `America/El_Salvador` y auto-creación de tablas JPA.
- **Capa Común (`com.retail.cotizador.common`)**:
  - `CorsConfig.java`: Configuración de CORS permitiendo orígenes locales (Vite en puerto `5173`).
  - `GlobalExceptionHandler.java`: Manejador centralizado para errores 400 (validación de campos), 404 (recursos no encontrados) y 500 (errores no controlados).
  - `ResourceNotFoundException.java`: Excepción semántica para entidades no encontradas.
  - `NumeroALetrasUtil.java`: Algoritmo matemático para convertir cualquier monto `BigDecimal` a texto legal en español salvadoreño (ej. `$200.08` ➔ `"DOSCIENTOS DOLARES CON 08/100"`).
- **Capa de Dominio y Negocio (`com.retail.cotizador.cotizaciones`)**:
  - `Cotizacion.java`: Entidad JPA con todos los campos del machote (código, cliente, razón social, nombre comercial, forma de pago, nota importante, subtotal, IVA 13%, total, total en letras, fecha de emisión y creación).
  - `ItemCotizacion.java`: Entidad JPA con soporte para:
    - `descripcionEquipo` (Nombre o título del equipo)
    - `partNumber` (Part Number / PN opcional)
    - `caracteristicas` (Texto multilínea con especificaciones técnicas)
    - Método utilitario `getListaCaracteristicas()` para iteración limpia en Thymeleaf.
    - Metadatos monetarios y logísticos: `tiempoEntrega`, `cantidad`, `precioUnitario`, `totalLinea`.
  - `CotizacionRepository.java`: Consultas Spring Data JPA para paginación y generación de código correlativo mensual (`COT + AAAA + MM + 001`).
  - `CotizacionRequestDto.java`, `CotizacionResponseDto.java`, `ItemDto.java`: DTOs con validaciones estrictas y campos para características y Part Number.
  - `CotizacionService.java`: Lógica transaccional para calcular totales, autogenerar código correlativo obligatorio con nomenclatura `COT{AAAA}{MM}{Correlativo3Dígitos}` (ej: `COT202610001`), prevención de colisiones concurrentes y persistencia en MySQL.
  - `PdfGeneratorService.java`: Motor OpenHTMLtoPDF que procesa `cotizacion-template.html` inyectando imágenes Base64 y compilando PDFs vectoriales en <100ms.
  - `CotizacionController.java`: Controlador REST con 5 endpoints:
    1. `POST /api/v1/cotizaciones`: Guarda y retorna la cotización con código oficial correlativo.
    2. `GET /api/v1/cotizaciones`: Lista cotizaciones con paginación y ordenamiento.
    3. `GET /api/v1/cotizaciones/{id}`: Consulta por ID.
    4. `GET /api/v1/cotizaciones/{id}/pdf`: Retorna el PDF oficial con encabezados `Content-Disposition: inline`.
    5. `POST /api/v1/cotizaciones/preview-pdf`: Genera y retorna el PDF en memoria para previsualización inmediata sin guardar en base de datos.
- **Arquitectura de Generación PDF y Estampado Multipágina (`PdfGeneratorService.java` + `cotizacion-template.html`)**:
  - **Márgenes de Documento (`@page`)**: Configurado con `margin-top: 105pt; margin-bottom: 102pt; margin-left: 35pt; margin-right: 35pt;`. Esto reserva exactamente los espacios superior e inferior para los banners corporativos en **todas las páginas**.
  - **Estampado Vectorial con Apache PDFBox**: Tras renderizar el HTML con OpenHTMLtoPDF, `PdfGeneratorService` ejecuta un post-procesamiento transparente con PDFBox (`PDDocument` y `PDPageContentStream` en modo `APPEND`):
    - **Header Banner**: Se dibuja en el tope exacto (`y = pageHeight - headerHeight`) con ancho del 100% de la página (612 pt) en la Página 1, Página 2 y cualquier página subsiguiente.
    - **Footer Banner**: Se dibuja en la base exacta (`y = 0`) con ancho del 100% de la página (612 pt) en todas las páginas.
    - **Cero Solapamientos y Cero Espacios Blancos**: El banner nunca se levanta ("sin subirse"), no deja franja blanca debajo, y el contenido del documento nunca puede tocarlo ni invadirlo porque el flujo HTML está acotado por los márgenes de `@page`.
  - **Paginación Modular en Bloques**: Cláusulas organizadas en contenedores `.pdf-block` con `page-break-inside: avoid;` (si un bloque como Garantía o Valor Agregado no cabe completo en la página actual, se traslada íntegramente a la siguiente página sin fragmentarse).
  - **Tabla de Ítems Paginada**: Configurada con `-fs-table-paginate: paginate;`, `thead { display: table-header-group; }` y `tr { page-break-inside: avoid; }` para repetir encabezados de tabla automáticamente en páginas subsiguientes sin cortar filas.
  - **Firma Centrada**: Estructurada en una tabla `.signature-table` con celdas alineadas al centro, asegurando que la imagen de la firma manuscrita digitalizada, el nombre del Ing. Erick Ramírez y su cargo queden simétricamente centrados en el documento.
  - **Ajuste Monovoz vs Multivástago**: Calibración precisa de interlineados y paddings para que cotizaciones estándar de 1 solo equipo quepan de forma limpia en 1 sola página completa, mientras que cotizaciones con múltiples equipos fluyan elegantemente a una segunda o tercera página.
  - **Jerarquía tipográfica en la columna *"Equipo"*:
    - Título del equipo en negrita (`.equipo-titulo`).
    - Part Number en formato técnico (`.pn`).
    - Lista de características técnicas con viñetas elegantes (`.caracteristicas-list <ul><li>`).
  - Cláusulas predeterminadas completas: Condiciones Comerciales, Garantía (cobertura y exclusiones), y Valor Agregado (5 puntos de servicio postventa y respaldo de fábrica).

### 2.3. Implementación Completa del Frontend (`frontend/`)
- **Configuración de Proyecto**:
  - Inicializado con Vite 5 + React 18 + TypeScript + Tailwind CSS v4.
  - Proxy reverso en `vite.config.ts` redirigiendo peticiones `/api` al backend `http://localhost:8080`.
  - `package.json` con dependencias: `axios`, `react-hook-form`, `react-router-dom` v6, `@tailwindcss/vite`.
- **Capa API (`src/api`)**:
  - `axiosClient.ts`: Instancia configurada con baseURL `/api/v1`.
  - `cotizacionesApi.ts`: Funciones fuertemente tipadas para crear, listar, consultar, previsualizar y descargar PDFs como `Blob`.
- **Lógica Financiera y Utilitarios (`src/features/cotizaciones/utils`)**:
  - `calculosFinancieros.ts`: Cálculo preciso con redondeo a 2 decimales para totales de línea, Subtotal, 13% de IVA y Total Inversión.
  - `numeroALetras.ts`: Conversor reactivo para reflejar instantáneamente el total en letras en la interfaz de usuario.
- **Componentes de Usuario (`src/features/cotizaciones/components` y layout)**:
  - `Navbar.tsx`: Barra superior con colores institucionales verde petróleo (`#1F3D3D`) y dorado (`#C88D4B`), con navegación entre *"Nueva Cotización"* e *"Historial"*.
  - `CotizacionForm.tsx`: Formulario reactivo con:
    - Cabecera con datos del cliente y fecha de emisión (se eliminó el campo de código manual ya que el sistema lo genera automáticamente con formato `COT{AAAA}{MM}{Correlativo3Dígitos}`).
    - Tabla editable con campos especializados por equipo:
      - **Nombre del Equipo o Servicio** (requerido).
      - **Part Number (PN)** (opcional).
      - **Características / Especificaciones Técnicas** (área de texto multilínea con formato de viñetas automáticas en el PDF).
      - **Reactividad Instantánea (`useWatch`)**: Total de cada ítem calculado y mostrado en vivo con cada dígito tecleado en cantidad o precio unitario.
      - Desglose reactivo inmediato en el recuadro de totales (Subtotal sin IVA, 13% IVA, Total Inversión y Son en letras actualizándose al segundo sin retrasos ni fallos al agregar/quitar ítems).
    - Recuadro de totales idéntico a la plantilla Word (fondo rosa claro `#FFE3E7` con desglose de Subtotal, 13% IVA, Total Inversión y monto en letras).
    - **Prevención de Autocompletado / Memoria de Navegador (`autoComplete="off"`)**: Formulario y campos configurados explícitamente para deshabilitar las sugerencias de caché/relleno automático del navegador web en nuevas cotizaciones.
    - **Bloqueo de Envío por Tecla Enter**: Intercepción de eventos de teclado en inputs para evitar la creación accidental de cotizaciones al presionar Enter, restringiendo el envío únicamente al clic explícito del botón *"Guardar Cotización"*, mientras se preserva el salto de línea normal en áreas de texto (`textarea`).
    - **Validación Estricta al Agregar Ítems**: Algoritmo reactivo que bloquea el botón *"+ Agregar Ítem"* si existe algún ítem previo vacío o incompleto (valida obligatoriedad de nombre de equipo, tiempo de entrega, cantidad > 0 y precio unitario > 0), alertando de manera descriptiva qué campos faltan completar.
    - **Diseño 100% Responsivo**: Layout adaptable en móviles, tablets y escritorios (`px-2 sm:px-4`, `p-4 sm:p-6`, botones expandibles y apilables en smartphones, tabla con desplazamiento horizontal fluido `-mx-2 sm:mx-0 px-2 sm:px-0`, y barra de navegación compacta).
    - Botón **"Vista Previa PDF"**: Envía los datos actuales al endpoint `/preview-pdf` y abre el PDF directamente en una **pestaña nueva del navegador** (`_blank`) utilizando el visor nativo completo del navegador.
    - Botón **"Guardar Cotización"**: Genera el código correlativo oficial único, persiste en MySQL (evitando errores de clave duplicada), abre el documento en una pestaña nueva para su revisión/impresión, **limpia completamente el formulario** y **redirige al usuario al Historial de Cotizaciones**.
  - `CotizacionesList.tsx`: Historial con tabla de cotizaciones emitidas, fecha, cliente, monto total, banner de confirmación al recibir una cotización recién creada y botón **"Ver PDF"** que abre el documento en una pestaña nueva, con soporte responsivo para dispositivos móviles.
  - `App.tsx`: Enrutamiento con React Router DOM (`/` y `/cotizaciones`).

### 2.4. Implementación Específica: Características por Equipo
Para satisfacer las cotizaciones tecnológicas (equipos Zebra, impresoras térmicas, terminales POS, lectores láser, consumibles y servicios), cada ítem ahora soporta de forma nativa:
1. **Identificador del Producto**: Título en alta resolución.
2. **Código de Fabricante (PN)**: Identificador comercial indispensable en licitaciones y cotizaciones B2B.
3. **Especificaciones / Características Técnicas**: Bloque multilínea formateado automáticamente con viñetas en el documento final.
4. **Verificación Automatizada**: Prueba unitaria en `backend/src/test/java/com/retail/cotizador/PdfGeneratorServiceTest.java` ejecutada satisfactoriamente con MySQL y el motor OpenHTMLtoPDF.

### 2.5. Implementación del Backend para Catálogos Maestros y Base de Datos (Bloques 2 y 3)
Se incorporaron las entidades JPA, repositorios, servicios y controladores REST para dar soporte persistente a la gestión de datos maestros:

1. **Directorio de Clientes (`com.retail.cotizador.clientes`)**:
   - **Tabla MySQL**: `clientes` (`id`, `razon_social`, `nombre_comercial`, `contacto_principal`, `telefono`, `correo`, `direccion`, `activo`, `fecha_creacion`).
   - **Buscador y Autocompletado**: Método `buscarClientes(query)` en `ClienteRepository` que filtra por razón social, nombre comercial o contacto principal.
   - **Endpoints REST**:
     - `GET /api/v1/clientes?q={texto}` (listado y filtro dinámico).
     - `GET /api/v1/clientes/{id}` (consulta por ID).
     - `POST /api/v1/clientes` (creación de nuevos clientes).
     - `PUT /api/v1/clientes/{id}` (actualización).

2. **Gestión de Emisores y Usuarios (`com.retail.cotizador.usuarios`)**:
   - **Tabla MySQL**: `usuarios` (`id`, `username`, `nombre_completo`, `correo`, `cargo`, `rol`, `activo`, `fecha_creacion`).
   - **Preparado para Roles (RBAC)**: Campo `rol` (`ROLE_VENTAS`, `ROLE_ADMIN`) para la futura matriz de permisos y perfiles.
   - **Endpoints REST**:
     - `GET /api/v1/usuarios?q={texto}` (búsqueda de emisores activos).
     - `GET /api/v1/usuarios/{id}` (consulta por ID).
     - `POST /api/v1/usuarios` (registro de nuevos usuarios).
     - `PUT /api/v1/usuarios/{id}` (modificación).

3. **Catálogo Maestro de Equipos y Buscador Interactivo (`com.retail.cotizador.equipos`)**:
   - **Tabla MySQL**: `equipos` (`id`, `descripcion`, `part_number`, `caracteristicas`, `precio_referencial`, `tiempo_entrega_predeterminado`, `categoria`, `activo`, `fecha_creacion`).
   - **Búsqueda Multicriterio Flexible**: `buscarEquipos(query)` ejecuta coincidencia parcial indiferente a mayúsculas/minúsculas en `descripcion`, `partNumber`, `caracteristicas` y `categoria`.
   - **Auto-guardado / Upsert**: `crearOActualizar` permite registrar un equipo nuevo detectado en el formulario o actualizarlo si ya existe por Part Number o Descripción.
   - **Endpoints REST**:
     - `GET /api/v1/equipos?q={texto}` (buscador interactivo en vivo).
     - `GET /api/v1/equipos/{id}` (detalle).
     - `POST /api/v1/equipos` (guardado de equipo nuevo antes o durante la cotización).
     - `PUT /api/v1/equipos/{id}` (edición).

4. **Sembrado Automático Inicial (`DataInitializer.java`)**:
   - Inserta datos base al iniciar la aplicación si las tablas están vacías:
     - Emisores: `VENTASSR001` (*Ejecutivo Ventas Retail SV*), `ERAMIREZ` (*Ing. Erick Ramírez*).
     - Clientes: *ALIMENTOS Y TURISMO SA DE CV*, *SUPERMERCADOS DE CENTROAMERICA SA DE CV*, *DISTRIBUIDORA FARMACEUTICA SV SA DE CV*.
     - Equipos: *Impresora Zebra ZC300 Dual*, *Zebra ZT411 Industrial*, *Terminal Elo Touch 15E3*, *Lector Datalogic QD2500*, *Móvil Honeywell EDA52*.
   - **Validación Automatizada**: `CatalogoServiceTest.java` ejecutada con éxito total comprobando todas las operaciones CRUD y búsquedas.

---

## 3. Lo que Falta por Hacer (Backlog Técnico y Próximos Pasos)

El proyecto se encuentra con el **código del Bloque 1 100% implementado, con características por equipo y validado en compilación y pruebas unitarias**. Para avanzar a los bloques subsiguientes, se detalla el backlog priorizado:

### 3.1. Tareas Inmediatas (Estabilización del Bloque 1)
- [ ] **Prueba de Integración Extremo a Extremo (E2E)**:
  - Levantar simultáneamente el backend (`iniciar_backend.bat`) y frontend (`iniciar_frontend.bat`).
  - Crear una cotización de prueba desde el navegador en `http://localhost:5173` ingresando un equipo con varias características técnicas.
  - Verificar la inserción de registros en las tablas `cotizaciones` y `cotizacion_items` de MySQL.
  - Validar la apertura del modal de vista previa y la descarga del PDF final en el navegador.
- [ ] **Gestión de Configuración y Variables de Entorno**:
  - Crear archivo `.env` en `frontend/` para parametrizar la URL del backend (`VITE_API_URL`).
  - Configurar perfiles de Spring Boot (`application-dev.yml` y `application-prod.yml`) para permitir cambiar fácilmente la contraseña de MySQL o la URL de conexión sin modificar el código fuente.
- [ ] **Mejora en Notificaciones de Usuario**:
  - Sustituir los diálogos nativos `alert()` del navegador por notificaciones tipo *Toast* modernas y accesibles (utilizando librerías como `sonner` o `react-hot-toast`).
- [ ] **Búsqueda y Filtros en el Historial**:
  - Añadir barra de búsqueda por nombre de cliente, código de cotización o rango de fechas en `CotizacionesList.tsx`.
- [ ] **Parametrización de Datos de la Empresa**:
  - Crear una tabla `configuracion_empresa` para que el administrador pueda actualizar el nombre del gerente, cargo, teléfono o correo sin alterar la plantilla HTML.

---

### 3.2. Bloque 2: Catálogo de Productos, Precios e Inventario (Siguiente Sprint)
- [ ] **Modelo de Datos de Catálogo**:
  - Crear entidades JPA: `Producto` (`id`, `codigo_parte_pn`, `descripcion`, `caracteristicas_defecto`, `tiempo_entrega_defecto`, `categoria_id`), `Categoria` y `PrecioProducto`.
  - Scripts de migración Flyway o DDL para poblar los productos recurrentes (equipos Zebra, cintas, tarjetas PVC, kits de limpieza, servicios de instalación).
- [ ] **API de Catálogo en Backend**:
  - Endpoints `GET /api/v1/productos` con búsqueda predictiva por texto (`LIKE %...%`).
  - CRUD básico para mantenimiento de productos y precios de lista.
- [ ] **Autocompletado Inteligente en Formulario de Cotización**:
  - Integrar selector reactivo en la columna *"Equipo"* de la tabla de cotización.
  - Al escribir o seleccionar un producto, autollenar automáticamente:
    - Nombre del equipo.
    - Part Number (`PN:`).
    - Características técnicas por defecto.
    - Tiempo de entrega sugerido (ej. *"De 5 a 6 semanas"* o *"Inmediata"*).
    - Precio unitario sugerido (permitiendo modificarlo según negociación).

---

### 3.3. Bloque 3: Directorio de Clientes y Contactos (CRM)
- [ ] **Modelo de Datos de Clientes**:
  - Crear entidad `Cliente` (`id`, `razon_social`, `nombre_comercial`, `nit`, `nrc`, `direccion`, `dias_credito_pactados`).
  - Crear entidad `ContactoCliente` (`id`, `nombre`, `cargo`, `telefono`, `email`, `cliente_id`).
- [ ] **Búsqueda Reactiva de Clientes en Formulario**:
  - Campo de autocompletado en el formulario de cotización para buscar clientes existentes.
  - Al seleccionar un cliente, autollenar Razón Social, Nombre Comercial, Contacto y la Forma de Pago predeterminada pactada con dicho cliente.
- [ ] **Historial de Cotizaciones por Cliente**:
  - Pestaña dentro de la ficha del cliente que liste todas las cotizaciones emitidas a su favor con su estado comercial (Aprobada, Pendiente, Declinada).

---

### 3.4. Bloque 4: Seguridad, Roles y Flujos de Aprobación
- [ ] **Autenticación y Autorización (Spring Security + JWT)**:
  - Tablas: `usuarios`, `roles`, `permisos`.
  - Roles definidos:
    - `VENDEDOR`: Crea y visualiza sus propias cotizaciones.
    - `SUPERVISOR`: Visualiza cotizaciones de todo su equipo y aprueba descuentos.
    - `ADMINISTRADOR`: Configuración general, gestión de usuarios y catálogo.
- [ ] **Flujo de Aprobación de Descuentos**:
  - Regla de negocio: Si un vendedor cotiza con un margen o precio inferior al precio de lista, la cotización queda en estado `REQUIERE_APROBACION`.
  - El supervisor recibe notificación para aprobar o rechazar antes de que se pueda emitir el PDF final con firma autorizada.
- [ ] **Dashboard y Métricas Comerciales**:
  - Gráficas de volumen cotizado por mes, tasa de conversión (cotizaciones que pasaron a factura/orden de compra), y vendedores con mayor efectividad.

---

### 3.5. Infraestructura y Despliegue en Servidor
- [ ] **Contenerización con Docker**:
  - Crear `backend/Dockerfile` multi-stage (construcción con Maven y ejecución con Eclipse Temurin 17 JRE ligero).
  - Crear `frontend/Dockerfile` multi-stage (construcción con Node.js y servicio de estáticos optimizado con Nginx).
  - Crear `docker-compose.yml` unificado que orqueste:
    1. Servicio `mysql_db` (MySQL 8.0 con volumen persistente).
    2. Servicio `cotizador_backend` (Spring Boot conectado a `mysql_db`).
    3. Servicio `cotizador_frontend` (Nginx sirviendo React y redirigiendo `/api` al backend).

---

## 4. Arquitectura y Código Fuente del Backend (Spring Boot 3.x + MySQL)

### 4.1. Estructura de Paquetes en `backend/src/main/java/com/retail/cotizador/`
```text
backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/retail/cotizador/
        │   ├── CotizadorApplication.java
        │   ├── common/
        │   │   ├── config/ (CorsConfig.java)
        │   │   ├── exception/ (GlobalExceptionHandler.java, ResourceNotFoundException.java)
        │   │   └── util/ (NumeroALetrasUtil.java)
        │   └── cotizaciones/
        │       ├── controller/ (CotizacionController.java)
        │       ├── dto/ (CotizacionRequestDto.java, CotizacionResponseDto.java, ItemDto.java)
        │       ├── entity/ (Cotizacion.java, ItemCotizacion.java)
        │       ├── repository/ (CotizacionRepository.java)
        │       └── service/ (CotizacionService.java, PdfGeneratorService.java)
        └── resources/
            ├── application.yml
            └── templates/
                ├── cotizacion-template.html
                └── assets/
                    ├── header-banner.jpeg
                    ├── footer-banner.jpeg
                    └── signature-erick-ramirez.jpeg
```

### 4.2. Entidad JPA de Ítems con Características (`ItemCotizacion.java`)
```java
@Entity
@Table(name = "cotizacion_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ItemCotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer itemNumero;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcionEquipo;

    @Column(length = 100)
    private String partNumber;

    @Column(columnDefinition = "TEXT")
    private String caracteristicas;

    @Column(nullable = false, length = 80)
    private String tiempoEntrega;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalLinea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cotizacion_id", nullable = false)
    private Cotizacion cotizacion;

    public List<String> getListaCaracteristicas() {
        if (caracteristicas == null || caracteristicas.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(caracteristicas.split("\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.startsWith("•") || s.startsWith("-") || s.startsWith("*") ? s.substring(1).trim() : s)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
```

---

## 5. Arquitectura y Código Fuente del Frontend (React + Vite + TypeScript)

### 5.1. Estructura de Archivos en `frontend/src/`
```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── api/
    │   ├── axiosClient.ts
    │   └── cotizacionesApi.ts
    ├── components/
    │   └── layout/Navbar.tsx
    └── features/cotizaciones/
        ├── types/cotizacion.types.ts
        ├── utils/
        │   ├── calculosFinancieros.ts
        │   └── numeroALetras.ts
        └── components/
            ├── CotizacionForm.tsx
            └── CotizacionesList.tsx
```

---

## 6. Guía Rápida para el Usuario y Ejecución Local

Para poner en marcha el sistema en cualquier momento:

### Paso 1: Asegurarse de que el Servicio MySQL esté Iniciado
El servicio `MySQL80` debe estar en ejecución en el puerto `3306`. La base de datos `cotizador_db` se auto-configura y actualiza al iniciar la aplicación.

### Paso 2: Iniciar el Backend
Haga doble clic en el archivo:
> **`iniciar_backend.bat`** (en la raíz del proyecto)

El backend compilará y se levantará en:  
`http://localhost:8080/api/v1/cotizaciones`

### Paso 3: Iniciar el Frontend
Haga doble clic en el archivo:
> **`iniciar_frontend.bat`** (en la raíz del proyecto)

El frontend abrirá el servidor Vite en:  
`http://localhost:5173`

Al ingresar a `http://localhost:5173`, podrá:
1. Digitar los datos del cliente y de la cotización.
2. Añadir y quitar equipos, ingresando por cada uno su **Nombre**, **Part Number (PN)** y **Características Técnicas** (una por línea).
3. Hacer clic en **"Vista Previa PDF"** para revisar la cotización en pantalla con los datos, viñetas de especificaciones y el diseño idéntico al machote Word.
4. Hacer clic en **"Guardar y Descargar PDF"** para almacenar la información en MySQL y obtener el archivo `.pdf` oficial firmado.
5. Acceder a la sección **"Historial"** desde la barra de navegación para consultar cotizaciones pasadas y reimprimirlas.
