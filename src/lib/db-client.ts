// Cliente para interactuar con PostgreSQL (Evolution DB)

import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Ejecuta una query SQL
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Verifica la conexión a la base de datos
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Obtiene las tablas disponibles en la base de datos
 */
export async function getTables(): Promise<string[]> {
  try {
    const result = await query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    return result.rows.map(row => row.tablename);
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
}

/**
 * Obtiene la estructura de una tabla
 */
export async function getTableStructure(tableName: string) {
  try {
    const result = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    return result.rows;
  } catch (error) {
    console.error(`Error getting structure for table ${tableName}:`, error);
    return [];
  }
}

// ===== FUNCIONES ESPECÍFICAS PARA MÉTRICAS =====
// Estas funciones asumen una estructura de datos típica de Evolution API
// Deberán ajustarse según la estructura real de las tablas

/**
 * Obtiene el total de conversaciones en un rango de fechas
 */
export async function getConversationsCount(startDate: Date, endDate: Date) {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM "Chat"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('Error getting conversations count:', error);
    return 0;
  }
}

/**
 * Obtiene métricas de mensajes
 */
export async function getMessagesMetrics(startDate: Date, endDate: Date) {
  try {
    // messageTimestamp es Unix timestamp en segundos
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const result = await query<{
      total_messages: string;
      avg_messages_per_chat: string;
    }>(
      `SELECT
        COUNT(*) as total_messages,
        COUNT(*) / NULLIF(COUNT(DISTINCT "sessionId"), 0) as avg_messages_per_chat
       FROM "Message"
       WHERE "messageTimestamp" >= $1 AND "messageTimestamp" <= $2`,
      [startTimestamp, endTimestamp]
    );

    return {
      totalMessages: parseInt(result.rows[0]?.total_messages || '0'),
      avgMessagesPerConversation: parseFloat(result.rows[0]?.avg_messages_per_chat || '0'),
    };
  } catch (error) {
    console.error('Error getting messages metrics:', error);
    return {
      totalMessages: 0,
      avgMessagesPerConversation: 0,
    };
  }
}

/**
 * Obtiene métricas de citas agendadas
 * Detecta citas buscando patrones en los mensajes del agente
 */
export async function getAppointmentsMetrics(startDate: Date, endDate: Date) {
  try {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Buscar mensajes que contengan indicadores de citas agendadas
    const result = await query<{
      total_appointments: string;
    }>(
      `SELECT COUNT(*) as total_appointments
       FROM "Message"
       WHERE "messageTimestamp" >= $1
         AND "messageTimestamp" <= $2
         AND "source" = 'ios'
         AND (
           message::text ILIKE '%cita agendada%' OR
           message::text ILIKE '%agendado%' OR
           message::text ILIKE '%te esperamos%' OR
           message::text ILIKE '%✅ listo%'
         )`,
      [startTimestamp, endTimestamp]
    );

    return {
      totalAppointments: parseInt(result.rows[0]?.total_appointments || '0'),
      completed: 0,
      cancelled: 0,
    };
  } catch (error) {
    console.error('Error getting appointments metrics:', error);
    return {
      totalAppointments: 0,
      completed: 0,
      cancelled: 0,
    };
  }
}

/**
 * Obtiene conversaciones por hora
 */
