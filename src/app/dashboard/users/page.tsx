'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  ShoppingCart,
  Star,
  Edit,
  Trash2,
  Mail,
  Store,
  UserCheck,
  Building2,
} from 'lucide-react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';

const GET_USERS = gql`
  query {
    users {
      id
      name
      role
      email
      store {
        id
        name
      }
    }
  }
`;

// Tipos de TypeScript
interface Store {
  id: string;
  name: string;
}

interface User {
  id: string;
  role: string;
  name: string;
  email: string;
  store: Store | null;
}

// Componente KPICard
const KPICard = ({
  icon: Icon,
  title,
  value,
  trend,
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}%
          </p>
        )}
      </div>
      <Icon className="h-8 w-8 text-blue-600" />
    </div>
  </div>
);

// Componente UserCard para móvil
const UserCard = ({
  user,
  getInitials,
  getStoreColor,
  onEdit,
}: {
  user: User;
  getInitials: (name: string) => string;
  getStoreColor: (storeId: string) => string;
  onEdit: (userId: string) => void;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {getInitials(user.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={() => onEdit(user.id)}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {/* <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
        ID: {user.id}
      </code> */}

      {user.store ? (
        <div className="flex items-center gap-1 flex-wrap">
          <Store className="h-3 w-3 text-gray-400" />
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStoreColor(user.store.id)}`}
          >
            {user.store.name}
          </span>
          {/* <code className="text-xs text-gray-500">#{user.store.id}</code> */}
        </div>
      ) : (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
          Sin tienda asignada
        </span>
      )}
    </div>
  </div>
);

const UsersPage = () => {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');

  // Obtener usuarios desde GraphQL
  const users: User[] = data?.users || [];

  const handleEditUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`);
  };

  // Obtener todas las tiendas únicas
  const stores = useMemo(() => {
    const storeMap = new Map();
    users.forEach((user) => {
      if (user.store) {
        storeMap.set(user.store.id, user.store);
      }
    });
    return Array.from(storeMap.values());
  }, [users]);

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStore =
        selectedStore === 'all' ||
        (selectedStore === 'no-store' && !user.store) ||
        user.store?.id === selectedStore;

      return matchesSearch && matchesStore;
    });
  }, [searchTerm, selectedStore, users]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const usersWithStore = users.filter((user) => user.store).length;
    const usersWithoutStore = totalUsers - usersWithStore;
    const totalStores = stores.length;

    return {
      totalUsers,
      usersWithStore,
      usersWithoutStore,
      totalStores,
    };
  }, [users, stores]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getStoreColor = (storeId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400',
    ];
    const index = parseInt(storeId) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Error al cargar usuarios
            </h3>
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Usuarios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona los usuarios y sus tiendas asignadas
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-fit">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KPICard
            icon={Users}
            title="Total Usuarios"
            value={stats.totalUsers.toString()}
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            icon={UserCheck}
            title="Con Tienda Asignada"
            value={stats.usersWithStore.toString()}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            icon={Building2}
            title="Total Tiendas"
            value={stats.totalStores.toString()}
            trend={{ value: 5, isPositive: true }}
          />
          <KPICard
            icon={Star}
            title="Sin Tienda"
            value={stats.usersWithoutStore.toString()}
            trend={{ value: -3, isPositive: false }}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas las tiendas</option>
                <option value="no-store">Sin tienda</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 transition-colors">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedStore !== 'all'
                ? 'No se encontraron usuarios con los filtros aplicados.'
                : 'No hay usuarios registrados en el sistema.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 px-1">
                  Mostrando {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                </div>
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    getInitials={getInitials}
                    getStoreColor={getStoreColor}
                    onEdit={handleEditUser}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lista de Usuarios ({filteredUsers.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tienda
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {getInitials(user.name)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                            {user.role}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.store ? (
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-gray-400" />
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStoreColor(user.store.id)}`}
                              >
                                {user.store.name}
                              </span>
                              {/* <code className="text-xs text-gray-500">#{user.store.id}</code> */}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                              Sin tienda asignada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
