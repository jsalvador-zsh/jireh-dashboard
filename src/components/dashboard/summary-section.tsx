'use client';

// Sección de resumen general del dashboard

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/metric-card';
import { MessageSquare, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

interface SummaryData {
  conversationsToday: number;
  appointmentsToday: number;
  workflowSuccessRate: number;
  totalExecutionsToday: number;
}

export function SummarySection() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const response = await fetch('/api/summary');

        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }

        const summaryData = await response.json();
        setData(summaryData);
        setError(null);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSummary, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Error al cargar el resumen: {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const conversionRate = data.conversationsToday > 0
    ? ((data.appointmentsToday / data.conversationsToday) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Resumen General</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Conversaciones Hoy"
          value={data.conversationsToday}
          subtitle="Total del día actual"
          icon={MessageSquare}
          variant="default"
        />

        <MetricCard
          title="Citas Agendadas Hoy"
          value={data.appointmentsToday}
          subtitle="Nuevas citas del día"
          icon={Calendar}
          variant="success"
        />

        <MetricCard
          title="Tasa de Éxito del Workflow"
          value={`${data.workflowSuccessRate.toFixed(1)}%`}
          subtitle={`${data.totalExecutionsToday} ejecuciones totales`}
          icon={CheckCircle}
          variant={data.workflowSuccessRate >= 95 ? 'success' : data.workflowSuccessRate >= 85 ? 'warning' : 'error'}
        />

        <MetricCard
          title="Tasa de Conversión"
          value={`${conversionRate}%`}
          subtitle="Conversaciones → Citas"
          icon={AlertTriangle}
          variant={parseFloat(conversionRate) >= 20 ? 'success' : parseFloat(conversionRate) >= 10 ? 'warning' : 'default'}
        />
      </div>
    </div>
  );
}