export async function getConversationsByHour(startDate: Date, endDate: Date) {
  try {
    const result = await query<{ hour: string; count: string }>(
      `SELECT
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
       FROM "Chat"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2
       GROUP BY hour
       ORDER BY hour`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return result.rows.map(row => ({
      hour: row.hour,
      count: parseInt(row.count),
    }));
  } catch (error) {
    console.error('Error getting conversations by hour:', error);
    return [];
  }
}

/**
 * Obtiene métricas del agente de IA
 */
export async function getAgentMetrics(startDate: Date, endDate: Date) {
  try {
    // Obtener total de conversaciones únicas
    const conversationsResult = await query<{ total: string }>(
      `SELECT COUNT(DISTINCT "sessionId") as total
       FROM "Message"
       WHERE "messageTimestamp" >= $1 AND "messageTimestamp" <= $2`,
      [Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)]
    );

    // Obtener conversaciones con respuestas del bot (source = 'ios')
    const botResponsesResult = await query<{ total: string }>(
      `SELECT COUNT(DISTINCT "sessionId") as total
       FROM "Message"
       WHERE "messageTimestamp" >= $1
         AND "messageTimestamp" <= $2
         AND "source" = 'ios'`,
      [Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)]
    );

    // Obtener promedio de mensajes por conversación
    const avgMessagesResult = await query<{ avg_messages: string }>(
      `SELECT AVG(message_count) as avg_messages
       FROM (
         SELECT "sessionId", COUNT(*) as message_count
         FROM "Message"
         WHERE "messageTimestamp" >= $1 AND "messageTimestamp" <= $2
         GROUP BY "sessionId"
       ) as session_counts`,
      [Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)]
    );

    // Contar menciones de productos
    const productsResult = await query<{
      puertas: string;
      barandas: string;
      portones: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE message::text ILIKE '%puerta%') as puertas,
        COUNT(*) FILTER (WHERE message::text ILIKE '%baranda%') as barandas,
        COUNT(*) FILTER (WHERE message::text ILIKE '%porton%' OR message::text ILIKE '%portón%') as portones
       FROM "Message"
       WHERE "messageTimestamp" >= $1 AND "messageTimestamp" <= $2`,
      [Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)]
    );

    return {
      totalConversations: parseInt(conversationsResult.rows[0]?.total || '0'),
      botResponses: parseInt(botResponsesResult.rows[0]?.total || '0'),
      avgMessagesPerConversation: parseFloat(avgMessagesResult.rows[0]?.avg_messages || '0'),
      productMentions: {
        puertas: parseInt(productsResult.rows[0]?.puertas || '0'),
        barandas: parseInt(productsResult.rows[0]?.barandas || '0'),
        portones: parseInt(productsResult.rows[0]?.portones || '0'),
      },
    };
  } catch (error) {
    console.error('Error getting agent metrics:', error);
    return {
      totalConversations: 0,
      botResponses: 0,
      avgMessagesPerConversation: 0,
      productMentions: {
        puertas: 0,
        barandas: 0,
        portones: 0,
      },
    };
  }
}

/**
 * Obtiene top productos solicitados
 */
export async function getTopProducts(startDate: Date, endDate: Date) {
  try {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const result = await query<{
      product: string;
      count: string;
    }>(
      `SELECT
        CASE
          WHEN message::text ILIKE '%puerta%' THEN 'Puertas'
          WHEN message::text ILIKE '%baranda%' THEN 'Barandas'
          WHEN message::text ILIKE '%porton%' OR message::text ILIKE '%portón%' THEN 'Portones'
        END as product,
        COUNT(*) as count
       FROM "Message"
       WHERE "messageTimestamp" >= $1
         AND "messageTimestamp" <= $2
         AND (
           message::text ILIKE '%puerta%' OR
           message::text ILIKE '%baranda%' OR
           message::text ILIKE '%porton%' OR
           message::text ILIKE '%portón%'
         )
       GROUP BY product
       ORDER BY count DESC
       LIMIT 5`,
      [startTimestamp, endTimestamp]
    );

    return result.rows.map(row => ({
      name: row.product,
      count: parseInt(row.count),
    }));
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

/**
 * Obtiene distribución de conversaciones por canal
 */
export async function getConversationsByChannel(startDate: Date, endDate: Date) {
  try {
    const result = await query<{
      channel: string;
      count: string;
    }>(
      `SELECT
        "instanceId" as channel,
        COUNT(DISTINCT "sessionId") as count
       FROM "Message"
       WHERE "messageTimestamp" >= $1 AND "messageTimestamp" <= $2
       GROUP BY "instanceId"
       ORDER BY count DESC`,
      [Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)]
    );

    return result.rows.map(row => ({
      channel: row.channel || 'WhatsApp',
      count: parseInt(row.count),
    }));
  } catch (error) {
    console.error('Error getting conversations by channel:', error);
    return [];
  }
}

export default {
  query,
  healthCheck,
  getTables,
  getTableStructure,
  getConversationsCount,
  getMessagesMetrics,
  getAppointmentsMetrics,
  getConversationsByHour,
  getAgentMetrics,
  getTopProducts,
  getConversationsByChannel,
};
