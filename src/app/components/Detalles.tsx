'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Settings,
  Eye,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Globe,
  Star,
  MapPin,
  ExternalLink,
  CheckCircle,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useSessionStore } from '@/lib/store/dashboard';
import Image from 'next/image';
import KPICard from '../dashboard/components/KPICard';

// Tipos
interface StoreData {
  id: string;
  name: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  logo?: string;
  favicon?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  settings: {
    currency: string;
    timezone: string;
    language: string;
    theme: string;
    allowGuestCheckout: boolean;
    requireEmailVerification: boolean;
    enableReviews: boolean;
    enableWishlist: boolean;
  };
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  features: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Datos de ejemplo
const mockStore: StoreData = {
  id: 'store-1',
  name: 'EmprendyUp Fashion',
  description: 'Productos de moda y estilo de vida premium para emprendedores modernos',
  subdomain: 'emprendyup-fashion',
  customDomain: 'fashion.emprendyup.com',
  logo: '/images/logo-dark.png',
  status: 'active',
  plan: 'professional',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2025-09-04T10:00:00Z',
  ownerId: 'user-1',
  settings: {
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'es',
    theme: 'modern',
    allowGuestCheckout: true,
    requireEmailVerification: true,
    enableReviews: true,
    enableWishlist: true,
  },
  stats: {
    totalProducts: 248,
    totalOrders: 1456,
    totalRevenue: 89750.5,
    monthlyRevenue: 12450.75,
    totalCustomers: 892,
    averageOrderValue: 61.67,
    conversionRate: 3.2,
  },
  features: [
    'Dominio personalizado',
    'Certificado SSL',
    'Procesamiento de pagos',
    'Gestión de inventario',
    'Panel de análisis',
    'Email marketing',
    'Herramientas SEO',
    'Diseño responsivo',
    'Soporte multilenguaje',
    'Integración redes sociales',
  ],
  address: {
    street: '123 Business Ave',
    city: 'Nueva York',
    state: 'NY',
    zipCode: '10001',
    country: 'Estados Unidos',
  },
};

const quickActions = [
  {
    title: 'Agregar producto',
    description: 'Añade nuevos productos a tu tienda',
    href: '/dashboard/store/products/new',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    title: 'Ver tienda',
    description: 'Vista previa de tu tienda en vivo',
    href: '#',
    icon: Eye,
    color: 'bg-green-500',
    external: true,
  },
  {
    title: 'Analíticas',
    description: 'Ver estadísticas detalladas',
    href: '/dashboard/insights',
    icon: BarChart3,
    color: 'bg-orange-500',
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'order',
    description: 'Nuevo pedido #1234 recibido',
    timestamp: 'Hace 2 minutos',
    icon: ShoppingCart,
    color: 'text-green-600',
  },
  {
    id: '2',
    type: 'product',
    description: 'Producto "Vestido de verano" actualizado',
    timestamp: 'Hace 15 minutos',
    icon: Package,
    color: 'text-blue-600',
  },
  {
    id: '3',
    type: 'customer',
    description: 'Nuevo registro de cliente',
    timestamp: 'Hace 1 hora',
    icon: Users,
    color: 'text-purple-600',
  },
  {
    id: '4',
    type: 'payment',
    description: 'Pago de $125.50 recibido',
    timestamp: 'Hace 2 horas',
    icon: DollarSign,
    color: 'text-green-600',
  },
];

interface DetailsStoreProps {
  storeId?: string;
  storeData?: any;
}

export default function DetailsStore({ storeId, storeData }: DetailsStoreProps) {
  const { currentStore, stores } = useSessionStore();

  // Transformar datos reales al formato esperado
  const transformStoreData = (data: any): StoreData => {
    if (!data || !Object.keys(data).length) return mockStore;

    return {
      id: data.id || storeId || 'store-1',
      name: data.name || 'Mi Tienda',
      description: data.description || 'Descripción de mi tienda',
      subdomain: data.storeId || 'mi-tienda',
      customDomain: data.customDomain || undefined,
      logo: data.logoUrl || undefined,
      favicon: data.faviconUrl || undefined,
      status: 'active', // Asumir activa por defecto
      plan: 'professional', // Plan por defecto
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      ownerId: data.ownerId || 'user-1',
      settings: {
        currency: data.currency || 'COP',
        timezone: data.timezone || 'America/Bogota',
        language: data.language || 'es',
        theme: 'modern',
        allowGuestCheckout: true,
        requireEmailVerification: true,
        enableReviews: true,
        enableWishlist: true,
      },
      stats: {
        totalProducts: 0, // Estos necesitarían venir de otra consulta
        totalOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        conversionRate: 0,
      },
      features: [
        'Catálogo de productos',
        'Carrito de compras',
        'Procesamiento de pagos',
        'Gestión de inventario',
        'Panel de administración',
        'Reportes y analytics',
        'SEO optimizado',
        'Responsive design',
      ],
      address: data.address
        ? {
            street: data.address,
            city: data.city || '',
            state: data.department || '',
            zipCode: '',
            country: data.country || 'Colombia',
          }
        : undefined,
    };
  };

  const [store] = useState<StoreData>(transformStoreData(storeData));

  // Helper para resolver URLs de imágenes
  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    if (
      value.startsWith('http') ||
      value.startsWith('https') ||
      value.startsWith('blob:') ||
      value.startsWith('data:')
    )
      return value;
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${value}`;
  };

  // Helpers de color según estado/plan
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'professional':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-fourth-base/10 flex items-center justify-center">
            {store.logo ? (
              <Image
                src={resolveImageUrl(store.logo)}
                alt={store.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain rounded"
                unoptimized={Boolean(
                  store.logo?.startsWith('blob:') || store.logo?.startsWith('data:')
                )}
              />
            ) : (
              <Store className="h-8 w-8 text-fourth-base" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{store.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(store.status)}`}
              >
                {store.status === 'active' ? 'Activo' : store.status}
              </span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(store.plan)}`}
              >
                {store.plan === 'professional' ? 'Profesional' : store.plan}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://${store.name}.com.co`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver tienda
          </a>
        </div>
      </div>

      {/* Store Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Dominio</h3>
            <Globe className="h-5 w-5 text-fourth-base" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {store.customDomain || `${store.subdomain}.com`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {store.customDomain ? 'Dominio personalizado' : 'Subdominio'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Creado</h3>
            <Calendar className="h-5 w-5 text-fourth-base" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date(store.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.floor((Date.now() - new Date(store.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{' '}
            días atrás
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Moneda</h3>
            <DollarSign className="h-5 w-5 text-fourth-base" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {store.settings.currency}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{store.settings.timezone}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Características
            </h3>
            <Star className="h-5 w-5 text-fourth-base" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {store.features.length} activas
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Funciones premium habilitadas
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de productos"
          value={store.stats.totalProducts}
          icon={Package}
          description="Productos en tu tienda"
        />
        <KPICard
          title="Total de pedidos"
          value={store.stats.totalOrders}
          icon={ShoppingCart}
          description="Pedidos de por vida"
        />
        <KPICard
          title="Ingresos totales"
          value={`$${store.stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="Ingresos acumulados"
        />
        <KPICard
          title="Clientes"
          value={store.stats.totalCustomers}
          icon={Users}
          description="Clientes registrados"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rapidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
              {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <div className="flex items-center gap-3">
                <div className={`${action.color} p-3 rounded-lg text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-fourth-base transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
                {action.external && (
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-fourth-base transition-colors" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity and Store Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/insights"
                className="text-sm text-fourth-base hover:text-fourth-base/80 font-medium"
              >
                Ver toda la actividad →
              </Link>
            </div>
          </div>
        </div>

        {/* Store Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Funciones habilitadas
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {store.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/store/settings"
                className="text-sm text-fourth-base hover:text-fourth-base/80 font-medium"
              >
                Manejar funciones →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Métricas de rendimiento
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${store.stats.averageOrderValue}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Valor promedio de pedido
              </div>
              <div className="mt-2">
                <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% desde el mes pasado
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {store.stats.conversionRate}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasa de Conversion</div>
              <div className="mt-2">
                <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +0.5% desde el mes pasado
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${store.stats.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ingresos mensuales</div>
              <div className="mt-2">
                <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% desde el mes pasado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Address */}
      {store.address && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dirección de tienda
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-fourth-base mt-1" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white">{store.address.street}</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {store.address.city}, {store.address.state} {store.address.zipCode}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{store.address.country}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
