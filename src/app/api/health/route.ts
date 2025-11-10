// API Route para verificar el estado de las conexiones

import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';
import dbClient from '@/lib/db-client';

export async function GET() {
  try {
    const [n8nHealthy, dbHealthy] = await Promise.all([
      n8nClient.healthCheck(),
      dbClient.healthCheck(),
    ]);

    const status = n8nHealthy && dbHealthy ? 'healthy' : 'unhealthy';
    const statusCode = status === 'healthy' ? 200 : 503;

    return NextResponse.json(
      {
        status,
        services: {
          n8n: n8nHealthy ? 'connected' : 'disconnected',
          database: dbHealthy ? 'connected' : 'disconnected',
        },
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
