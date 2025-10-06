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
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const GET_CATEGORIES_BY_STORE = gql`
  query GetCategoriesByStore($storeId: ID!) {
    categoriesByStore(storeId: $storeId) {
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

const CREATE_STORE_CATEGORY = gql`
  mutation CreateStoreCategory($storeId: String!, $input: CreateStoreCategoryInput!) {
    createStoreCategory(storeId: $storeId, input: $input) {
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

const CREATE_SUBCATEGORY = gql`
  mutation CreateSubcategory($storeId: String!, $input: CreateStoreCategoryInput!) {
    createStoreCategory(storeId: $storeId, input: $input) {
      id
      name
      slug
      description
      parentId
      storeId
      isActive
      order
      createdAt
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
  mutation ReorderCategories($storeId: ID!, $categoryOrders: [CategoryOrderInput!]!) {
    reorderCategories(storeId: $storeId, categoryOrders: $categoryOrders) {
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
  storeId,
  onSuccess,
  availableCategories = [],
  preselectedParent = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  storeId?: string;
  onSuccess: () => void;
  availableCategories?: Category[];
  preselectedParent?: Category | null;
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    slug: category?.slug || '',
    parentId: category?.parent?.id || '',
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

  const [createStoreCategory] = useMutation(CREATE_STORE_CATEGORY);
  const [createSubcategory] = useMutation(CREATE_SUBCATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);

  // Update form data when category or preselectedParent prop changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || generateSlug(category.name || ''),
        parentId: category.parent?.id || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentId: preselectedParent?.id || '',
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Sanitize input: remove parentId when empty (''), and coerce present parentId to string
      const inputPayload: any = { ...formData };
      if (inputPayload.parentId) {
        // ensure it's a string (GraphQL/DB expects string IDs)
        inputPayload.parentId = String(inputPayload.parentId);
      } else {
        // remove falsy parentId (empty string, null, undefined) so backend doesn't receive invalid FK
        delete inputPayload.parentId;
      }

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
        if (storeId) {
          if (inputPayload.parentId) {
            // Variables sent to GraphQL
            await createSubcategory({
              variables: {
                storeId,
                input: inputPayload,
              },
            });
            toast.success('Subcategoría creada exitosamente');
          } else {
            // Variables sent to GraphQL
            await createStoreCategory({
              variables: {
                storeId,
                input: inputPayload,
              },
            });
            toast.success('Categoría creada exitosamente');
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
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
                    Esta será una subcategoría de &quot;{preselectedParent.name}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

// Delete Confirmation Modal
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

// Category Card Component (for mobile)
const CategoryCard = ({
  category,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onCreateSubcategory,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDraggedOver,
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
  onDragStart?: (e: React.DragEvent, category: Category) => void;
  onDragOver?: (e: React.DragEvent, category: Category) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, category: Category) => void;
  onDragEnd?: () => void;
  isDraggedOver?: boolean;
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

  const canCreateSubcategory = category.isActive && depth < 2; // Máximo 3 niveles (0, 1, 2)

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all ${
        isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
      } ${depth > 0 ? 'ml-6' : ''}`}
      draggable={category.isActive && !category.parent}
      onDragStart={(e) => onDragStart?.(e, category)}
      onDragOver={(e) => onDragOver?.(e, category)}
      onDragEnd={onDragEnd}
    >
      {/* Header with name and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />

            {/* Mostrar nivel de profundidad */}
            {depth > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                Nivel {depth + 1}
              </span>
            )}

            {/* Botón expandir/colapsar para categorías con hijos */}
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => onToggleExpand?.(category.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </button>
            )}

            <h3 className="font-medium text-gray-900 dark:text-white truncate">{category.name}</h3>
          </div>

          {category.slug && (
            <div className="text-sm text-gray-500 dark:text-gray-400 ml-6">/{category.slug}</div>
          )}

          {category.parent && (
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
              Subcategoría de: <span className="font-medium">{category.parent.name}</span>
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

      {/* Description */}
      {category.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {category.description}
        </p>
      )}

      {/* Date */}
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
        <span>Creado: {formatDate(category.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Primera fila de acciones */}
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

        {/* Botón de crear subcategoría (solo para categorías activas y hasta nivel 2) */}
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
  );
};

