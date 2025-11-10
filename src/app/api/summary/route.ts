// API Route para el resumen general del dashboard

import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';
import dbClient from '@/lib/db-client';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    // Obtener métricas de n8n
    const workflowMetrics = await n8nClient.getWorkflowMetrics();

    // Fechas para el día actual
    const startDate = startOfDay(new Date());
    const endDate = endOfDay(new Date());

    // Intentar obtener métricas de la base de datos
    let conversationsToday = 0;
    let appointmentsToday = 0;

    try {
      conversationsToday = await dbClient.getConversationsCount(startDate, endDate);
      const appointmentsMetrics = await dbClient.getAppointmentsMetrics(startDate, endDate);
      appointmentsToday = appointmentsMetrics.totalAppointments;
    } catch (dbError) {
      console.warn('Database metrics unavailable:', dbError);
      // Si falla la BD, continuamos con valores en 0
    }

    // Calcular tasa de éxito del workflow
    const successRate = workflowMetrics.totalExecutions > 0
      ? ((workflowMetrics.successfulExecutions / workflowMetrics.totalExecutions) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      conversationsToday,
      appointmentsToday,
      workflowSuccessRate: parseFloat(successRate),
      totalExecutionsToday: workflowMetrics.totalExecutions,
      lastExecution: workflowMetrics.lastExecution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
