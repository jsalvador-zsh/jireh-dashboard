'use client';

// Sección de desempeño del agente de IA

import { useEffect, useState } from 'react';
import { ChartCard } from '@/components/chart-card';
import { MetricCard } from '@/components/metric-card';
import { MessageSquare, Clock, TrendingUp, Package } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AgentMetrics {
  totalConversations: number;
  botResponses: number;
  responseRate: number;
  avgMessagesPerConversation: number;
  totalMessages: number;
  productMentions: {
    puertas: number;
    barandas: number;
    portones: number;
  };
  topProducts: Array<{
    name: string;
    count: number;
  }>;
  conversationsByChannel: Array<{
    channel: string;
    count: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function AgentSection() {
  const [data, setData] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent/metrics?days=${timeRange}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent metrics');
        }

        const metricsData = await response.json();
        setData(metricsData);
      } catch (err) {
        console.error('Error fetching agent metrics:', err);
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
        <h2 className="text-2xl font-bold text-gray-900">Desempeño del Agente de IA</h2>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  const productData = [
    { name: 'Puertas', value: data.productMentions.puertas },
    { name: 'Barandas', value: data.productMentions.barandas },
    { name: 'Portones', value: data.productMentions.portones },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Desempeño del Agente de IA</h2>
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
          title="Conversaciones Totales"
          value={data.totalConversations}
          subtitle={`${timeRange} días`}
          icon={MessageSquare}
          variant="default"
        />

        <MetricCard
          title="Tasa de Respuesta del Bot"
          value={`${data.responseRate}%`}
          subtitle={`${data.botResponses} con respuesta`}
          icon={TrendingUp}
          variant={data.responseRate >= 90 ? 'success' : data.responseRate >= 70 ? 'warning' : 'error'}
        />

        <MetricCard
          title="Mensajes Promedio"
          value={data.avgMessagesPerConversation.toFixed(1)}
          subtitle="Por conversación"
          icon={Clock}
          variant="default"
        />

        <MetricCard
          title="Mensajes Totales"
          value={data.totalMessages}
          subtitle={`${timeRange} días`}
          icon={Package}
          variant="default"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {productData.length > 0 && (
          <ChartCard
            title="Productos Mencionados"
            description="Distribución de consultas por tipo de producto"
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {data.topProducts.length > 0 && (
          <ChartCard
            title="Productos Más Solicitados"
            description="Top productos con más consultas"
          >
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{product.count}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {data.conversationsByChannel.length > 0 && (
        <ChartCard
          title="Conversaciones por Canal"
          description="Distribución de conversaciones por instancia"
        >
          <div className="space-y-3">
            {data.conversationsByChannel.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full bg-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {channel.channel.substring(0, 20)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{channel.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
