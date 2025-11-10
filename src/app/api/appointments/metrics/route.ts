// API Route para métricas de citas

import { NextResponse } from 'next/server';
import dbClient from '@/lib/db-client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Obtener métricas de citas
    const appointmentsMetrics = await dbClient.getAppointmentsMetrics(startDate, endDate);

    // Obtener conversaciones totales para calcular tasa de conversión
    const conversationsCount = await dbClient.getConversationsCount(startDate, endDate);

    // Calcular tasa de conversión
    const conversionRate = conversationsCount > 0
      ? (appointmentsMetrics.totalAppointments / conversationsCount) * 100
      : 0;

    // Obtener top productos solicitados
    const topProducts = await dbClient.getTopProducts(startDate, endDate);

    // Obtener citas por canal
    const conversationsByChannel = await dbClient.getConversationsByChannel(startDate, endDate);

    return NextResponse.json({
      totalAppointments: appointmentsMetrics.totalAppointments,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalConversations: conversationsCount,
      topProducts: topProducts.map(p => ({
        name: p.name,
        count: p.count,
        conversions: 0, // Simplificado por ahora
      })),
      appointmentsByChannel: conversationsByChannel.map(c => ({
        channel: c.channel,
        count: Math.floor(c.count * (appointmentsMetrics.totalAppointments / (conversationsCount || 1))),
      })),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching appointments metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch appointments metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
