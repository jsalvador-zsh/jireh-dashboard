// Tipos para métricas del dashboard

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  status: 'success' | 'error' | 'waiting' | 'running';
  retryOf?: string;
  retrySuccessId?: string;
  waitTill?: string;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsByHour: { hour: string; count: number }[];
  errorRate: number;
  lastExecution?: WorkflowExecution;
}

export interface AgentMetrics {
  totalConversations: number;
  completedConversations: number;
  averageDuration: number;
  averageResponseTime: number;
  escalationsToHuman: number;
  escalationRate: number;
  messagesPerConversation: number;
  satisfactionRate?: number;
}

export interface AppointmentMetrics {
  totalAppointments: number;
  appointmentsByDay: { date: string; count: number }[];
  conversionRate: number;
  canceledAppointments: number;
  rescheduledAppointments: number;
  appointmentsByChannel: { channel: string; count: number }[];
  averageTimeToAppointment: number;
}

export interface DashboardSummary {
  conversationsToday: number;
  appointmentsToday: number;
  workflowSuccessRate: number;
  lastErrors: Array<{
    id: string;
    timestamp: string;
    message: string;
    workflowId: string;
  }>;
}

export interface ProductMetrics {
  productsSent: number;
  topProducts: Array<{
    name: string;
    count: number;
    conversions: number;
  }>;
  responseRateAfterProduct: number;
}
