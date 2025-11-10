'use client';

// Sección de salud técnica del workflow

import { useEffect, useState } from 'react';
import { ChartCard } from '@/components/chart-card';
import { MetricCard } from '@/components/metric-card';
import { StatusBadge } from '@/components/status-badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  errorRate: number;
  successRate: number;
  averageExecutionTime: number;
  averageExecutionTimeSeconds: number;
  executionsByHour: Array<{ hour: string; count: number }>;
  executionsByDay: Array<{ date: string; count: number }>;
  lastExecution?: {
    id: string;
    status: 'success' | 'error' | 'running' | 'waiting';
    startedAt: string;
    stoppedAt?: string;
  };
}

export function WorkflowSection() {
  const [data, setData] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // días

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/workflow/metrics?days=${timeRange}`);

        if (!response.ok) {
          throw new Error('Failed to fetch workflow metrics');
        }

        const metricsData = await response.json();
        setData(metricsData);
      } catch (err) {
        console.error('Error fetching workflow metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Salud Técnica del Workflow</h2>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Salud Técnica del Workflow</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={1}>Último día</option>
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
        </select>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ejecuciones Totales"
          value={data.totalExecutions}
          subtitle={`${timeRange} días`}
          icon={Activity}
          variant="default"
        />

        <MetricCard
          title="Tasa de Éxito"
          value={`${data.successRate.toFixed(1)}%`}
          subtitle={`${data.successfulExecutions} exitosas`}
          icon={TrendingUp}
          variant={data.successRate >= 95 ? 'success' : data.successRate >= 85 ? 'warning' : 'error'}
        />

        <MetricCard
          title="Tasa de Error"
          value={`${data.errorRate.toFixed(1)}%`}
          subtitle={`${data.failedExecutions} fallidas`}
          icon={Zap}
          variant={data.errorRate < 5 ? 'success' : data.errorRate < 15 ? 'warning' : 'error'}
        />

        <MetricCard
          title="Tiempo Promedio"
          value={`${data.averageExecutionTimeSeconds}s`}
          subtitle="Por ejecución"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Estado de última ejecución */}
      {data.lastExecution && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Última Ejecución</h4>
              <p className="mt-1 text-xs text-gray-500">
                {formatDistanceToNow(new Date(data.lastExecution.startedAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
            <StatusBadge status={data.lastExecution.status} />
          </div>
        </div>
      )}

      {/* Gráfico de ejecuciones por día */}
      <ChartCard
        title="Ejecuciones por Día"
        description="Volumen de ejecuciones en el período seleccionado"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.executionsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-ES');
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" name="Ejecuciones" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Gráfico de ejecuciones por hora (día actual) */}
      {data.executionsByHour.length > 0 && (
        <ChartCard
          title="Ejecuciones por Hora (Hoy)"
          description="Distribución de ejecuciones durante el día actual"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.executionsByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                name="Ejecuciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
