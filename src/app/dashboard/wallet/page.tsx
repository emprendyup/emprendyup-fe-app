'use client';

import { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, Search } from 'lucide-react';

// 🧩 1️⃣ Query para obtener la billetera actual
const GET_MY_WALLET = gql`
  query MyWallet {
    myWallet {
      id
      balance
      totalEarned
      totalSpent
      createdAt
    }
  }
`;

// 🧩 2️⃣ Query para obtener las transacciones (paginadas)
const GET_ALL_TRANSACTIONS = gql`
  query AllTransactions($page: Int, $limit: Int, $type: WalletTransactionType, $userId: String) {
    allTransactions(page: $page, limit: $limit, type: $type, userId: $userId) {
      transactions {
        id
        type
        amount
        description
        reference
        balanceBefore
        balanceAfter
        createdAt
        metadata
        orderId
        wallet {
          id
          userId
          balance
        }
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

export default function WalletPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // 📡 Obtener datos de la billetera - SIEMPRE llamar los hooks incondicionalmente
  const { data: walletData, loading: walletLoading } = useQuery(GET_MY_WALLET);

  // 📡 Obtener transacciones (paginadas) - SIEMPRE llamar los hooks incondicionalmente
  const { data: txData, loading: txLoading } = useQuery(GET_ALL_TRANSACTIONS, {
    variables: { limit: 20, page: 1 },
  });

  // Formatear fecha correctamente
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Usar datos solo después de que se carguen
  const wallet = walletData?.myWallet;
  const transactions = txData?.allTransactions?.transactions || [];
  const pagination = txData?.allTransactions?.pagination;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: any) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // Mostrar loading state
  if (walletLoading || txLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Billetera</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualiza tu balance y todas las transacciones realizadas.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Balance actual"
          value={formatCurrency(wallet?.balance || 0)}
          icon={Wallet}
          description="Saldo disponible en tu cuenta"
        />
        <KPICard
          title="Total ganado"
          value={formatCurrency(wallet?.totalEarned || 0)}
          icon={ArrowUpCircle}
          description="Monto total acreditado"
        />
        <KPICard
          title="Total gastado"
          value={formatCurrency(wallet?.totalSpent || 0)}
          icon={ArrowDownCircle}
          description="Monto total debitado"
        />
        <KPICard
          title="Creado el"
          value={wallet?.createdAt ? formatDate(wallet.createdAt) : 'N/A'}
          icon={Calendar}
          description="Fecha de creación del wallet"
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar transacción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Transactions Table Desktop / Cards Mobile */}
      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Antes / Después
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tx.type === 'CREDIT'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-medium ${
                        tx.type === 'CREDIT'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'CREDIT'
                        ? `+${formatCurrency(tx.amount)}`
                        : `-${formatCurrency(tx.amount)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(tx.balanceBefore)} → {formatCurrency(tx.balanceAfter)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm
                      ? 'No se encontraron transacciones'
                      : 'No hay transacciones registradas'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No se encontraron transacciones' : 'No hay transacciones registradas'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx: any) => (
            <div
              key={tx.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white font-semibold">{tx.description}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.type === 'CREDIT'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {tx.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Monto</span>
                  <span
                    className={`text-lg font-bold ${
                      tx.type === 'CREDIT'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'CREDIT'
                      ? `+${formatCurrency(tx.amount)}`
                      : `-${formatCurrency(tx.amount)}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Balance</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatCurrency(tx.balanceBefore)} → {formatCurrency(tx.balanceAfter)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 🧩 Componente para mostrar tarjetas de KPIs
function KPICard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: any;
  description: string;
}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4">
      <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
      </div>
    </div>
  );
}
