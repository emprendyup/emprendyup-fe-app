'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  RefreshCcw,
  Ticket,
  Calendar,
  Users,
  Link,
  ExternalLink,
  History,
} from 'lucide-react';
import { gql, useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// =======================
// GraphQL QUERIES / MUTATIONS
// =======================
const GET_STORE_COUPONS = gql`
  query StoreCoupons($storeId: String) {
    storeCoupons(storeId: $storeId) {
      id
      code
      name
      description
      type
      value
      isPercentage
      minimumAmount
      maximumDiscount
      usageLimit
      userUsageLimit
      expiresAt
      isActive
      createdAt
      updatedAt
    }
  }
`;

const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id
      code
      name
    }
  }
`;

const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: String!, $input: UpdateCouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
      name
      description
      isActive
      value
    }
  }
`;

const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: String!) {
    deleteCoupon(id: $id)
  }
`;

// =======================
// COMPONENT
// =======================
export default function CouponsPage() {
  const storeId = 'b1dd4319-06de-460b-9fdf-d8056b4e156e';
  const { data, loading, error, refetch } = useQuery(GET_STORE_COUPONS, {
    variables: { storeId },
  });

  const [createCoupon] = useMutation(CREATE_COUPON);
  const [updateCoupon] = useMutation(UPDATE_COUPON);
  const [deleteCoupon] = useMutation(DELETE_COUPON);

  const [openModal, setOpenModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    isPercentage: true,
    minimumAmount: 0,
    maximumDiscount: 0,
    usageLimit: 0,
    userUsageLimit: 0,
    expiresAt: '',
  });

  const coupons = data?.storeCoupons || [];

  // KPIs
  const activeCoupons = coupons.filter((c: any) => c.isActive).length;
  const totalCoupons = coupons.length;
  const expiringCoupons = coupons.filter((c: any) => {
    if (!c.expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(c.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  // Filtro de búsqueda
  const filteredCoupons = coupons.filter(
    (c: any) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        name === 'value' || name.includes('Amount') || name.includes('Limit')
          ? parseFloat(value) || 0
          : value,
    }));
  };

  // Validación de campos requeridos
  const isFormValid =
    formData.code.trim() !== '' &&
    formData.name.trim() !== '' &&
    formData.type.trim() !== '' &&
    Number(formData.value) > 0;

  // Guardar cupón
  const handleSubmit = async () => {
    try {
      if (!isFormValid) {
        toast.error('Por favor completa todos los campos requeridos.');
        return;
      }

      if (editingCoupon) {
        await updateCoupon({
          variables: {
            id: editingCoupon.id,
            input: {
              name: formData.name,
              description: formData.description,
              value: Number(formData.value),
              minimumAmount: Number(formData.minimumAmount),
              maximumDiscount: Number(formData.maximumDiscount),
              usageLimit: Number(formData.usageLimit),
              userUsageLimit: Number(formData.userUsageLimit),
              expiresAt: formData.expiresAt || null,
            },
          },
        });
        toast.success('✅ Cupón actualizado con éxito');
      } else {
        await createCoupon({
          variables: {
            input: {
              ...formData,
              value: Number(formData.value),
              minimumAmount: Number(formData.minimumAmount),
              maximumDiscount: Number(formData.maximumDiscount),
              usageLimit: Number(formData.usageLimit),
              userUsageLimit: Number(formData.userUsageLimit),
              storeId,
            },
          },
        });
        toast.success('🎉 Cupón creado con éxito');
      }

      setOpenModal(false);
      setEditingCoupon(null);
      refetch();
    } catch (err: any) {
      console.error('Error al guardar el cupón:', err);
      let mensaje = '❌ Ocurrió un error al guardar el cupón.';

      if (err.message.includes('Coupon code already exists')) {
        mensaje = 'El código del cupón ya existe. Intenta con otro.';
      } else if (err.message.includes('Float cannot represent')) {
        mensaje = 'Uno de los valores numéricos no es válido.';
      } else if (err.message.includes('Network')) {
        mensaje = 'Error de red. Verifica tu conexión a internet.';
      } else if (err.message.includes('Unauthorized')) {
        mensaje = 'No tienes permisos para realizar esta acción.';
      }

      toast.error(mensaje);
    }
  };
  const router = useRouter();

  // Eliminar cupón
  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cupón?')) return;
    try {
      await deleteCoupon({ variables: { id } });
      toast.success('🗑️ Cupón eliminado con éxito');
      refetch();
    } catch {
      toast.error('❌ Error al eliminar el cupón');
    }
  };

  // Abrir para editar
  const openEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      ...coupon,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
    });
    setOpenModal(true);
  };

  // Abrir para crear
  const openCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      isPercentage: true,
      minimumAmount: 0,
      maximumDiscount: 0,
      usageLimit: 0,
      userUsageLimit: 0,
      expiresAt: '',
    });
    setOpenModal(true);
  };

  // Formato moneda
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <p className="text-slate-400">Cargando cupones...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <p className="text-red-400">Error al cargar cupones.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-white">Gestión de Cupones</h1>
        <p className="text-slate-400 mt-1">
          Administra todos los cupones de descuento de tu tienda
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-sm">Total cupones</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalCoupons}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Activos</span>
          </div>
          <div className="text-3xl font-bold text-white">{activeCoupons}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <span className="text-slate-400 text-sm">Por vencer</span>
          </div>
          <div className="text-3xl font-bold text-white">{expiringCoupons}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-slate-400 text-sm">Usos totales</span>
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
      </div>

      {/* Search + Crear */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar cupón..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-96 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition font-medium"
          >
            <Plus className="w-5 h-5" /> Nuevo Cupón
          </button>

          <button
            onClick={() => router.push('/dashboard/bonuses/ussage')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition font-medium"
          >
            <History className="w-5 h-5" /> Usados
          </button>
        </div>
      </div>

      {/* Tabla */}
      {/* Tabla Desktop / Cards Mobile */}
      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Expira</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron cupones
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4">{coupon.name}</td>
                    <td className="px-6 py-4 font-mono">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {coupon.type === 'PERCENTAGE'
                        ? 'Porcentaje'
                        : coupon.type === 'FIXED_AMOUNT'
                          ? 'Monto fijo'
                          : 'Otro'}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.isPercentage ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.isActive ? (
                        <span className="text-green-400">Activo</span>
                      ) : (
                        <span className="text-slate-400">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('es-CO')
                        : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="p-2 text-slate-400 hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredCoupons.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">No se encontraron cupones</p>
          </div>
        ) : (
          filteredCoupons.map((coupon: any) => (
            <div
              key={coupon.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{coupon.name}</h3>
                  <p className="text-slate-400 font-mono text-sm mt-1">{coupon.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(coupon)}
                    className="p-2 text-slate-400 hover:text-blue-400"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Tipo</p>
                  <p className="text-white text-sm">
                    {coupon.type === 'PERCENTAGE'
                      ? 'Porcentaje'
                      : coupon.type === 'FIXED_AMOUNT'
                        ? 'Monto fijo'
                        : 'Otro'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Valor</p>
                  <p className="text-white text-sm font-semibold">
                    {coupon.isPercentage ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Estado</p>
                  <p className="text-sm">
                    {coupon.isActive ? (
                      <span className="text-green-400">Activo</span>
                    ) : (
                      <span className="text-slate-400">Inactivo</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">Expira</p>
                  <p className="text-white text-sm">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString('es-CO')
                      : 'Sin fecha'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-xl p-6 relative">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-white mb-4">
              {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'code', label: 'Código *', placeholder: 'VERANO2024' },
                { name: 'name', label: 'Nombre *', placeholder: 'Descuento de verano' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm text-slate-300 mb-2">{f.label}</label>
                  <input
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleInputChange}
                    disabled={f.name === 'code' && !!editingCoupon}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-300 mb-2">Descripción</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del cupón"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Tipo *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                >
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="FIXED_AMOUNT">Monto fijo</option>
                  <option value="FREE_SHIPPING">Envío gratis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Valor *</label>
                <input
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Monto mínimo</label>
                <input
                  name="minimumAmount"
                  type="number"
                  value={formData.minimumAmount}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Descuento máximo</label>
                <input
                  name="maximumDiscount"
                  type="number"
                  value={formData.maximumDiscount}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Límite total de uso</label>
                <input
                  name="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Límite por usuario</label>
                <input
                  name="userUsageLimit"
                  type="number"
                  value={formData.userUsageLimit}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Fecha de expiración</label>
                <input
                  name="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-5 py-2.5 rounded-lg font-medium transition ${
                  isFormValid
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {editingCoupon ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
