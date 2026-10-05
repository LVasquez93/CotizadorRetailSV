# GUÍA DE DESPLIEGUE A PRODUCCIÓN
## Frontend (Cloudflare Pages) + Backend (Render) + Base de Datos (Aiven MySQL)

> **AVISO IMPORTANTE**: Este documento es exclusivamente una **guía técnica paso a paso**. No se ha aplicado ningún cambio en el código fuente del proyecto para preservar su funcionamiento actual en entorno de desarrollo local (`dev`).

---

## 1. Diagnóstico: Estado Actual (`dev`) vs. Estado Requerido (`prod`)

Actualmente, el proyecto está configurado para operar en un entorno de desarrollo local monomáquina. Para migrarlo a la nube, es necesario desacoplar las dependencias fijas y parametrizarlas mediante variables de entorno:

| Componente | Estado Actual (`dev`) | Problema en Producción | Cambio Necesario (`prod`) |
| :--- | :--- | :--- | :--- |
| **Backend: Base de Datos** | `localhost:3306`, user `root`, pass `1234`, `useSSL=false` | No conecta a una BD remota en la nube. | Parametrizar URL, usuario, contraseña y forzar `sslMode=REQUIRED` (Aiven). |
| **Backend: Puerto HTTP** | Fijo en `8080`. | Render asigna un puerto dinámico mediante `$PORT`. | Configurar `server.port: ${PORT:8080}`. |
| **Backend: CORS** | Fijo en `http://localhost:5173` y `127.0.0.1:5173`. | El navegador bloqueará las peticiones desde el dominio de Cloudflare. | Inyectar dominios permitidos desde variable de entorno `CORS_ALLOWED_ORIGINS`. |
| **Backend: Secreto JWT** | Clave fija en `application.yml`. | Riesgo de seguridad en producción. | Inyectar `JWT_SECRET` seguro desde variable de entorno. |
| **Backend: PDF / Fuentes** | Renderizado en Windows local. | Contenedores Linux en Render no tienen fuentes TTF por defecto; PDFBox puede fallar. | Crear `Dockerfile` instalando `fontconfig` y `ttf-dejavu`. |
| **Frontend: Base URL API** | Relativo `/api/v1` mediante proxy de Vite (`vite.config.ts`). | Cloudflare Pages sirve archivos estáticos puros, no tiene proxy Vite activo. | Usar `import.meta.env.VITE_API_BASE_URL` en `axiosClient.ts`. |
| **Frontend: Rutas SPA** | Rutas manejadas por el servidor de desarrollo de Vite. | Al recargar en `/cotizaciones` en Cloudflare dará `Error 404: Not Found`. | Agregar archivo `public/_redirects` con regla `/* /index.html 200`. |

---

## 2. Fase 1: Base de Datos en Aiven (Cloud MySQL)

Aiven ofrece instancias de MySQL gestionadas con alta disponibilidad y SSL obligatorio.