// Category Row Component (for desktop table) - ACTUALIZADO
const CategoryRow = ({
  category,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onCreateSubcategory,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDraggedOver,
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
  onDragStart?: (e: React.DragEvent, category: Category) => void;
  onDragOver?: (e: React.DragEvent, category: Category) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, category: Category) => void;
  onDragEnd?: () => void;
  isDraggedOver?: boolean;
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

  const canCreateSubcategory = category.isActive && depth < 2; // Máximo 3 niveles (0, 1, 2)

  return (
    <>
      <tr
        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
          isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500' : ''
        }`}
        draggable={category.isActive && !category.parent}
        onDragStart={(e) => onDragStart?.(e, category)}
        onDragOver={(e) => onDragOver?.(e, category)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop?.(e, category)}
        onDragEnd={onDragEnd}
      >
        <td className="py-4" style={{ paddingLeft: `${depth * 40 + 24}px` }}>
          <div className="flex items-center gap-2">
            {/* Botón expandir/colapsar para categorías con hijos */}
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => onToggleExpand?.(category.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            <div>
              <div className="flex items-center gap-2">
                {/* Mostrar nivel de profundidad */}
                {depth > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    Nivel {depth + 1}
                  </span>
                )}
                <div className="font-medium text-gray-900 dark:text-white">{category.name}</div>
              </div>
              {category.slug && (
                <div className="text-sm text-gray-500 dark:text-gray-400">/{category.slug}</div>
              )}
              {category.parent && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Subcategoría de: <span className="font-medium">{category.parent.name}</span>
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
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(category.createdAt)}
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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

            {/* Botón crear subcategoría (solo hasta nivel 2) */}
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

      {/* Renderizar hijos si está expandido y hay hijos */}
      {isExpanded && category.children && category.children.length > 0 && (
        <>
          {category.children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              onEdit={onEdit}
              onSoftDelete={onSoftDelete}
              onHardDelete={onHardDelete}
              onRestore={onRestore}
              onCreateSubcategory={onCreateSubcategory}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </>
  );
};

export default function CategoriesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [preselectedParent, setPreselectedParent] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
    isHardDelete: boolean;
  }>({ isOpen: false, category: null, isHardDelete: false });
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const [draggedItem, setDraggedItem] = useState<Category | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<Category | null>(null);
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
  } = useQuery(GET_CATEGORIES_BY_STORE, {
    variables: { storeId: userData?.storeId },
    skip: !userData?.storeId,
    errorPolicy: 'all',
  });

  const [softDeleteCategory] = useMutation(SOFT_DELETE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [reorderCategories] = useMutation(REORDER_CATEGORIES);

  const categories: Category[] = useMemo(() => {
    return categoriesData?.categories || categoriesData?.categoriesByStore || [];
  }, [categoriesData]);

  // Construir árbol de categorías jerárquico
  const buildCategoryTree = (categoriesList: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const roots: Category[] = [];

    // Primero, crear un mapa de todas las categorías
    categoriesList.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Luego, construir la jerarquía
    categoriesList.forEach((category) => {
      const node = categoryMap.get(category.id)!;
      if (category.parent?.id && categoryMap.has(category.parent.id)) {
        const parent = categoryMap.get(category.parent.id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
        // Ordenar hijos por order
        parent.children.sort((a, b) => a.order - b.order);
      } else {
        roots.push(node);
      }
    });

    // Ordenar raíces por order
    return roots.sort((a, b) => a.order - b.order);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const filtered = categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.slug && category.slug.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'deleted' && !category.isActive);

      return matchesSearch && matchesStatus;
    });

    return buildCategoryTree(filtered);
  }, [categories, searchTerm, statusFilter]);

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
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            isDraggedOver={draggedOverItem?.id === category.id}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
            depth={depth}
          />

          {/* Renderizar hijos si está expandido */}
          {isExpanded && category.children && category.children.length > 0 && (
            <div className="space-y-3">{renderCategoryCards(category.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Función recursiva para renderizar filas en desktop
  const renderCategoryRows = (categoryList: Category[], depth = 0) => {
    return categoryList.map((category) => (
      <CategoryRow
        key={category.id}
        category={category}
        onEdit={handleEditCategory}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        onRestore={handleRestoreCategory}
        onCreateSubcategory={handleCreateSubcategory}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        isExpanded={expandedIds.has(category.id)}
        onToggleExpand={toggleExpand}
        depth={depth}
      />
    ));
  };

  // Handlers (se mantienen igual)
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setPreselectedParent(null);
    setIsModalOpen(true);
  };

  const handleCreateSubcategory = (parentCategory: Category) => {
    // Verificar que no se exceda el límite de 3 niveles
    let current = parentCategory;
    let depth = 1; // Ya estamos en al menos nivel 1

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

      if (
        errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden')
      ) {
        toast.error('No tienes permisos para restaurar esta categoría', {
          style: {
            background: '#fef3c7',
            color: '#d97706',
            border: '1px solid #fde68a',
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
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(category);
  };

  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, dropTarget: Category) => {
    e.preventDefault();
    if (draggedItem?.parent || dropTarget?.parent) {
      toast.error('Solo se pueden reordenar las categorías de primer nivel', {
        style: {
          background: '#fef3c7',
          color: '#d97706',
          border: '1px solid #fde68a',
        },
      });
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    if (!draggedItem || draggedItem.id === dropTarget.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // Only allow reordering within the same store and same status (active/inactive)
    if (
      draggedItem.store?.id !== dropTarget.store?.id ||
      draggedItem.isActive !== dropTarget.isActive
    ) {
      toast.error('Solo puedes reordenar categorías dentro de la misma tienda y estado', {
        style: {
          background: '#fef3c7',
          color: '#d97706',
          border: '1px solid #fde68a',
        },
      });
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    try {
      // Get all categories for the same store and status, sorted by current order
      // Reorder only among categories that belong to the same store, same active state,
      // and the same parent (so subcategories reorder within their parent).
      const draggedParentId = draggedItem.parent?.id || null;
      const sameStoreCategories = filteredCategories
        .filter((cat) => {
          const parentId = cat.parent?.id || null;
          return (
            cat.store?.id === draggedItem.store?.id &&
            cat.isActive === draggedItem.isActive &&
            parentId === draggedParentId
          );
        })
        .sort((a, b) => a.order - b.order);

      // Find positions
      const draggedIndex = sameStoreCategories.findIndex((cat) => cat.id === draggedItem.id);
      const targetIndex = sameStoreCategories.findIndex((cat) => cat.id === dropTarget.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Create new array with reordered items
      const reorderedCategories = [...sameStoreCategories];
      const [removed] = reorderedCategories.splice(draggedIndex, 1);
      reorderedCategories.splice(targetIndex, 0, removed);

      // Create the category orders array for the mutation
      const categoryOrders = reorderedCategories.map((category, index) => ({
        id: category.id,
        order: index + 1,
      }));

      // Execute the reorder mutation
      await reorderCategories({
        variables: {
          storeId: draggedItem.store?.id || userData?.storeId,
          categoryOrders,
        },
      });

      toast.success('Categorías reordenadas exitosamente');
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || 'Error al reordenar categorías';
      toast.error(errorMessage, {
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
        },
      });
    } finally {
      setDraggedItem(null);
      setDraggedOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
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

      // Handle specific error messages
      if (errorMessage.includes('Cannot delete category with active subcategories')) {
        toast.error(
          `No se puede eliminar la categoría "${deleteModal.category.name}" porque tiene subcategorías activas. Elimina las subcategorías primero.`,
          {
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
            },
          }
        );
      } else if (
        errorMessage.toLowerCase().includes('productos asociados') ||
        errorMessage.toLowerCase().includes('has products') ||
        (errorMessage.toLowerCase().includes('cannot delete') &&
          errorMessage.toLowerCase().includes('products'))
      ) {
        toast.error(
          `No se puede eliminar la categoría "${deleteModal.category.name}" porque tiene productos asociados. Reasigna o elimina los productos primero.`,
          {
            style: {
              background: '#fef3c7',
              color: '#d97706',
              border: '1px solid #fde68a',
            },
          }
        );
      } else if (
        errorMessage.toLowerCase().includes('constraint') ||
        errorMessage.toLowerCase().includes('foreign key')
      ) {
        toast.error(
          `No se puede eliminar la categoría "${deleteModal.category.name}" debido a restricciones de integridad. Verifica que no tenga elementos dependientes.`,
          {
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
            },
          }
        );
      } else {
        toast.error(errorMessage, {
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
      }
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
              Gestiona las categorías de productos (máximo 3 niveles)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o slug..."
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
                  Categorías ({categories.length})
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
                    {renderCategoryRows(filteredCategories)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="md:hidden space-y-4">
              <div className="px-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Categorías ({categories.length})
                </h2>
              </div>
              {renderCategoryCards(filteredCategories)}
            </div>
          </>
        )}

        {/* Modals */}
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={editingCategory || undefined}
          storeId={userData?.storeId}
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
