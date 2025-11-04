'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Order } from '@/lib/schemas/dashboard';
import { useDashboardUIStore } from '@/lib/store/dashboard';
import { gql, useQuery } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import { useParams } from 'next/navigation';

const GET_ORDERS_BY_STORE = gql`
  query OrdersByStore($storeId: String!) {
    ordersByStore(storeId: $storeId) {
      id
      status
      total
      subtotal
      tax
      shipping
      createdAt
      userName
      items {
        id
        productName
        quantity
        price
        product {
          name
          images {
            url
          }
        }
      }
      address {
        name
        street
      }
      store {
        id
        name
        logoUrl
      }
    }
  }
`;

const PAGINATED_ORDERS = gql`
  query PaginatedOrders($pagination: PaginationInput!) {
    paginatedOrders(pagination: $pagination) {
      items {
        id
        status
        total
        subtotal
        tax
        shipping
        createdAt
        userName
        items {
          id
          productName
          quantity
          price
          product {
            name
            images {
              url
            }
          }
        }
        address {
          name
          street
        }
        store {
          id
          name
          logoUrl
        }
      }
      page
      pageSize
      total
    }
  }
`;

export default function OrderPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Order[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const pageSize = 10;
  const params = useParams();

  const { setSelectedOrderId, setOrderDrawerOpen } = useDashboardUIStore();
  const { currentStore } = useSessionStore();

  // Obtener el storeId correctamente
  const urlStoreId = params?.slug as string;
  const storeId = urlStoreId || currentStore?.id;
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const isAdmin =
    userData?.role === 'ADMIN' ||
    (Array.isArray(userData?.roles) && userData.roles.includes('ADMIN'));

  const {
    data: storeData,
    loading: storeLoading,
    error: storeError,
  } = useQuery(GET_ORDERS_BY_STORE, {
    variables: { storeId: userData?.storeId || '' },
    skip: isAdmin || !storeId,
    fetchPolicy: 'network-only',
  });

  const {
    data: adminData,
    loading: adminLoading,
    error: adminError,
  } = useQuery(PAGINATED_ORDERS, {
    variables: { pagination: { page: currentPage, pageSize } },
    skip: !isAdmin,
    fetchPolicy: 'network-only',
  });

  const data = isAdmin ? adminData : storeData;
  const loading = storeLoading || adminLoading;
  const error = storeError || adminError;

  useEffect(() => {
    if (!isAdmin && data?.ordersByStore) {
      const mapped: Order[] = data.ordersByStore.map((o: any) => ({
        id: o.id,
        storeId: o.store?.id || storeId,
        customerId: '',
        customerName: o.userName || (o.address?.name ?? 'Cliente'),
        customerEmail: '',
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          name: it.productName || it.product?.name || '',
          quantity: it.quantity,
          price: it.price,
          product: it.product
            ? {
                name: it.product.name,
                images: it.product.images || [],
              }
            : null,
        })),
        total: o.total || 0,
        status: o.status || 'pending',
        createdAt: o.createdAt,
        updatedAt: o.updatedAt || o.createdAt,
      }));

      setPedidos(mapped);
      setPedidosFiltrados(mapped);
    }

    if (isAdmin && data?.paginatedOrders?.items) {
      const mapped: Order[] = data.paginatedOrders.items.map((o: any) => ({
        id: o.id,
        storeId: o.store?.id || storeId,
        customerId: '',
        customerName: o.userName || (o.address?.name ?? 'Cliente'),
        customerEmail: '',
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          name: it.productName || it.product?.name || '',
          quantity: it.quantity,
          price: it.price,
          product: it.product
            ? {
                name: it.product.name,
                images: it.product.images || [],
              }
            : null,
        })),
        total: o.total || 0,
        status: o.status || 'pending',
        createdAt: o.createdAt,
        updatedAt: o.updatedAt || o.createdAt,
      }));

      setPedidos(mapped);
      setPedidosFiltrados(mapped);
    }
  }, [data, storeId, isAdmin]);

  useEffect(() => {
    let filtrados = pedidos;

    if (busqueda) {
      filtrados = filtrados.filter(
        (order) =>
          order.customerName.toLowerCase().includes(busqueda.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(busqueda.toLowerCase()) ||
          order.id.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (filtroEstado !== 'all') {
      filtrados = filtrados.filter((order) => order.status === filtroEstado);
    }

    setPedidosFiltrados(filtrados);
    setCurrentPage(1);
  }, [pedidos, busqueda, filtroEstado]);

  const totalPages =
    isAdmin && adminData?.paginatedOrders?.total
      ? Math.ceil(adminData.paginatedOrders.total / pageSize)
      : Math.ceil(pedidosFiltrados.length / pageSize);

  const paginatedOrders = isAdmin
    ? pedidosFiltrados
    : pedidosFiltrados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estilos = {
      pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
      processing: 'bg-blue-900/30 text-blue-300 border-blue-700',
      shipped: 'bg-purple-900/30 text-purple-300 border-purple-700',
      delivered: 'bg-green-900/30 text-green-300 border-green-700',
      cancelled: 'bg-red-900/30 text-red-300 border-red-700',
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
          estilos[estado as keyof typeof estilos] || estilos.pending
        }`}
      >
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const verPedido = (idPedido: string) => {
    setSelectedOrderId(idPedido);
    setOrderDrawerOpen(true);
  };

  const exportarCSV = () => {
    const csvContent = [
      ['ID Pedido', 'Cliente', 'Correo', 'Total', 'Estado', 'Fecha'].join(','),
      ...pedidosFiltrados.map((order) =>
        [
          order.id,
          order.customerName,
          order.customerEmail,
          order.total,
          order.status,
          new Date(order.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pedidos</h1>
            <p className="text-gray-400">Cargando pedidos...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-gray-700 rounded w-1/6"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/6"></div>
              <div className="h-4 bg-gray-700 rounded w-1/6"></div>
              <div className="h-4 bg-gray-700 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-300">Error</h2>
          <p className="text-red-400">Error al cargar los pedidos: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-300">Store no seleccionado</h2>
          <p className="text-yellow-400">No se ha seleccionado una tienda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-gray-400">Administra y rastrea los pedidos de tu tienda</p>
          <p className="text-sm text-gray-500">Mostrando {pedidosFiltrados.length} pedidos</p>
        </div>

        <button
          onClick={exportarCSV}
          disabled={pedidosFiltrados.length === 0}
          className="inline-flex items-center px-4 py-2 bg-fourth-base text-black rounded-lg hover:bg-fourth-base/90 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, email o ID de orden..."
            className="w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-fourth-base transition-all placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-fourth-base"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="processing">Procesando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                Productos
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                Total
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                Fecha
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {paginatedOrders.map((order) => (
              <>
                <tr key={order.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {order.items.slice(0, 2).map((item: any, index) => {
                        const imageKey = item?.product?.images?.[0]?.url;
                        const imageUrl = imageKey
                          ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${imageKey}`
                          : '/assets/default-product.jpg';

                        return (
                          <div key={item.id} className="relative">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/assets/default-product.jpg';
                                }}
                              />
                            </div>
                            {index === 0 && order.items.length > 2 && (
                              <div className="absolute -top-1 -right-1 bg-fourth-base text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                +{order.items.length - 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {order.items.length === 0 && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700 border border-gray-600 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{order.customerName}</div>
                    <div className="text-sm text-gray-400">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    ${order.total.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4">{obtenerBadgeEstado(order.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="p-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOrders.has(order.id) && (
                  <tr key={order.id + '-expanded'}>
                    <td colSpan={6} className="px-6 py-4 bg-gray-800">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">
                            Productos ({order.items.length})
                          </h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {order.items.map((item: any) => {
                              const imageKey = item?.product?.images?.[0]?.url;
                              const imageUrl = imageKey
                                ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${imageKey}`
                                : '/assets/default-product.jpg';

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-600"
                                >
                                  <div className="flex-shrink-0">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-600 border border-gray-500">
                                      <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = '/assets/default-product.jpg';
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {item.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-gray-400">
                                        Cantidad:{' '}
                                        <span className="font-semibold text-white">
                                          {item.quantity}
                                        </span>
                                      </span>
                                      <div className="text-right">
                                        <div className="text-sm font-semibold text-white">
                                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          ${item.price.toLocaleString('es-CO')} c/u
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-white">#{order.id}</h3>
                <p className="text-sm text-gray-400">{order.customerName}</p>
              </div>
              {obtenerBadgeEstado(order.status)}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">
                <p>
                  <strong className="text-white">Total:</strong> $
                  {order.total.toLocaleString('es-CO')}
                </p>
                <p>
                  <strong className="text-white">Fecha:</strong>{' '}
                  {new Date(order.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>

            {/* Items con imágenes */}
            <div className="mt-3 space-y-3">
              {order.items.map((item: any) => {
                const imageKey = item?.product?.images?.[0]?.url;
                const imageUrl = imageKey
                  ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${imageKey}`
                  : '/assets/default-product.jpg';

                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex-shrink-0">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-600 border border-gray-500">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/default-product.jpg';
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          Cantidad:{' '}
                          <span className="font-semibold text-white">{item.quantity}</span>
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">
                            ${(item.price * item.quantity).toLocaleString('es-CO')}
                          </div>
                          <div className="text-xs text-gray-400">
                            ${item.price.toLocaleString('es-CO')} c/u
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => verPedido(order.id)}
                className="px-3 py-2 bg-fourth-base text-black rounded-lg text-sm hover:bg-fourth-base/90 transition-colors"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pedidosFiltrados.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {busqueda || filtroEstado !== 'all'
              ? 'No se encontraron pedidos'
              : 'No hay pedidos aún'}
          </h3>
          <p className="text-gray-400">
            {busqueda || filtroEstado !== 'all'
              ? 'Prueba ajustando tus filtros para ver más resultados.'
              : 'Los pedidos realizados por los clientes aparecerán aquí.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pedidosFiltrados.length > pageSize && (
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <div className="text-sm text-gray-400">
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, pedidosFiltrados.length)} a{' '}
            {Math.min(currentPage * pageSize, pedidosFiltrados.length)} de {pedidosFiltrados.length}{' '}
            pedidos
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </button>
            <span className="px-3 py-2 text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
