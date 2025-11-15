'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ShoppingCart,
  Users,
  Gift,
  Store,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  FileText,
  Loader,
  CreditCard,
  Package,
  Star,
  MessageCircle,
  BookOpen,
  Layers,
  List,
} from 'lucide-react';
import Image from 'next/image';
import { useSessionStore } from '@/lib/store/dashboard';
import { getCurrentUser } from '@/lib/utils/rbac';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

// Estructura de navegación agrupada para ADMIN
const adminNavigationGroups = [
  {
    name: 'Tienda',
    icon: Store,
    items: [
      { name: 'Tiendas', href: '/dashboard/stores', icon: Store },
      { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Productos', href: '/dashboard/products', icon: Package },
      { name: 'Categorias por tienda', href: '/dashboard/categoriesAdmin', icon: List },
    ],
  },
  {
    name: 'Usuarios',
    icon: Users,
    items: [
      { name: 'Usuarios', href: '/dashboard/users', icon: Users },
      { name: 'Emprendedores', href: '/dashboard/entrepeneurs', icon: Star },
    ],
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    items: [
      { name: 'Mensajes', href: '/dashboard/whatsapp-messages', icon: MessageCircle },
      { name: 'Templates', href: '/dashboard/whatsapp-templates', icon: BookOpen },
    ],
  },
  {
    name: 'Otros',
    icon: Gift,
    items: [
      { name: 'Bonos', href: '/dashboard/bonuses', icon: Gift },
      { name: 'Blog', href: '/dashboard/blog', icon: FileText },
      { name: 'Mi suscripción', href: '/dashboard/plans', icon: Layers },
      { name: 'Estadísticas', href: '/dashboard/insights', icon: BarChart3 },
    ],
  },
  {
    name: 'Pagos',
    icon: CreditCard,
    href: '/dashboard/payments',
    isSingle: true,
  },
];

// Estructura de navegación agrupada para STORE_ADMIN
const storeAdminNavigationGroups = [
  {
    name: 'Tienda',
    icon: Store,
    items: [
      { name: 'Tienda', href: '/dashboard/store', icon: Store },
      { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Productos', href: '/dashboard/products', icon: Package },
      { name: 'Categorias', href: '/dashboard/categories', icon: List },
    ],
  },
  {
    name: 'Usuarios',
    icon: Users,
    items: [{ name: 'Usuarios por tienda', href: '/dashboard/usersbyStore', icon: Users }],
  },
  {
    name: 'Otros',
    icon: Gift,
    items: [
      { name: 'Bonos', href: '/dashboard/bonuses', icon: Gift },
      { name: 'Mi suscripción', href: '/dashboard/plans', icon: Layers },
    ],
  },
  {
    name: 'Pagos',
    icon: CreditCard,
    href: '/dashboard/payments',
    isSingle: true,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { user, setUser } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const hideDashboardChrome = Boolean(pathname && pathname.includes('/dashboard/store/new'));

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, [setUser]);

  const handleLogout = () => {
    toast.success('Sesión cerrada exitosamente', {
      description: 'Has cerrado sesión correctamente. Redirigiendo...',
      duration: 2000,
    });

    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const toggleGroup = (groupName: string) => {
    // Si el sidebar está colapsado, primero lo expandimos
    if (collapsed) {
      setCollapsed(false);
    }

    // Cerramos todos los grupos excepto el que se está abriendo
    setExpandedGroups((prev) => {
      const isCurrentlyExpanded = prev[groupName];
      const newState: Record<string, boolean> = {};

      // Si el grupo actual está expandido, lo cerramos
      // Si está cerrado, cerramos todos los demás y abrimos este
      if (!isCurrentlyExpanded) {
        newState[groupName] = true;
      }

      return newState;
    });
  };

  if (!user) {
    console.log('🔍 Dashboard Layout - No user found, showing loading...');
    return <div>Cargando...</div>;
  }

  if (isLoading) {
    console.log('🔍 Dashboard Layout - Auth loading...');
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-fourth-base" />
      </div>
    );
  }

  const isStoreNewPage = pathname === '/dashboard/store/new';
  console.log('🔍 Dashboard Layout - User role:', user?.role);
  console.log('🔍 Dashboard Layout - Is store new page:', isStoreNewPage);
  console.log('🔍 Dashboard Layout - Is authenticated:', isAuthenticated);

  if (!isStoreNewPage && (!user || !['ADMIN', 'STORE_ADMIN', 'USER'].includes(user.role))) {
    console.log('❌ Dashboard Layout - User role not authorized:', user?.role);
    return null;
  }

  if (!isAuthenticated) {
    console.log('❌ Dashboard Layout - User not authenticated');
    return null;
  }

  if (hideDashboardChrome) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</div>;
  }

  const navigationGroups =
    user.role === 'ADMIN' ? adminNavigationGroups : storeAdminNavigationGroups;

  return (
    <div
      className={`h-screen bg-slate-900 dark:bg-gray-900 grid grid-rows-[auto_1fr] transition-all duration-300 
      ${collapsed ? 'lg:grid-cols-[96px_1fr]' : 'lg:grid-cols-[256px_1fr]'}`}
    >
      {/* Barra lateral para escritorio */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-50 ${
          collapsed ? 'w-24' : 'w-64'
        } bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-full flex-col">
          {/* Logo y botón para colapsar */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/images/logo.svg"
                width={48}
                height={48}
                className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
                alt="Logo de EmprendyUp"
                priority
              />
              {!collapsed && (
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  EmprendyUp
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              {collapsed ? (
                <ChevronRight className="h-6 w-6" />
              ) : (
                <ChevronLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Navegación agrupada */}
          <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationGroups.map((group) => {
              const isGroupExpanded = expandedGroups[group.name];
              const hasActiveItem = group.items
                ? group.items.some(
                    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
                  )
                : (group as any).href &&
                  (pathname === (group as any).href ||
                    pathname.startsWith((group as any).href + '/'));

              // Si es un item único (single), renderizar como enlace directo
              if ((group as any).isSingle && (group as any).href) {
                const isActive =
                  pathname === (group as any).href ||
                  pathname.startsWith((group as any).href + '/');
                return (
                  <Link
                    key={group.name}
                    href={(group as any).href}
                    className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-fourth-base/10 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <group.icon
                      className={`mr-0 pl-3 md:mr-3 h-8 w-8 flex-shrink-0 ${
                        isActive
                          ? 'text-black dark:text-white'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {!collapsed && <span className="truncate flex-1 text-left">{group.name}</span>}
                  </Link>
                );
              }

              return (
                <div key={group.name}>
                  {/* Encabezado del grupo */}
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      hasActiveItem
                        ? 'bg-fourth-base/10 text-black dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <group.icon
                      className={`mr-0 pl-3 md:mr-3 h-8 w-8 flex-shrink-0 ${
                        hasActiveItem
                          ? 'text-black dark:text-white'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{group.name}</span>
                        {isGroupExpanded ? (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Items del grupo (solo si no está colapsado y el grupo está expandido) */}
                  {!collapsed && isGroupExpanded && group.items && (
                    <div className="ml-6 mt-1 space-y-1">
                      {group.items.map((item) => {
                        const isActive =
                          pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setCollapsed(true)}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-fourth-base text-black'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <item.icon
                              className={`mr-3 h-5 w-5 ${
                                isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Pie de barra lateral: usuario y acciones */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar con iniciales */}
                  <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                    {(() => {
                      const name = user?.name || user?.email || 'U';
                      const words = name.trim().split(' ');
                      if (words.length >= 2) {
                        return (words[0][0] + words[1][0]).toUpperCase();
                      }
                      return name.substring(0, 2).toUpperCase();
                    })()}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {user?.name || user?.email || 'Usuario'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Mi cuenta</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* Avatar con iniciales (versión colapsada) */}
                <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                  {(() => {
                    const name = user?.name || user?.email || 'U';
                    const words = name.trim().split(' ');
                    if (words.length >= 2) {
                      return (words[0][0] + words[1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  })()}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-75">
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/images/logo.svg"
                  width={48}
                  height={48}
                  className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
                  alt="Logo de EmprendyUp"
                  priority
                />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  EmprendyUp
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {navigationGroups.map((group) => {
                const isGroupExpanded = expandedGroups[group.name];
                const hasActiveItem = group.items
                  ? group.items.some(
                      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
                    )
                  : (group as any).href &&
                    (pathname === (group as any).href ||
                      pathname.startsWith((group as any).href + '/'));

                // Si es un item único (single), renderizar como enlace directo
                if ((group as any).isSingle && (group as any).href) {
                  const isActive =
                    pathname === (group as any).href ||
                    pathname.startsWith((group as any).href + '/');
                  return (
                    <Link
                      key={group.name}
                      href={(group as any).href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-fourth-base text-black'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <group.icon
                        className={`mr-3 h-8 w-8 flex-shrink-0 ${
                          isActive
                            ? 'text-black dark:text-white'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <span className="truncate flex-1 text-left">{group.name}</span>
                    </Link>
                  );
                }

                return (
                  <div key={group.name}>
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        hasActiveItem
                          ? 'bg-fourth-base/10 text-black dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <group.icon
                        className={`mr-3 h-5 w-5 ${
                          hasActiveItem
                            ? 'text-black dark:text-white'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <span className="truncate flex-1 text-left">{group.name}</span>
                      {isGroupExpanded ? (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>

                    {isGroupExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {group.items &&
                          group.items.map((item) => {
                            const isActive =
                              pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                  isActive
                                    ? 'bg-fourth-base text-black'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <item.icon
                                  className={`mr-3 h-5 w-5 ${
                                    isActive
                                      ? 'text-black'
                                      : 'text-gray-400 group-hover:text-gray-500'
                                  }`}
                                />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
                <span className="truncate">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 grid grid-rows-[auto_1fr] min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {mounted &&
                  new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </div>
            </div>
          </div>
        </header>

        <main className="overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 auto-rows-max">{children}</div>
        </main>
      </div>
    </div>
  );
}
