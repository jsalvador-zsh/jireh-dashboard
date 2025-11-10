import { SummarySection } from '@/components/dashboard/summary-section';
import { WorkflowSection } from '@/components/dashboard/workflow-section';
import { AgentSection } from '@/components/dashboard/agent-section';
import { AppointmentsSection } from '@/components/dashboard/appointments-section';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Jireh - n8n Analytics
              </h1>
              <p className="text-sm text-gray-500">
                Monitoreo en tiempo real del workflow y métricas del agente de IA
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Sección 1: Resumen General */}
          <SummarySection />

          {/* Sección 2: Salud Técnica del Workflow */}
          <WorkflowSection />

          {/* Sección 3: Desempeño del Agente */}
          <AgentSection />

          {/* Sección 4: Citas y Conversión */}
          <AppointmentsSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Dashboard Jireh - Conectado a n8n Workflow (ID: 5uBkDvNnGDQkvL2p)
          </p>
        </div>
      </footer>
    </div>
  );
}
