'use client';

import { gql, useMutation, useQuery } from '@apollo/client';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  GripVertical,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { useMemo, useState, useEffect, JSX } from 'react';
import toast from 'react-hot-toast';

const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    categories {
      id
      name
      slug
      description
      isActive
      order
      createdAt
      updatedAt
      store {
        id
        name
      }
      parent {
        id
        name
        slug
      }
      children {
        id
        name
        slug
        description
        isActive
        order
        createdAt
        updatedAt
        parent {
          id
          name
        }
        children {
          id
          name
          slug
          parent {
            id
            name
          }
          isActive
          order
          createdAt
        }
      }
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      slug
      description
      parentId
      storeId
      isActive
      order
      createdAt
      updatedAt
      store {
        id
        name
      }
      parent {
        id
        name
        slug
      }
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      slug
      description
      isActive
      order
      updatedAt
      parent {
        id
        name
        slug
      }
      store {
        id
        name
      }
    }
  }
`;

const SOFT_DELETE_CATEGORY = gql`
  mutation SoftDeleteCategory($id: ID!) {
    softDeleteCategory(id: $id) {
      id
      name
      isActive
      updatedAt
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

const REORDER_CATEGORIES = gql`
  mutation ReorderCategories($categoryOrders: [CategoryOrderInput!]!) {
    reorderCategories(categoryOrders: $categoryOrders) {
      id
      order
    }
  }
`;

// Types
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
}

interface Store {
  id: string;
  name: string;
}

const CategoryFormModal = ({
  isOpen,
  onClose,
  category,
  onSuccess,
  availableCategories = [],
  preselectedParent = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  onSuccess: () => void;
  availableCategories?: Category[];
  preselectedParent?: Category | null;
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    slug: category?.slug || '',
    parentId: category?.parent?.id || '',
    storeId: category?.store?.id || '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);

  // Update form data when category or preselectedParent prop changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || generateSlug(category.name || ''),
        parentId: category.parent?.id || '',
        storeId: category.store?.id || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentId: preselectedParent?.id || '',
        storeId: preselectedParent?.store?.id || '',
      });
    }
    setErrors({});
  }, [category, preselectedParent]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentId: '',
        storeId: '',
      });
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.length > 80) {
      newErrors.name = 'El nombre no puede exceder 80 caracteres';
    }

    if (!formData.storeId && !category && !preselectedParent) {
      newErrors.storeId = 'La tienda es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Determinar storeId - prioridad: formData > preselectedParent > category
      const storeId = formData.storeId || preselectedParent?.store?.id || category?.store?.id;

      if (!storeId) {
        toast.error('No se pudo determinar la tienda para la categoría');
        return;
      }

      // Sanitize input
      const inputPayload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim(),
        storeId: storeId,
      };

      // Solo agregar parentId si existe y no es una cadena vacía
      if (formData.parentId && formData.parentId.trim()) {
        inputPayload.parentId = formData.parentId;
      }

      console.log('Enviando datos:', inputPayload); // Para debug

      if (category) {
        // Update existing category
        await updateCategory({
          variables: {
            id: category.id,
            input: inputPayload,
          },
        });
        toast.success('Categoría actualizada exitosamente');
      } else {
        // Create new category
        await createCategory({
          variables: {
            input: inputPayload,
          },
        });

        if (formData.parentId) {
          toast.success('Subcategoría creada exitosamente');
        } else {
          toast.success('Categoría creada exitosamente');
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar categoría:', error);
      const errorMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || 'Error al guardar la categoría';

      if (
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('unique') ||
        errorMessage.toLowerCase().includes('already exists')
      ) {
        toast.error(
          `Ya existe una categoría con el nombre "${formData.name}". Por favor usa un nombre diferente.`,
          {
            style: {
              background: '#fef3c7',
              color: '#d97706',
              border: '1px solid #fde68a',
            },
          }
        );
      } else if (errorMessage.toLowerCase().includes('slug')) {
        toast.error('El slug de la categoría ya está en uso. Por favor usa uno diferente.', {
          style: {
            background: '#fef3c7',
            color: '#d97706',
            border: '1px solid #fde68a',
          },
        });
      } else if (
        errorMessage.toLowerCase().includes('validation') ||
        errorMessage.toLowerCase().includes('invalid')
      ) {
        toast.error('Los datos ingresados no son válidos. Por favor revisa la información.', {
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
      } else {
        toast.error(errorMessage, {
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique stores from available categories
  const stores = useMemo(() => {
    const storeMap = new Map();
    availableCategories.forEach((cat) => {
      if (cat.store) {
        storeMap.set(cat.store.id, cat.store);
      }
    });
    return Array.from(storeMap.values());
  }, [availableCategories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {category
              ? 'Editar Categoría'
              : preselectedParent
                ? `Nueva Subcategoría de "${preselectedParent.name}"`
                : 'Nueva Categoría'}
          </h3>

          {/* Banner informativo para subcategorías */}
          {!category && preselectedParent && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Creando subcategoría
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Esta será una subcategoría de &quot;{preselectedParent.name}&quot; en la tienda
                    &quot;{preselectedParent.store?.name}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar tienda para subcategorías (solo lectura) */}
            {!category && preselectedParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tienda
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {preselectedParent.store?.name || 'No especificada'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  La subcategoría hereda la tienda de la categoría padre
                </p>
              </div>
            )}

            {/* Seleccionar tienda solo para categorías principales nuevas */}
            {!category && !preselectedParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tienda *
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.storeId
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white`}
                  disabled={isLoading}
                >
                  <option value="">Seleccionar tienda</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {errors.storeId && <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    slug: generateSlug(newName),
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-white`}
                placeholder="Nombre de la categoría"
                aria-label="Nombre de la categoría"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Show generated slug */}
            {formData.slug && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug generado
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                  /{formData.slug}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este slug se genera automáticamente desde el nombre
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Descripción opcional"
                aria-label="Descripción de la categoría"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal (se mantiene igual)
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  isHardDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  isHardDelete: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isHardDelete ? 'Eliminar Permanentemente' : 'Archivar Categoría'}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isHardDelete ? (
              <>
                ¿Estás seguro de que quieres eliminar permanentemente la categoría{' '}
                <strong>&quot;{categoryName}&quot;</strong>? Esta acción no se puede deshacer.
              </>
            ) : (
              <>
                ¿Estás seguro de que quieres archivar la categoría{' '}
                <strong>&quot;{categoryName}&quot;</strong>? Se mantendrá en el sistema pero no
                estará visible.
              </>
            )}
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isHardDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isHardDelete ? 'Eliminar Permanentemente' : 'Archivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryCard = ({
  category,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onCreateSubcategory,
  isExpanded,
  onToggleExpand,
  depth = 0,
  isMobile = false,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onSoftDelete: (category: Category) => void;
  onHardDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
  onCreateSubcategory: (category: Category) => void;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  depth?: number;
  isMobile?: boolean;
}) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const canCreateSubcategory = category.isActive && depth < 2;

  // En móvil, si es subcategoría (depth > 0), mostrar como lista simple
  if (isMobile && depth > 0) {
    return (
      <div
        className={`border-b border-gray-200 dark:border-gray-700 ${depth === 1 ? 'pl-6' : 'pl-10'}`}
      >
        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          {/* Información de la subcategoría */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Botón expandir/colapsar si tiene hijos */}
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => onToggleExpand?.(category.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
            )}

            {/* Nombre y estado */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {category.name}
              </h4>

              <span
                className={`inline-flex items-center p-1 rounded-full flex-shrink-0 ${
                  category.isActive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {category.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </span>
            </div>
          </div>

          {/* Acciones compactas */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <button
              onClick={() => onEdit(category)}
              disabled={!category.isActive}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30"
              aria-label="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>

            {category.isActive ? (
              <button
                onClick={() => onSoftDelete(category)}
                className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                aria-label="Archivar"
              >
                <Archive className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onRestore(category)}
                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                aria-label="Restaurar"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => onHardDelete(category)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              aria-label="Eliminar permanentemente"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {canCreateSubcategory && (
              <button
                onClick={() => onCreateSubcategory(category)}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                aria-label="Crear subcategoría"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista normal de card (para categorías principales o en desktop)
  return (
    <div className={`space-y-3 ${depth > 0 ? 'pl-4' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        {/* Header con nombre y estado */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />

              {depth > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">
                  Nivel {depth + 1}
                </span>
              )}

              {category.children && category.children.length > 0 && (
                <button
                  onClick={() => onToggleExpand?.(category.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              )}

              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {category.name}
              </h3>
            </div>

            {category.slug && (
              <div className="text-sm text-gray-500 dark:text-gray-400 ml-6 truncate">
                /{category.slug}
              </div>
            )}

            {category.parent && (
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1 truncate">
                Subcategoría de: <span className="font-medium">{category.parent.name}</span>
              </div>
            )}

            {category.store && (
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1 truncate">
                Tienda: <span className="font-medium">{category.store.name}</span>
              </div>
            )}
          </div>

          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
              category.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {category.isActive ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Activo
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Archivado
              </>
            )}
          </span>
        </div>

        {/* Descripción */}
        {category.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Fecha */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>Creado: {formatDate(category.createdAt)}</span>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              disabled={!category.isActive}
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>

            {category.isActive ? (
              <button
                onClick={() => onSoftDelete(category)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <Archive className="h-4 w-4" />
                Archivar
              </button>
            ) : (
              <button
                onClick={() => onRestore(category)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar
              </button>
            )}

            <button
              onClick={() => onHardDelete(category)}
              className="px-3 py-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              aria-label={`Eliminar permanentemente categoría ${category.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {canCreateSubcategory && (
            <button
              onClick={() => onCreateSubcategory(category)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear Subcategoría
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Category Row Component (for desktop table) - Versión simplificada
const CategoryRow = ({
  category,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onCreateSubcategory,
  isExpanded,
  onToggleExpand,
  depth = 0,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onSoftDelete: (category: Category) => void;
  onHardDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
  onCreateSubcategory: (category: Category) => void;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  depth?: number;
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canCreateSubcategory = category.isActive && depth < 2;

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="py-4" style={{ paddingLeft: `${depth * 40 + 24}px` }}>
          <div className="flex items-center gap-2">
            {/* Botón expandir/colapsar para categorías con hijos */}
            {category.children && category.children.length > 0 ? (
              <button
                onClick={() => onToggleExpand?.(category.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6"></div>
            )}

            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {depth > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">
                    Nivel {depth + 1}
                  </span>
                )}
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {category.name}
                </div>
              </div>
              {category.slug && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  /{category.slug}
                </div>
              )}
              {category.parent && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  Subcategoría de: <span className="font-medium">{category.parent.name}</span>
                </div>
              )}
              {category.store && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  Tienda: <span className="font-medium">{category.store.name}</span>
                </div>
              )}
            </div>
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
            {category.description || '—'}
          </div>
        </td>

        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              category.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {category.isActive ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Activo
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Archivado
              </>
            )}
          </span>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
            {formatDate(category.createdAt)}
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              aria-label={`Editar categoría ${category.name}`}
              disabled={!category.isActive}
            >
              <Edit className="h-4 w-4" />
            </button>

            {category.isActive ? (
              <button
                onClick={() => onSoftDelete(category)}
                className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label={`Archivar categoría ${category.name}`}
              >
                <Archive className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onRestore(category)}
                className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                aria-label={`Restaurar categoría ${category.name}`}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            {canCreateSubcategory && (
              <button
                onClick={() => onCreateSubcategory(category)}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label={`Crear subcategoría de ${category.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => onHardDelete(category)}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label={`Eliminar permanentemente categoría ${category.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
};

export default function CategoriesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [preselectedParent, setPreselectedParent] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
    isHardDelete: boolean;
  }>({ isOpen: false, category: null, isHardDelete: false });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const {
    data: categoriesData,
    loading,
    error,
    refetch,
  } = useQuery(GET_ALL_CATEGORIES, {
    errorPolicy: 'all',
  });

  const [softDeleteCategory] = useMutation(SOFT_DELETE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);

  const categories: Category[] = useMemo(() => {
    return categoriesData?.categories || [];
  }, [categoriesData]);

  // Get unique stores for filter
  const stores = useMemo(() => {
    const storeMap = new Map();
    categories.forEach((cat) => {
      if (cat.store) {
        storeMap.set(cat.store.id, cat.store);
      }
    });
    return Array.from(storeMap.values());
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.slug && category.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
        category.store?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'deleted' && !category.isActive);

      const matchesStore = storeFilter === 'all' || category.store?.id === storeFilter;

      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [categories, searchTerm, statusFilter, storeFilter]);

  // Build hierarchy (tree) from flat filteredCategories
  const categoryTree = useMemo(() => {
    type Node = Category & { children: (Category & { children?: any[] })[] };
    const map = new Map<string, Node>();
    const roots: Node[] = [];

    // initialize map
    filteredCategories.forEach((cat) => {
      map.set(cat.id, { ...(cat as Category), children: [] });
    });

    // populate children
    map.forEach((cat) => {
      const parentId = cat.parent?.id;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    // sort children by order recursively
    const sortRec = (nodes: Node[]) => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach((n) => {
        if (n.children && n.children.length) sortRec(n.children as Node[]);
      });
    };
    sortRec(roots);

    return roots;
  }, [filteredCategories]);

  // Función recursiva para renderizar tarjetas en móvil
  const renderCategoryCards = (categoryList: Category[], depth = 0) => {
    return categoryList.map((category) => {
      const isExpanded = expandedIds.has(category.id);

      return (
        <div key={category.id} className="space-y-3">
          <CategoryCard
            category={category}
            onEdit={handleEditCategory}
            onSoftDelete={handleSoftDelete}
            onHardDelete={handleHardDelete}
            onRestore={handleRestoreCategory}
            onCreateSubcategory={handleCreateSubcategory}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
            depth={depth}
          />

          {/* Renderizar hijos si está expandido */}
          {isExpanded && category.children && category.children.length > 0 && (
            <div className="space-y-3 border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-4">
              {renderCategoryCards(category.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Función recursiva para renderizar filas en desktop
  const renderCategoryRows = (categoryList: Category[], depth = 0): JSX.Element[] => {
    return categoryList.flatMap((category: any) => {
      const isExpanded = expandedIds.has(category.id);

      return [
        <CategoryRow
          key={category.id}
          category={category}
          onEdit={handleEditCategory}
          onSoftDelete={handleSoftDelete}
          onHardDelete={handleHardDelete}
          onRestore={handleRestoreCategory}
          onCreateSubcategory={handleCreateSubcategory}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          depth={depth}
        />,
        ...(isExpanded && category.children && category.children.length > 0
          ? renderCategoryRows(category.children, depth + 1)
          : []),
      ];
    });
  };

  // Handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setPreselectedParent(null);
    setIsModalOpen(true);
  };

  const handleCreateSubcategory = (parentCategory: Category) => {
    // Verificar que no se exceda el límite de 3 niveles
    let current = parentCategory;
    let depth = 1;

    while (current.parent) {
      depth++;
      if (depth >= 3) {
        toast.error('No se pueden crear más de 3 niveles de subcategorías', {
          style: {
            background: '#fef3c7',
            color: '#d97706',
            border: '1px solid #fde68a',
          },
        });
        return;
      }
      current = current.parent as Category;
    }

    setEditingCategory(null);
    setPreselectedParent(parentCategory);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setPreselectedParent(null);
    setIsModalOpen(true);
  };

  const handleSoftDelete = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      category,
      isHardDelete: false,
    });
  };

  const handleHardDelete = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      category,
      isHardDelete: true,
    });
  };

  const handleRestoreCategory = async (category: Category) => {
    try {
      await updateCategory({
        variables: {
          id: category.id,
          input: {
            isActive: true,
          },
        },
      });
      toast.success('Categoría restaurada exitosamente');
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || 'Error al restaurar la categoría';
      toast.error(errorMessage, {
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
        },
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.category) return;

    try {
      if (deleteModal.isHardDelete) {
        await deleteCategory({
          variables: { id: deleteModal.category.id },
        });
        toast.success('Categoría eliminada permanentemente');
      } else {
        await softDeleteCategory({
          variables: { id: deleteModal.category.id },
        });
        toast.success('Categoría archivada exitosamente');
      }

      refetch();
      setDeleteModal({ isOpen: false, category: null, isHardDelete: false });
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || 'Error al procesar la operación';
      toast.error(errorMessage, {
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
        },
      });
    }
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Error al cargar categorías
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
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
              Categorías
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona todas las categorías del sistema
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-fit"
          >
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o tienda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Buscar categorías"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'deleted')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="deleted">Archivados</option>
            </select>

            {/* Store Filter */}
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Filtrar por tienda"
            >
              <option value="all">Todas las tiendas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Display - Table on desktop, Cards on mobile */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {categories.length === 0 ? 'No hay categorías' : 'No se encontraron categorías'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {categories.length === 0
                ? 'Comienza creando tu primera categoría de productos.'
                : 'Prueba ajustando los filtros de búsqueda.'}
            </p>
            {categories.length === 0 && (
              <button
                onClick={handleCreateCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Crear primera categoría
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Categorías ({filteredCategories.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Creado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {renderCategoryRows(categoryTree)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="md:hidden space-y-4">
              <div className="px-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Categorías ({filteredCategories.length})
                </h2>
              </div>
              {renderCategoryCards(categoryTree)}
            </div>
          </>
        )}

        {/* Modals */}
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={editingCategory || undefined}
          onSuccess={handleModalSuccess}
          availableCategories={categories}
          preselectedParent={preselectedParent}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, category: null, isHardDelete: false })}
          onConfirm={confirmDelete}
          categoryName={deleteModal.category?.name || ''}
          isHardDelete={deleteModal.isHardDelete}
        />
      </div>
    </div>
  );
}
