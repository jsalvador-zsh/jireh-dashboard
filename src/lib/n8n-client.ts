// Cliente para interactuar con la API de n8n

import { WorkflowExecution } from '@/types/metrics';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const N8N_WORKFLOW_ID = process.env.N8N_WORKFLOW_ID || '';

interface N8NExecutionResponse {
  data: WorkflowExecution[];
  nextCursor?: string;
}

interface N8NWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}

class N8NClient {
  private baseUrl: string;
  private apiKey: string;
  private workflowId: string;

  constructor() {
    this.baseUrl = N8N_API_URL;
    this.apiKey = N8N_API_KEY;
    this.workflowId = N8N_WORKFLOW_ID;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Obtiene información del workflow
   */
  async getWorkflow(): Promise<N8NWorkflowResponse> {
    return this.fetch<N8NWorkflowResponse>(`/workflows/${this.workflowId}`);
  }

  /**
   * Obtiene las ejecuciones del workflow con filtros opcionales
   */
  async getExecutions(params?: {
    limit?: number;
    status?: 'success' | 'error' | 'waiting' | 'running';
    includeData?: boolean;
  }): Promise<N8NExecutionResponse> {
    const queryParams = new URLSearchParams();

    // Filtrar por workflow ID
    queryParams.append('workflowId', this.workflowId);

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeData !== undefined) {
      queryParams.append('includeData', params.includeData.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/executions${query ? `?${query}` : ''}`;

    return this.fetch<N8NExecutionResponse>(endpoint);
  }

  /**
   * Obtiene una ejecución específica por ID
   */
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    return this.fetch<WorkflowExecution>(`/executions/${executionId}`);
  }

  /**
   * Obtiene todas las ejecuciones recientes (útil para métricas)
   */
  async getRecentExecutions(limit: number = 100): Promise<WorkflowExecution[]> {
    const response = await this.getExecutions({ limit, includeData: false });
    return response.data;
  }

  /**
   * Obtiene ejecuciones dentro de un rango de fechas
   */
  async getExecutionsByDateRange(startDate: Date, endDate: Date): Promise<WorkflowExecution[]> {
    // n8n no tiene filtro directo por fechas en la API,
    // así que obtenemos más ejecuciones y filtramos
    const allExecutions = await this.getRecentExecutions(200);

    return allExecutions.filter(exec => {
      const execDate = new Date(exec.startedAt);
      return execDate >= startDate && execDate <= endDate;
    });
  }

  /**
   * Obtiene métricas básicas del workflow
   */
  async getWorkflowMetrics() {
    const executions = await this.getRecentExecutions(100);

    const successful = executions.filter(e => e.status === 'success').length;
    const failed = executions.filter(e => e.status === 'error').length;
    const total = executions.length;

    // Calcular tiempo promedio de ejecución
    const executionTimes = executions
      .filter(e => e.stoppedAt && e.startedAt)
      .map(e => {
        const start = new Date(e.startedAt).getTime();
        const stop = new Date(e.stoppedAt).getTime();
        return stop - start;
      });

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      errorRate: total > 0 ? (failed / total) * 100 : 0,
      averageExecutionTime: avgExecutionTime,
      lastExecution: executions[0],
    };
  }

  /**
   * Verifica la conexión con n8n
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getWorkflow();
      return true;
    } catch (error) {
      console.error('n8n health check failed:', error);
      return false;
    }
  }
}

export const n8nClient = new N8NClient();
