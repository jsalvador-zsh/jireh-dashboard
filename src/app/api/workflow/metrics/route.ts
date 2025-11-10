// API Route para métricas del workflow de n8n

import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Obtener ejecuciones recientes
    const executions = await n8nClient.getRecentExecutions(200);

    // Filtrar por rango de fechas
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const filteredExecutions = executions.filter(exec => {
      const execDate = new Date(exec.startedAt);
      return execDate >= startDate && execDate <= endDate;
    });

    // Calcular métricas básicas
    const total = filteredExecutions.length;
    const successful = filteredExecutions.filter(e => e.status === 'success').length;
    const failed = filteredExecutions.filter(e => e.status === 'error').length;
    const running = filteredExecutions.filter(e => e.status === 'running').length;

    // Calcular tiempo promedio de ejecución
    const executionTimes = filteredExecutions
      .filter(e => e.stoppedAt && e.startedAt && e.status === 'success')
      .map(e => {
        const start = new Date(e.startedAt).getTime();
        const stop = new Date(e.stoppedAt).getTime();
        return stop - start;
      });

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    // Ejecuciones por hora del día actual
    const today = startOfDay(new Date());
    const todayExecutions = filteredExecutions.filter(exec =>
      new Date(exec.startedAt) >= today
    );

    const executionsByHour: { [key: string]: number } = {};
    todayExecutions.forEach(exec => {
      const hour = new Date(exec.startedAt).getHours();
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      executionsByHour[hourStr] = (executionsByHour[hourStr] || 0) + 1;
    });

    // Ejecuciones por día
    const executionsByDay: { [key: string]: number } = {};
    filteredExecutions.forEach(exec => {
      const day = format(new Date(exec.startedAt), 'yyyy-MM-dd');
      executionsByDay[day] = (executionsByDay[day] || 0) + 1;
    });

    // Últimos errores
    const lastErrors = filteredExecutions
      .filter(e => e.status === 'error')
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        timestamp: e.startedAt,
        workflowId: e.workflowId,
      }));

    return NextResponse.json({
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      runningExecutions: running,
      errorRate: total > 0 ? (failed / total) * 100 : 0,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageExecutionTime: Math.round(avgExecutionTime), // en milisegundos
      averageExecutionTimeSeconds: Math.round(avgExecutionTime / 1000),
      executionsByHour: Object.entries(executionsByHour).map(([hour, count]) => ({
        hour,
        count,
      })),
      executionsByDay: Object.entries(executionsByDay).map(([date, count]) => ({
        date,
        count,
      })),
      lastExecution: filteredExecutions[0] || null,
      lastErrors,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workflow metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
