import { StockStatus } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(val: number, precision = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val.toFixed(precision)).toLocaleString('id-ID');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  } catch {
    return dateString;
  }
}

export function getStockStatus(currentStock: number, minimumStock: number): StockStatus {
  if (currentStock <= 0) return 'Habis';
  if (currentStock <= minimumStock) return 'Menipis';
  return 'Aman';
}