### Pasos en Aiven:
1. Regístrate o inicia sesión en [Aiven Console](https://console.aiven.io/).
2. Haz clic en **Create Service**.
3. Selecciona **MySQL**.
4. Elige el Cloud Provider y Región más cercana (recomendado: **AWS** o **GCP** en la misma región geográfica donde alojes Render, ej. `us-east-1` o `us-central` para minimizar la latencia de red).
5. Elige el plan (Free Tier o Startup).
6. Asigna un nombre al servicio (ej: `cotizador-mysql-prod`) y crea el servicio.
7. Una vez activo el servicio, en la pestaña **Overview**:
   - Copia los datos de conexión:
     - **Host**: `mysql-xxxx.aivencloud.com`
     - **Port**: `xxxxx` (ej. `12345` o `25060`)
     - **User**: `avnadmin`
     - **Password**: *(tu contraseña generada)*
     - **Database**: `defaultdb` (o crea una base llamada `cotizador_db` en la pestaña *Databases*).
   - Descarga o ten presente el certificado CA si fuera requerido, aunque con el parámetro JDBC `sslMode=REQUIRED` y `allowPublicKeyRetrieval=true` el conector de MySQL se autentica directamente.

### Cadena de Conexión JDBC para Aiven:
```text
jdbc:mysql://<HOST>:<PORT>/<DATABASE>?sslMode=REQUIRED&serverTimezone=America/El_Salvador&allowPublicKeyRetrieval=true
```

---

## 3. Fase 2: Cambios Requeridos en el Backend (Spring Boot)

### 3.1. Parametrizar `backend/src/main/resources/application.yml`
Actualmente el archivo tiene valores fijos. Debe modificarse para aceptar variables de entorno con valores por defecto para que siga funcionando localmente si no se pasan variables:

```yaml
server:
  port: ${PORT:8080}

spring:
  application:
    name: cotizador-backend
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/cotizador_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=America/El_Salvador&allowPublicKeyRetrieval=true}
    username: ${SPRING_DATASOURCE_USERNAME:root}
    password: ${SPRING_DATASOURCE_PASSWORD:1234}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: ${HIKARI_MAX_POOL_SIZE:5} # Aiven Free limita el número de conexiones
      minimum-idle: 1
      idle-timeout: 300000
      max-lifetime: 900000
  jpa:
    open-in-view: true
    hibernate:
      ddl-auto: ${HIBERNATE_DDL_AUTO:update}
    show-sql: false
    properties:
      hibernate:
        format_sql: false
  thymeleaf:
    check-template-location: true
    prefix: classpath:/templates/
    suffix: .html
    mode: HTML
    encoding: UTF-8

jwt:
  secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
  expiration-ms: ${JWT_EXPIRATION_MS:86400000} # 24 horas

cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://127.0.0.1:5173}
```

---

### 3.2. Adaptar la configuración CORS en Java
Tanto en `CorsConfig.java` como en `SecurityConfig.java`, los orígenes permitidos deben leerse de la variable `${cors.allowed-origins}`:

#### A. En `backend/src/main/java/com/retail/cotizador/common/config/CorsConfig.java`:
```java
package com.retail.cotizador.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toArray(String[]::new);

        registry.addMapping("/**")
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Disposition")
                .allowCredentials(true);
    }
}
```

#### B. En `backend/src/main/java/com/retail/cotizador/auth/security/SecurityConfig.java`:
Inyectar `@Value("${cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}") private String allowedOrigins;` y alimentar el bean `corsConfigurationSource()`:

```java
    @Value("${cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
```

---

### 3.3. Crear `Dockerfile` para Render (Crucial para Generación de PDF)
La librería `openhtmltopdf-pdfbox` y `pdfbox` requieren fuentes tipográficas del sistema operativo para calcular anchos de texto e incrustar tipografías. En una imagen Linux mínima estándar (Alpine o Slim), si faltan fuentes, la generación del PDF arrojará errores.

Crear el archivo `backend/Dockerfile`:
```dockerfile
# Etapa 1: Construcción
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de ejecución liviana con fuentes tipográficas
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Instalar fuentes requeridas para OpenHTMLtoPDF y PDFBox
RUN apk add --no-cache fontconfig ttf-dejavu

# Copiar el artefacto generado
COPY --from=build /app/target/cotizador-backend-*.jar app.jar

# Puerto asignado dinámicamente por Render
ENV PORT=8080
EXPOSE ${PORT}

# Parámetros de memoria optimizados para contenedores de 512MB (Render Free/Starter)
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.awt.headless=true -jar app.jar"]
```

---

## 4. Fase 3: Despliegue del Backend en Render

Render permite desplegar el backend mediante Dockerfile conectado a tu repositorio de GitHub o GitLab.

### Pasos en Render:
1. Crea una cuenta en [Render.com](https://render.com/).
2. En el panel principal, haz clic en **New +** > **Web Service**.
3. Conecta el repositorio de GitHub de este proyecto.
4. En la configuración del servicio:
   - **Name**: `cotizador-backend`
   - **Region**: La misma o más cercana a la base de datos de Aiven (ej. *Oregon (US West)* u *Ohio (US East)*).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** (Render detectará automáticamente el `Dockerfile` creado en `backend/`).
   - **Instance Type**: Free (o Starter $7/mes para evitar el apagado por inactividad).
5. En la sección **Environment Variables**, agregar las siguientes claves:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://mysql-xxxx.aivencloud.com:12345/defaultdb?sslMode=REQUIRED&serverTimezone=America/El_Salvador&allowPublicKeyRetrieval=true` | URL de conexión de Aiven con SSL activo. |
| `SPRING_DATASOURCE_USERNAME` | `avnadmin` | Usuario administrador de Aiven. |
| `SPRING_DATASOURCE_PASSWORD` | `AVNS_xxxxxxxxxxxxxx` | Contraseña provista por Aiven. |
| `JWT_SECRET` | `UnaCadenaHexSeguraDeMinimo64Caracteres1234567890abcdefABCDEF1234567890` | Clave secreta para firmar tokens JWT. |
| `CORS_ALLOWED_ORIGINS` | `https://cotizador-frontend.pages.dev,https://tudominio.com` | Dominio que asignará Cloudflare Pages. |
| `HIBERNATE_DDL_AUTO` | `update` | Crea las tablas automáticamente en el primer arranque. |
| `HIKARI_MAX_POOL_SIZE` | `5` | Límite seguro para no saturar las conexiones de Aiven. |

6. Haz clic en **Create Web Service**.
7. Render compilará la imagen Docker y levantará el backend. Al finalizar, te dará la URL pública:  
   `https://cotizador-backend.onrender.com`

> **Nota sobre el modo suspensión de Render Free**:  
> Si usas la versión gratuita de Render, la instancia se suspenderá tras 15 minutos sin tráfico. La primera petición tras la inactividad tardará unos 30-40 segundos mientras Spring Boot arranca. Puedes configurar un monitor gratuito en [UptimeRobot.com](https://uptimerobot.com) que haga ping cada 10 minutos al endpoint `/api/v1/sucursales` para mantenerlo despierto.

---

## 5. Fase 4: Cambios Requeridos en el Frontend (React + Vite)

### 5.1. Adaptar `frontend/src/api/axiosClient.ts`
Actualmente tiene `baseURL: '/api/v1'`. En Cloudflare Pages debe apuntar a la URL pública de Render inyectada en tiempo de compilación:

```typescript
import axios from 'axios';

// En producción tomará la variable de entorno de Vite; en desarrollo local usará '' (proxy local)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Bearer Token en cada solicitud HTTP
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cotizador_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para capturar expiración o rechazo de credenciales (401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('cotizador_token');
      localStorage.removeItem('cotizador_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
```

---

### 5.2. Crear Regla de Enrutamiento SPA: `frontend/public/_redirects`
React Router utiliza HTML5 History API (`BrowserRouter`). En un hosting estático como Cloudflare Pages, si el usuario recarga la página en `https://tuapp.pages.dev/cotizaciones`, el servidor buscará un archivo `/cotizaciones/index.html` que no existe y arrojará un error 404.

Crear el archivo `frontend/public/_redirects` con el siguiente contenido exacto:
```text
/*    /index.html   200
```
*(Vite copia automáticamente todo el contenido de `public/` a la carpeta de salida `dist/`).*

---

### 5.3. Crear Archivo de Plantilla de Variables: `frontend/.env.example`
Crear `frontend/.env.example` como referencia:
```env
# URL base del backend en Render (sin slash al final)
VITE_API_BASE_URL=https://cotizador-backend.onrender.com
```

---

## 6. Fase 5: Despliegue del Frontend en Cloudflare Pages

Cloudflare Pages compila y aloja la aplicación en su red perimetral global ultrarrápida de forma gratuita.

### Pasos en Cloudflare:
1. Inicia sesión en [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. En el menú lateral izquierdo, ve a **Compute (Workers) > Workers & Pages**.
3. Haz clic en **Create application** > pestaña **Pages** > **Connect to Git**.
4. Selecciona tu repositorio y la rama (`main`).
5. Configura los parámetros de compilación (**Build settings**):
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. En la sección **Environment variables (advanced)**, agrega:

| Variable | Valor |
| :--- | :--- |
| `NODE_VERSION` | `20` (o `18`) |
| `VITE_API_BASE_URL` | `https://cotizador-backend.onrender.com` *(la URL generada por Render)* |

7. Haz clic en **Save and Deploy**.
8. Cloudflare instalará las dependencias, ejecutará `npm run build` y publicará el sitio en un dominio con HTTPS automático, por ejemplo:  
   `https://cotizador-frontend.pages.dev`
9. **Paso de retroalimentación final**:  
   Copia el dominio asignado por Cloudflare (`https://cotizador-frontend.pages.dev`) y añádelo a la variable de entorno `CORS_ALLOWED_ORIGINS` en el panel de **Render** para que el backend acepte las peticiones.

---

## 7. Fase 6: Pruebas de Humo en Producción (Smoke Test)

Una vez completado el despliegue de las 3 piezas, verificar los siguientes flujos críticos:

1. **Verificación de Base de Datos y Siembra Inicial**:
   - Revisa los logs de Render durante el arranque. Debe aparecer:
     ```text
     c.r.c.common.config.DataInitializer : Verificando y asegurando credenciales y sucursales de usuarios...
     c.r.c.common.config.DataInitializer : Datos de inicialización verificados exitosamente.
     ```
   - Esto confirma que las tablas se crearon en Aiven y los usuarios (`admin`, `gerente`, `vendedor1`, `vendedor2`) y sucursales fueron sembrados.

2. **Prueba de Autenticación**:
   - Abre la URL de Cloudflare: `https://cotizador-frontend.pages.dev`.
   - Inicia sesión con `admin` / `admin123`.
   - Inspecciona la consola de red: el endpoint `POST https://cotizador-backend.onrender.com/api/v1/auth/login` debe responder con código `200 OK` y devolver el Bearer Token.

3. **Prueba de Navegación Directa (SPA)**:
   - Estando logueado, navega a `/cotizaciones`.
   - Presiona `F5` (recargar página).
   - Debe recargar la vista del historial correctamente sin mostrar error 404 de Cloudflare (gracias a `_redirects`).

4. **Prueba de Generación de PDF**:
   - Genera una cotización de prueba o pulsa "Vista Previa PDF".
   - Verifica que el PDF descargue o previsualice con:
     - El encabezado gráfico superior.
     - Los colores corporativos de tabla.
     - La firma digital estampada.
     - El banner de pie de página.
   - Si el PDF se genera correctamente, confirma que el contenedor Docker de Render tiene todas las fuentes tipográficas operativas.

---

## Resumen de Archivos a Tocar Cuando Decidas Pasar a Producción

Cuando estés listo para aplicar los cambios en el código, estos son los únicos 4 archivos que se deben modificar/crear:
1. `backend/src/main/resources/application.yml` (parametrizar con `${...}`).
2. `backend/src/main/java/com/retail/cotizador/common/config/CorsConfig.java` y `SecurityConfig.java` (leer `allowedOrigins`).
3. `backend/Dockerfile` (crear para el empaquetado de Render con fuentes).
4. `frontend/src/api/axiosClient.ts` (leer `VITE_API_BASE_URL`).
5. `frontend/public/_redirects` (crear para el enrutamiento de Cloudflare).
