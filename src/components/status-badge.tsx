// Componente para mostrar badges de estado

import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'running' | 'waiting';
  label?: string;
}

const statusConfig = {
  success: {
    color: 'bg-green-100 text-green-800',
    label: 'Exitoso',
  },
  error: {
    color: 'bg-red-100 text-red-800',
    label: 'Error',
  },
  warning: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Advertencia',
  },
  running: {
    color: 'bg-blue-100 text-blue-800',
    label: 'En ejecución',
  },
  waiting: {
    color: 'bg-gray-100 text-gray-800',
    label: 'En espera',
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        config.color
      )}
    >
      {label || config.label}
    </span>
  );
}
