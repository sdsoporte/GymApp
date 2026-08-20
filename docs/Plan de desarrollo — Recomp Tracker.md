# Plan de desarrollo — Recomp Tracker

**App de registro de actividades para rutina de Recomposición Corporal**

- **Fecha:** 2026-08-20
- **Estado:** Fase 0 completada · Fase 1 en construcción
- **Plataformas objetivo:** Web móvil → APK Android → Zepp OS (smartwatch Amazfit Bip Max + app Zepp móvil)

---

## 1. Visión y objetivo

Crear una aplicación para planificar y registrar los entrenamientos de una rutina de recomposición corporal (ganancia muscular + pérdida de grasa simultáneas), con catálogo de ejercicios ilustrado, registro de series/repeticiones/peso, seguimiento de métricas corporales y visualización de progreso.

**Objetivos del producto:**

1. Consultar un catálogo de 1.324 ejercicios con animaciones e instrucciones en español.
2. Armar rutinas personalizadas (días, ejercicios, series objetivo, descansos).
3. Registrar cada entrenamiento: series, repeticiones, peso, RPE y descansos.
4. Registrar métricas corporales (peso, % grasa, cintura) para seguir la recomposición.
5. Ver historial y progreso por ejercicio y métrica.
6. Sincronizar los mismos datos en web, APK Android y reloj.

---

## 2. Fuente de datos: dataset de ejercicios

**Repositorio:** `hasaneyldrm/exercises-dataset` (GitHub)

| Característica | Detalle |
|---|---|
| Ejercicios | 1.324 |
| Datos por ejercicio | categoría, parte del cuerpo, equipamiento, músculo objetivo, músculos secundarios |
| Instrucciones | Paso a paso en 10 idiomas, **incluido español** |
| Multimedia | GIF animado + miniatura 180×180 por ejercicio |
| Formato | JSON único (`exercises.json`, ~17 MB) con esquema JSON documentado |
| Cobertura útil | 325 ejercicios con peso corporal (~25 %, aptos para casa) |

### Licencia (importante)

