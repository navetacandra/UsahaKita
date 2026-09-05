import { ChangeEvent } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityInput({
  id,
  value,
  onChange,
  unit,
  min = 0,
  max,
  step,
  precision = 0,
  disabled = false,
  className = '',
}: QuantityInputProps) {
  const actualStep = step ?? (precision > 0 ? Math.pow(10, -precision) : 1);

  const handleDecrease = () => {
    if (disabled) return;
    const newVal = Number(Math.max(min, value - actualStep).toFixed(precision));
    onChange(newVal);
  };

  const handleIncrease = () => {
    if (disabled) return;
    const candidate = value + actualStep;
    const newVal = max !== undefined ? Math.min(max, candidate) : candidate;
    onChange(Number(newVal.toFixed(precision)));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      let constrained = Math.max(min, parsed);
      if (max !== undefined) {
        constrained = Math.min(max, constrained);
      }
      onChange(Number(constrained.toFixed(precision)));
    }
  };

  return (
    <div className={`inline-flex items-center border-2 border-slate-900 bg-white rounded-lg overflow-hidden shadow-[2px_2px_0px_#0f172a] ${disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`}>
      <button
        type="button"
        id={id ? `${id}-decrease` : undefined}
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border-r-2 border-slate-900 disabled:opacity-40 transition-colors"
        title="Kurang"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="flex items-center px-2 py-1">
        <input
          type="number"
          id={id}
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={actualStep}
          disabled={disabled}
          className="w-16 text-center font-bold text-slate-900 text-sm focus:outline-hidden bg-transparent"
        />
        {unit && (
          <span className="text-xs font-semibold text-slate-500 pl-1 pr-1 select-none">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        id={id ? `${id}-increase` : undefined}
        onClick={handleIncrease}
        disabled={disabled || (max !== undefined && value >= max)}
        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border-l-2 border-slate-900 disabled:opacity-40 transition-colors"
        title="Tambah"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
