// API Route para métricas del agente de IA

import { NextResponse } from 'next/server';
import dbClient from '@/lib/db-client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Obtener métricas del agente
    const agentMetrics = await dbClient.getAgentMetrics(startDate, endDate);

    // Obtener métricas de mensajes
    const messagesMetrics = await dbClient.getMessagesMetrics(startDate, endDate);

    // Obtener top productos
    const topProducts = await dbClient.getTopProducts(startDate, endDate);

    // Obtener conversaciones por canal
    const conversationsByChannel = await dbClient.getConversationsByChannel(startDate, endDate);

    // Calcular tasa de respuesta del bot
    const responseRate = agentMetrics.totalConversations > 0
      ? (agentMetrics.botResponses / agentMetrics.totalConversations) * 100
      : 0;

    return NextResponse.json({
      totalConversations: agentMetrics.totalConversations,
      botResponses: agentMetrics.botResponses,
      responseRate: Math.round(responseRate * 10) / 10,
      avgMessagesPerConversation: Math.round(agentMetrics.avgMessagesPerConversation * 10) / 10,
      totalMessages: messagesMetrics.totalMessages,
      productMentions: agentMetrics.productMentions,
      topProducts,
      conversationsByChannel,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch agent metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