- **Código, estructura de datos y textos de instrucciones:** licencia MIT → uso libre.
- **Imágenes y GIFs:** © Gym visual (https://gymvisual.com/), redistribuidos con permiso.
  - **Obligación:** mantener la atribución `© Gym visual — https://gymvisual.com/` visible donde se muestre la multimedia.
  - **Riesgo comercial:** si la app se publica comercialmente, hay que revisar/obtener licencia propia en Gym visual. Para uso personal está cubierto.

---

## 3. Arquitectura general

Un **backend central** (API + base de datos en la nube) y **tres clientes** que comparten los mismos datos:

```
                    ┌─────────────────────┐
                    │   Backend (API +    │
                    │   Base de datos)    │
                    └──────────▲──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────┴───────┐    ┌────────┴────────┐    ┌────────┴────────┐
│ Fase 1:        │    │ Fase 2:          │    │ Fase 3:          │
│ Web app móvil  │    │ APK Android      │    │ Zepp OS Mini     │
│ (React + tRPC) │    │ (Capacitor sobre │    │ Program (Bip Max,│
│                │    │ la misma web app)│    │ sincroniza vía   │
│                │    │                  │    │ app Zepp)        │
└────────────────┘    └──────────────────┘    └─────────────────┘
```

**Decisión clave:** el backend va primero. Así el APK y el reloj no requieren reescribir lógica: solo consumen la misma API.

### Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend web | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Hono + tRPC 11 (type-safe end-to-end) |
| Base de datos | MySQL con Drizzle ORM |
| APK Android | Capacitor (empaqueta la web app, acceso a notificaciones y offline) |
| Reloj | Zepp OS Mini Program (JavaScript, framework oficial Zepp OS) |
| Sincronización reloj | Mini Program ↔ app Zepp (side-service) ↔ API central |

---

## 4. Modelo de datos

Esquema ya definido (Drizzle ORM):

| Tabla | Propósito | Campos clave |
|---|---|---|
| `exercises` | Catálogo importado del dataset | nombre, categoría, equipamiento, target, músculos, instrucciones ES/EN, imagen, GIF, atribución |
| `routines` | Rutinas del usuario | nombre, descripción |
| `routine_exercises` | Ejercicios de cada rutina | orden, series objetivo, reps objetivo (ej. "8-12"), descanso (s), notas |
| `workout_sessions` | Sesiones de entrenamiento | rutina, fecha, inicio/fin, notas |
| `set_logs` | Series registradas | sesión, ejercicio, nº de serie, reps, peso (kg), RPE |
| `body_metrics` | Métricas de recomposición | fecha, peso (kg), % grasa, cintura (cm), notas |

---

## 5. Roadmap por fases

### Fase 0 — Planificación ✅ (este documento)

- [x] Validar viabilidad del dataset y su licencia
- [x] Validar viabilidad técnica de las 3 plataformas
- [x] Definir arquitectura y modelo de datos

### Fase 1 — Web app móvil (MVP) 🔨 En construcción

**Estado actual:** proyecto inicializado, backend injertado, esquema de BD definido, dataset JSON descargado (17 MB). Pendiente: resolver un timeout de conexión a la base de datos y cargar los datos.

Funcionalidades del MVP:

- [ ] Importación de los 1.324 ejercicios a la base de datos (seed)
- [ ] **Catálogo:** búsqueda en vivo, filtros por grupo muscular y equipamiento, ficha con GIF e instrucciones en español
- [ ] **Rutinas:** crear/editar rutinas, agregar ejercicios con series/reps/descanso objetivo
- [ ] **Entrenar:** iniciar sesión desde una rutina, registrar series (peso × reps × RPE), temporizador de descanso
- [ ] **Historial:** sesiones pasadas con detalle
- [ ] **Progreso:** evolución de peso levantado por ejercicio + métricas corporales (peso, % grasa, cintura) con gráficos
- [ ] Diseño mobile-first (uso con una mano en el gym), modo oscuro
- [ ] Atribución © Gym visual en las fichas de ejercicio

**Criterio de cierre:** registrar un entrenamiento completo desde el celular y ver el progreso al día siguiente.

### Fase 2 — APK Android

- [ ] Integrar Capacitor sobre la web app (sin reescritura)
- [ ] Configurar icono, splash screen y nombre de app
- [ ] Soporte offline básico (rutina del día en caché, sincroniza al recuperar señal)
- [ ] Notificaciones locales (recordatorio de entrenamiento)
- [ ] Generar APK firmado para instalación directa
- [ ] (Opcional, más adelante) Publicación en Google Play

**Criterio de cierre:** APK instalable que registra entrenamientos igual que la web.

### Fase 3 — Zepp OS (Bip Max + app Zepp)

Factibilidad confirmada: el **Bip Max corre Zepp OS 5.0** y soporta Mini Programs (API level 4.4, pantalla 432×514 px).

Alcance razonable para el reloj (compañero, no reemplazo):

- [ ] Mini Program en JavaScript con el framework oficial Zepp OS
- [ ] Ver la rutina del día y el ejercicio actual
- [ ] Marcar series completadas (reps/peso rápido con +/-)
- [ ] Temporizador de descanso con vibración
- [ ] Sincronización: Mini Program → side-service en app Zepp → API central
- [ ] (Explorar) Aprovechar el reconocimiento automático de 25 movimientos de fuerza del Bip Max

**Criterio de cierre:** completar una sesión desde el reloj y verla reflejada en la app.

---

## 6. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Licencia de multimedia (© Gym visual) | No poder publicar comercialmente con esos GIFs | Mantener atribución; si se comercializa, obtener licencia propia o reemplazar multimedia |
| Peso de los assets (1.324 GIFs + imágenes) | App lenta / bundle pesado | Carga perezosa (lazy load), servir multimedia bajo demanda, cachear en el dispositivo |
| Tamaño de pantalla del reloj | No cabe el flujo completo de registro | El reloj solo marca series y descansos; la edición queda en el móvil |
| Cuota/límites del ecosistema Zepp | Publicación de Mini Programs requiere cuenta de desarrollador Zepp | Crear cuenta en el portal de desarrolladores de Zepp OS al iniciar Fase 3 |
| Sincronización offline (gym sin señal) | Pérdida de registros | Cola local de series pendientes + sincronización diferida |

---

## 7. Decisiones pendientes

1. **Cuentas de usuario:** el MVP actual es monousuario (sin login). Si varias personas la usarán, se agrega login (Kimi OAuth ya disponible en la plataforma) antes del APK.
2. **Idioma de nombres de ejercicios:** el dataset trae nombres en inglés (instrucciones sí en español). Opciones: mantener nombres originales o traducirlos.
3. **Publicación:** la web se puede publicar con un clic (subdominio propio). El APK se distribuye por descarga directa o Google Play.

---

## 8. Referencias

- Dataset: https://github.com/hasaneyldrm/exercises-dataset
- Licencia de multimedia: https://gymvisual.com/ (© Gym visual)
- Documentación Zepp OS (Mini Programs): https://docs.zepp.com/
- Bip Max: https://www.amazfit.com.ar/productos/smartwach-bip-max-l/
