'use client';

import { Payment } from '@/lib/api/paymentApi';

interface PaymentCardProps {
  payment: Payment;
  onClick?: () => void;
}

export function PaymentCard({ payment, onClick }: PaymentCardProps) {
  const statusStyles: Record<string, string> = {
    succeeded: 'bg-green-500',
    pending: 'bg-amber-500',
    failed: 'bg-red-500',
    canceled: 'bg-gray-500',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 h-full flex flex-col shadow-sm hover:shadow-md ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
            {payment.course.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {payment.user.name}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-medium text-white flex-shrink-0 ${
            statusStyles[payment.status] || 'bg-gray-500'
          }`}
        >
          {payment.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {payment.currency.toUpperCase()} {payment.amount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(payment.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
