import { StockStatus } from '../../types';

interface StockBadgeProps {
  status: StockStatus;
  stock?: number;
  unit?: string;
  className?: string;
}

export function StockBadge({ status, stock, unit, className = '' }: StockBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case 'Habis':
        return 'bg-rose-100 text-rose-900 border-rose-800';
      case 'Menipis':
        return 'bg-amber-100 text-amber-900 border-amber-800';
      case 'Aman':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-800';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded border ${getStyle()} whitespace-nowrap ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'Habis'
            ? 'bg-rose-600'
            : status === 'Menipis'
            ? 'bg-amber-600'
            : 'bg-emerald-600'
        }`}
      />
      <span>{status}</span>
      {stock !== undefined && unit && (
        <span className="opacity-75 font-normal">
          ({stock} {unit})
        </span>
      )}
    </span>
  );
}
