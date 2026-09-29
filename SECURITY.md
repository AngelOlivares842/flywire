# Política de Seguridad (*Security Policy*)

En el proyecto **NeuroLab 3D**, nos tomamos muy en serio la seguridad, estabilidad e integridad del software y de los datos científicos que procesamos. Esta política describe cómo reportar vulnerabilidades de seguridad y qué medidas preventivas rigen en la arquitectura del proyecto.

---

## 🛡️ Versiones Soportadas

Actualmente se proporciona soporte activo de seguridad para las siguientes versiones:

| Versión | Estado de Soporte |
| :---: | :---: |
| `main` (desarrollo activo) | :white_check_mark: Soportada |
| `< 0.0.1` | :x: No soportada |

---

## 🚨 Reporte de Vulnerabilidades

Si descubres una posible vulnerabilidad de seguridad en este repositorio, **te solicitamos no divulgarla públicamente** a través de issues de GitHub, discusiones o redes sociales hasta que haya sido evaluada y mitigada.

### Canales de Notificación
Para coordinar una divulgación responsable (*Coordinated Vulnerability Disclosure*):
1. **GitHub Security Advisories (Recomendado):** Dirígete a la pestaña **Security** del repositorio en GitHub y selecciona **Report a vulnerability**.
2. **Contacto Directo:** Envía un correo electrónico a `angel.olivares.rosas2@gmail.com` (o al mantenedor principal del repositorio) con el asunto `[SECURITY] Reporte de vulnerabilidad en NeuroLab 3D`.

### Información a Incluir en el Reporte
- Descripción detallada de la vulnerabilidad observada.
- Pasos precisos para reproducir el fallo o código de prueba de concepto (*PoC*).
- Impacto potencial estimado (por ejemplo: fuga de secretos, denegación de servicio del navegador, inyección de código).
- Entorno de prueba (navegador, versión de Node.js, sistema operativo, modelo de GPU).

### Compromiso de Respuesta
- **Recepción y confirmación inicial:** En un plazo máximo de **48 horas**.
- **Evaluación y remediación:** Se mantendrá comunicación periódica con la persona reportante mientras se prepara un parche de seguridad.

---

## 🔒 Consideraciones de Seguridad en la Arquitectura

### 1. Protección de Credenciales y Claves de API
- Las claves de servicios en la nube (como `GEMINI_API_KEY`) **nunca deben exponerse en el código cliente** ni compilarse en los bundles estáticos de Vite.
- Las consultas que requieran claves privadas deben encapsularse exclusivamente en endpoints de servidor o funciones serverless (`src/pages/api/`).
- El archivo `.env` está explicitado en `.gitignore` para prevenir compromisos accidentales de credenciales.

### 2. Seguridad en Renderizado WebGL y WebGPU
- **Agotamiento de Memoria GPU (*Resource Exhaustion / OOM*):** Todos los buffers de geometría y texturas tienen límites de asignación estrictos para prevenir el bloqueo o cierre forzado del navegador en dispositivos con baja memoria de video.
- **Workers Aislados:** El motor de inferencia local en WebGPU opera en un `Worker` dedicado (`aiWorker.js`), evitando bloquear el hilo principal (*main thread*) de la interfaz de usuario en caso de sobrecarga computacional.

### 3. Integridad y Sanitización de Datos Científicos
- Los archivos de conectoma (`brain_data.json`, datos de morfología SWC) se procesan como estructuras de datos fuertemente tipadas y validadas, mitigando ataques de deserialización o inyección de prototipos.
- Los metadatos mostrados al usuario en tooltips 3D y paneles HUD se renderizan a través de React con escape automático de caracteres para neutralizar vectores de ataque XSS (*Cross-Site Scripting*).

---

Agradecemos enormemente la labor de los investigadores de seguridad y desarrolladores que contribuyen a mantener este proyecto seguro y confiable para toda la comunidad científica.
