'use client';

import React, { useState } from 'react';
import { Calendar, Tag, DollarSign } from 'lucide-react';
import { gql, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';

// =======================
// GraphQL QUERY
// =======================
const GET_MY_COUPON_HISTORY = gql`
  query MyCouponHistory($page: Int, $limit: Int) {
    myCouponHistory(page: $page, limit: $limit) {
      id
      discountAmount
      orderAmount
      createdAt
      coupon {
        code
        name
      }
    }
  }
`;

// =======================
// COMPONENT
// =======================
export default function CouponHistoryPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading, error, refetch } = useQuery(GET_MY_COUPON_HISTORY, {
    variables: { page, limit },
    onError: () => toast.error('❌ No se pudieron cargar los cupones usados.'),
  });

  const history = data?.myCouponHistory || [];

  // Formato moneda
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);

  // Formato fecha
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <p className="text-slate-400">Cargando historial de cupones...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <p className="text-red-400">Error al cargar el historial.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Historial de Cupones Usados</h1>
        <p className="text-slate-400 mt-1">Consulta todos los cupones que has utilizado</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-sm">Total cupones usados</span>
          </div>
          <div className="text-3xl font-bold text-white">{history.length}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Descuento total aplicado</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(
              history.reduce((sum: number, h: any) => sum + (h.discountAmount || 0), 0)
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <span className="text-slate-400 text-sm">Último uso</span>
          </div>
          <div className="text-lg font-medium text-white">
            {history.length > 0 ? formatDate(history[0].createdAt) : 'Sin registros'}
          </div>
        </div>
      </div>

      {/* Tabla Desktop / Cards Mobile */}
      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Monto del pedido</th>
                <th className="px-6 py-3">Descuento</th>
                <th className="px-6 py-3">Fecha de uso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Aún no has usado ningún cupón.
                  </td>
                </tr>
              ) : (
                history.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono text-white">{entry.coupon.code}</td>
                    <td className="px-6 py-4 text-white">{entry.coupon.name}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {formatCurrency(entry.orderAmount)}
                    </td>
                    <td className="px-6 py-4 text-green-400">
                      -{formatCurrency(entry.discountAmount)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {history.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">Aún no has usado ningún cupón.</p>
          </div>
        ) : (
          history.map((entry: any) => (
            <div
              key={entry.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{entry.coupon.name}</h3>
                  <p className="text-slate-400 font-mono text-sm mt-1">{entry.coupon.code}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1">
                  <p className="text-green-400 text-xs font-medium">USADO</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Monto del pedido</p>
                  <p className="text-white text-sm font-semibold">
                    {formatCurrency(entry.orderAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Descuento</p>
                  <p className="text-green-400 text-sm font-semibold">
                    -{formatCurrency(entry.discountAmount)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs uppercase mb-1">Fecha de uso</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-white text-sm">{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {history.length >= limit && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-slate-400">Página {page}</span>
          <button
            onClick={() => {
              setPage((p) => p + 1);
              refetch({ page: page + 1, limit });
            }}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
