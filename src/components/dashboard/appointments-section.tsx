'use client';

// Sección de citas y conversión

import { useEffect, useState } from 'react';
import { ChartCard } from '@/components/chart-card';
import { MetricCard } from '@/components/metric-card';
import { Calendar, TrendingUp, Package, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AppointmentsMetrics {
  totalAppointments: number;
  conversionRate: number;
  totalConversations: number;
  topProducts: Array<{
    name: string;
    count: number;
    conversions: number;
  }>;
  appointmentsByChannel: Array<{
    channel: string;
    count: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function AppointmentsSection() {
  const [data, setData] = useState<AppointmentsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/appointments/metrics?days=${timeRange}`);

        if (!response.ok) {
          throw new Error('Failed to fetch appointments metrics');
        }

        const metricsData = await response.json();
        setData(metricsData);
      } catch (err) {
        console.error('Error fetching appointments metrics:', err);
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
        <h2 className="text-2xl font-bold text-gray-900">Citas y Conversión</h2>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Citas y Conversión</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Citas Agendadas"
          value={data.totalAppointments}
          subtitle={`Últimos ${timeRange} días`}
          icon={Calendar}
          variant="default"
        />

        <MetricCard
          title="Tasa de Conversión"
          value={`${data.conversionRate}%`}
          subtitle="Conversaciones → Citas"
          icon={TrendingUp}
          variant={data.conversionRate >= 20 ? 'success' : data.conversionRate >= 10 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Total Conversaciones"
          value={data.totalConversations}
          subtitle={`Últimos ${timeRange} días`}
          icon={MessageCircle}
          variant="default"
        />

        <MetricCard
          title="Productos Consultados"
          value={data.topProducts.length}
          subtitle="Tipos de productos"
          icon={Package}
          variant="default"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.topProducts.length > 0 && (
          <ChartCard
            title="Productos Más Consultados"
            description="Top productos con más menciones"
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Consultas">
                  {data.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {data.appointmentsByChannel.length > 0 && (
          <ChartCard
            title="Citas por Canal"
            description="Distribución estimada de citas por canal"
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.appointmentsByChannel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.substring(0, 15)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" name="Citas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Métricas adicionales */}
      <ChartCard
        title="Resumen de Conversión"
        description="Visión general del rendimiento comercial"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-6">
            <p className="text-sm font-medium text-blue-600">Efectividad del Agente</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {data.conversionRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-blue-600">
              {data.totalAppointments} de {data.totalConversations} conversaciones
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-6">
            <p className="text-sm font-medium text-green-600">Promedio de Citas</p>
            <p className="mt-2 text-3xl font-bold text-green-900">
              {(data.totalAppointments / (timeRange / 7)).toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-green-600">
              Por semana
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-6">
            <p className="text-sm font-medium text-purple-600">Engagement del Cliente</p>
            <p className="mt-2 text-3xl font-bold text-purple-900">
              {data.totalConversations > 0 ? ((data.totalAppointments / data.totalConversations) * 100).toFixed(0) : 0}%
            </p>
            <p className="mt-1 text-xs text-purple-600">
              Interés en agendar
            </p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
