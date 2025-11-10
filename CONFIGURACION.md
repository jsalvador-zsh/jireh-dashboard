# Configuración del Dashboard Jireh

Este documento detalla cómo configurar el dashboard para conectarlo correctamente con tu instancia de n8n y la base de datos PostgreSQL.

## Estado Actual

### ✅ Configurado
- Conexión a n8n API
- Workflow ID: `5uBkDvNnGDQkvL2p`
- API Key configurada
- URL de n8n: `https://jireh-n8n.3240creativegroup.com/api/v1`

### ⚠️ Pendiente de Configuración
- Credenciales de PostgreSQL (contraseña)
- Host público de la base de datos
- Estructura de las tablas de datos

## Pasos para Completar la Configuración

### 1. Configurar Variables de Entorno

Edita el archivo `.env.local` en la raíz del proyecto:

```bash
# PostgreSQL Database Configuration
DATABASE_HOST=TU_HOST_AQUI  # Puede ser una IP pública o dominio
DATABASE_PORT=5432
DATABASE_NAME=evolution_test_db
DATABASE_USER=postgres
DATABASE_PASSWORD=TU_PASSWORD_AQUI
DATABASE_SSL=false
```

### 2. Verificar la Estructura de la Base de Datos

Una vez configuradas las credenciales, puedes usar el endpoint `/api/database/tables` para inspeccionar las tablas disponibles:

```bash
# Con el servidor en ejecución:
curl http://localhost:3000/api/database/tables
```

Esto te mostrará todas las tablas y sus columnas.

### 3. Adaptar las Queries SQL

Las queries en `src/lib/db-client.ts` asumen una estructura típica de Evolution API. Es posible que necesites ajustarlas según tu estructura real:

- `getConversationsCount()` - Obtiene el total de conversaciones
- `getMessagesMetrics()` - Obtiene métricas de mensajes
- `getAppointmentsMetrics()` - Obtiene métricas de citas
- `getConversationsByHour()` - Distribución por hora

Revisa estas funciones y ajusta los nombres de tablas y columnas según tu base de datos.

## Funcionalidades Disponibles

### 1. Resumen General
- **Fuentes de datos**: n8n API + PostgreSQL
- **Métricas**:
  - Conversaciones del día (requiere PostgreSQL)
  - Citas agendadas del día (requiere PostgreSQL)
  - Tasa de éxito del workflow (n8n ✅)
  - Últimos errores (n8n ✅)

### 2. Salud Técnica del Workflow
- **Fuente de datos**: n8n API ✅
- **Métricas**:
  - Ejecuciones totales
  - Tasa de éxito/error
  - Tiempo promedio de ejecución
  - Gráficos de ejecuciones por día/hora

### 3. Desempeño del Agente
- **Fuente de datos**: PostgreSQL ⚠️
- **Estado**: Placeholder (requiere configuración de DB)
- **Métricas planeadas**:
  - Conversaciones totales/completadas
  - Tiempo promedio por conversación
  - Escalamientos a humano

### 4. Citas y Conversión
- **Fuente de datos**: PostgreSQL ⚠️
- **Estado**: Placeholder (requiere configuración de DB)
- **Métricas planeadas**:
  - Citas totales
  - Tasa de conversión
  - Citas canceladas/reprogramadas
  - Productos más solicitados

## Comandos Disponibles

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

## Verificar Conexiones

### Test de Salud
```bash
# Con el servidor en ejecución:
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "services": {
    "n8n": "connected",
    "database": "connected"
  }
}
```

## Endpoints de API Disponibles

- `GET /api/health` - Estado de las conexiones
- `GET /api/summary` - Resumen general del dashboard
- `GET /api/workflow/metrics?days=7` - Métricas del workflow
- `GET /api/database/tables` - Inspección de tablas de la DB

## Siguientes Pasos

1. **Completar credenciales de PostgreSQL** en `.env.local`
2. **Inspeccionar estructura de tablas** con `/api/database/tables`
3. **Ajustar queries SQL** en `src/lib/db-client.ts` según tu estructura
4. **Probar endpoints** de API para verificar datos
5. Los componentes del dashboard se actualizarán automáticamente cuando los datos estén disponibles

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/              # API Routes de Next.js
│   │   ├── health/       # Health check
│   │   ├── summary/      # Resumen general
│   │   ├── workflow/     # Métricas de n8n
│   │   └── database/     # Inspección de DB
│   ├── page.tsx          # Página principal
│   └── layout.tsx        # Layout de la app
├── components/
│   ├── dashboard/        # Secciones del dashboard
│   ├── metric-card.tsx   # Tarjeta de métrica
│   ├── chart-card.tsx    # Tarjeta de gráfico
│   └── status-badge.tsx  # Badge de estado
├── lib/
│   ├── n8n-client.ts     # Cliente de n8n API
│   └── db-client.ts      # Cliente de PostgreSQL
└── types/
    └── metrics.ts        # Tipos TypeScript
```

## Actualización Automática

El dashboard actualiza automáticamente los datos cada 30 segundos. No es necesario refrescar la página manualmente.

## Soporte

Si necesitas ayuda para adaptar las queries SQL o configurar algo específico de tu base de datos, revisa la documentación de Evolution API o consulta la estructura de tus tablas usando el endpoint `/api/database/tables`.
