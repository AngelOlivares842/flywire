# Guía de Contribución a NeuroLab 3D (*Contributing Guidelines*)

¡Gracias por tu interés en contribuir a **NeuroLab 3D**! Este proyecto se encuentra en la intersección de la **neurociencia computacional**, la **computación gráfica de alto rendimiento (WebGL/WebGPU)** y el **desarrollo web moderno**.

Para mantener la excelencia técnica y el rigor científico de la plataforma, solicitamos a todos los colaboradores seguir estas directrices.

---

## 📋 Índice

1. [Código de Conducta](#1-código-de-conducta)
2. [Política Estricta de Rigor Científico](#2-política-estricta-de-rigor-científico)
3. [Cómo Empezar](#3-cómo-empezar)
4. [Flujo de Trabajo de Desarrollo (Git Workflow)](#4-flujo-de-trabajo-de-desarrollo-git-workflow)
5. [Estándares de Código y Calidad](#5-estándares-de-código-y-calidad)
   - [5.1 Gráficos 3D y Three.js](#51-gráficos-3d-y-threejs)
   - [5.2 Simulación Biofísica y Cinemática](#52-simulación-biofísica-y-cinemática)
   - [5.3 Frontend React / Astro](#53-frontend-react--astro)
6. [Convenciones de Commits](#6-convenciones-de-commits)
7. [Proceso de Revisión de Pull Requests (PR)](#7-proceso-de-revisión-de-pull-requests-pr)

---

## 1. Código de Conducta

Este proyecto fomenta un ambiente colaborativo, inclusivo y respetuoso. Se espera que todos los participantes traten a los demás con empatía, profesionalismo y constructividad, independientemente de su nivel de experiencia, procedencia académica o antecedentes técnicos.

---

## 2. Política Estricta de Rigor Científico

> [!IMPORTANT]
> **Tolerancia Cero a Datos Biológicos Sintéticos o Falsificados.**
> Todo modelo, coordenada, sinapsis o propiedad funcional agregada al proyecto debe estar rigurosamente respaldada por literatura científica o bases de datos validadas de microscopía electrónica.

- **Conectoma:** Las neuronas y sinapsis deben provenir de fuentes abiertas auditadas (p. ej., consorcio **FlyWire**, **FAFB v783**, **neuPrint**, **hemibrain** de Janelia Research Campus).
- **Morfologías SWC:** Cualquier archivo de árbol axonal o dendrítico debe corresponder a trazados reales generados por reconstrucción de microscopía electrónica.
- **Circuitos y Neurotransmisores:** Las asignaciones de neurotransmisores (`ACH`, `GABA`, `GLUT`, `DA`, `SER`, `OCT`) deben mantener coherencia con los clasificadores sinápticos publicados por el laboratorio de Princeton y colaboradores.

---

## 3. Cómo Empezar

### Requisitos Previos
- **Node.js**: Versión $\ge 22.12.0$ (requerido por `package.json`).
- **Navegador Moderno**: Con soporte completo para WebGL 2.0 y preferiblemente WebGPU activado (Chrome $\ge 113$, Firefox Developer Edition, Edge).
- **Git** configurado en tu máquina local.

### Configuración del Entorno Local

1. Realiza un fork del repositorio en GitHub.
2. Clona tu bifurcación:
   ```bash
   git clone https://github.com/TU-USUARIO/flywire.git
   cd flywire
   ```
3. Instala las dependencias del proyecto:
   ```bash
   npm install
   # o bien: pnpm install
   ```
4. Configura las variables de entorno (opcional para IA en la nube):
   Copia el archivo `.env.example` o crea `.env` en la raíz:
   ```env
   GEMINI_API_KEY=tu_clave_de_api_aqui
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:4321/` en tu navegador.

---

## 4. Flujo de Trabajo de Desarrollo (Git Workflow)

1. **Crea una rama (*branch*) descriptiva** a partir de `main`:
   - Nuevas funcionalidades: `feat/nombre-funcionalidad`
   - Corrección de errores: `fix/descripcion-del-bug`
   - Mejoras en la simulación biofísica: `neuro/nombre-del-modelo`
   - Optimización de rendimiento: `perf/modulo-optimizado`
   - Documentación: `docs/seccion-actualizada`
2. **Realiza tus cambios** manteniendo los commits atómicos y claros.
3. **Verifica la compilación en producción** antes de enviar cambios:
   ```bash
   npm run build
   ```
   *Asegúrate de que la compilación termine con código de salida `0` y sin errores de sintaxis o empaquetado.*

---

## 5. Estándares de Código y Calidad

### 5.1 Gráficos 3D y Three.js
- **GPU Instancing Obligatorio:** Cualquier grupo de elementos repetitivos (cuerpos celulares, botones sinápticos, marcadores) debe implementarse mediante `THREE.InstancedMesh` para consolidar llamadas de dibujado (*draw calls*).
- **Gestión de Memoria GPU:** Toda geometría, textura o material creado dinámicamente debe ser liberado explícitamente (`geometry.dispose()`, `material.dispose()`) al desmontar componentes React.
- **Rendimiento a 60 FPS:** Las actualizaciones por cuadro dentro del hook `useFrame()` deben evitar la creación de nuevos objetos (usar variables auxiliares estáticas tipo `_dummy = new THREE.Object3D()`, `_color = new THREE.Color()`).

### 5.2 Simulación Biofísica y Cinemática
- Mantener la física desacoplada del renderizado gráfico siempre que sea posible (`src/simulation/`).
- Las tasas de muestreo e integraciones numéricas deben utilizar pasos de tiempo discretos estables ($dt \le 16.6\text{ ms}$) con protecciones contra explosiones numéricas (clamping / saturación biológica sigmoidal).

### 5.3 Frontend React / Astro
- Usar componentes funcionales modernos de React 19 con hooks idiomáticos (`useMemo`, `useCallback`, `useRef`).
- Estilos con utilidades de **Tailwind CSS v4** respetando el tema oscuro científico y la paleta de neuropilos establecida en `src/utils/neuronColors.js`.

---

## 6. Convenciones de Commits

Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad para el usuario o la simulación.
- `fix:` Corrección de un fallo o comportamiento anómalo.
- `neuro:` Modificación o calibración en circuitos neuronales, cinética o dataset.
- `perf:` Optimización en shaders, buffers o pipelines de datos que mejora los FPS.
- `docs:` Cambios o adiciones en documentación, README o diagramas.
- `refactor:` Reestructuración de código sin alterar la funcionalidad.
- `chore:` Tareas rutinarias de configuración, dependencias o scripts auxiliares.

**Ejemplos:**
```bash
git commit -m "feat(arena): agregar medidor de flujo sensorial bilateral en HUD"
git commit -m "fix(physics): corregir rebote viscoelástico contra límites de la arena"
git commit -m "perf(instancing): reducir llamadas de matriz a un único buffer en NeuronCloud"
```

---

## 7. Proceso de Revisión de Pull Requests (PR)

Al abrir un Pull Request:
1. Proporciona una **descripción concisa del problema** que resuelve y de la solución técnica aplicada.
2. Si afecta a la interfaz 3D o al HUD, adjunta una **captura de pantalla o GIF demostrativo**.
3. Indica si se modificaron datos del conectoma o archivos de coordenadas.
4. Asegúrate de que `npm run build` pase limpiamente.
5. El equipo revisará el PR para validar tanto la **estabilidad de software** como la **precisión biofísica**.

¡Agradecemos profundamente tu tiempo y talento para impulsar la neurobiología digital de código abierto!
