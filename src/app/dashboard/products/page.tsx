'use client';

import { useState } from 'react';
import {
  Plus,
  Package,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { CreateProductInput, Product } from '@/app/utils/types/Product';
import toast from 'react-hot-toast';
import { ProductFormWizard } from '@/app/components/Product/ProductFromWizard';

// GraphQL Queries and Mutations
const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        description
        price
        currency
        available
        inStock
        stock
        images {
          id
          url
          order
        }
        colors {
          id
          color
          colorHex
        }

        categories {
          category {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      title
      description
      price
      currency
      available
      inStock
      stock
      storeId
      images {
        id
        url
        order
      }
      colors {
        id
        name
        hex
      }
      sizes {
        id
        name
        value
      }
      categories {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      title
      description
      price
      currency
      available
      inStock
      stock
      storeId
      externalId
      images {
        id
        url
        order
      }
      colors {
        id
        color
        colorHex
      }
      variants {
        id
        typeVariant
        nameVariant
        jsonData
      }
      stocks {
        id
        price
      }
      categories {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) {
      id
      name
    }
  }
`;

const DELETE_PRODUCTS = gql`
  mutation DeleteProducts($ids: [String!]!) {
    deleteProducts(ids: $ids) {
      count
    }
  }
`;

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: { storeId: userData?.storeId || '', page: currentPage, pageSize },
    skip: !userData?.storeId,
  });
  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT);
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT);
  const [deleteProducts, { loading: deletingMultiple }] = useMutation(DELETE_PRODUCTS);

  if (!productsData) {
    return null;
  }

  // Use data from GraphQL
  const products: Product[] = productsData?.productsByStore.items || [];
  const totalProducts = productsData?.productsByStore.total || 0;
  const totalPages = productsData?.productsByStore.totalPages || 1; // Use backend-provided totalPages

  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Colors from store - usando slate-900 como color principal
  const primaryColor = '#0F172A'; // slate-900

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProducts([]);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedProducts([]);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    setOpenDropdown(null);
  };

  const handleSaveProduct = async (productData: CreateProductInput) => {
    try {
      if (editingProduct) {
        const storeId = userData?.storeId || 'default-store';
        const { data } = await updateProduct({
          variables: {
            id: editingProduct.id,
            input: {
              name: productData.name,
              title: productData.title,
              description: productData.description,
              price: productData.price,
              currency: productData.currency,
              available: productData.available,
              inStock: productData.inStock,
              stock: productData.stock,
              categories: productData.categoryIds || [],
              images: productData.images.map((img: any) => ({
                url: img.url,
                order: img.order,
              })),
              variants: [
                // Convert colors to variants
                ...productData.colors.map((color: any) => ({
                  typeVariant: 'COLOR',
                  nameVariant: color.name,
                  jsonData: {
                    hex: color.hex,
                    name: color.name,
                  },
                })),
                // Add size variants if available
                ...(productData.sizes || []).map((size: any) => ({
                  typeVariant: 'SIZE',
                  nameVariant: size.name || size,
                  jsonData: {
                    name: size.name || size,
                    value: size.name || size,
                  },
                })),
              ],
              stocks: [
                {
                  price: productData.price,
                  stock: productData.stock,
                },
              ],
            },
          },
        });

        if (data?.updateProduct) {
          await refetchProducts({
            storeId,
            page: currentPage,
            pageSize,
          });
          toast.success('Producto actualizado exitosamente');
        }
      } else {
        const { data } = await createProduct({
          variables: {
            input: {
              name: productData.name,
              title: productData.title,
              description: productData.description,
              price: productData.price,
              currency: productData.currency,
              available: productData.available,
              inStock: productData.inStock,
              stock: productData.stock,
              storeId: userData.storeId || 'default-store',
              categories: productData.categoryIds || [],
              images: productData.images.map((img: any) => ({
                url: img.url,
                order: img.order,
              })),
              variants: [
                // Convert colors to variants
                ...productData.colors.map((color: any) => ({
                  typeVariant: 'COLOR',
                  nameVariant: color.name,
                  jsonData: {
                    hex: color.hex,
                    name: color.name,
                  },
                })),
                // Add size variants if available
                ...(productData.sizes || []).map((size: any) => ({
                  typeVariant: 'SIZE',
                  nameVariant: size.name || size,
                  jsonData: {
                    name: size.name || size,
                    value: size.name || size,
                  },
                })),
              ],
              stocks: [
                {
                  price: productData.price,
                  stock: productData.stock,
                },
              ],
            },
          },
        });
        const storeId = userData?.storeId || 'default-store';
        if (data?.createProduct) {
          await refetchProducts({
            storeId,
            page: currentPage,
            pageSize,
          });
          toast.success('Producto creado exitosamente');
        }
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error.message || 'Error al guardar el producto';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const { data } = await deleteProduct({
        variables: { id: productId },
      });
      const storeId = userData?.storeId || 'default-store';
      if (data?.deleteProduct) {
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
        await refetchProducts({
          storeId,
          page: currentPage,
          pageSize,
        });
        toast.success('Producto eliminado exitosamente');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error.message || 'Error al eliminar el producto';
      toast.error(errorMessage);
    }
    setOpenDropdown(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No hay productos seleccionados para eliminar');
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar ${selectedProducts.length} producto(s)? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const { data } = await deleteProducts({
        variables: { ids: selectedProducts },
      });
      const storeId = userData?.storeId || 'default-store';
      if (data?.deleteProducts) {
        setSelectedProducts([]);
        await refetchProducts({
          storeId,
          page: currentPage,
          pageSize,
        });
        toast.success(`${data.deleteProducts.count} producto(s) eliminado(s) exitosamente`);
      }
    } catch (error: any) {
      console.error('Error deleting products:', error);
      const errorMessage = error.message || 'Error al eliminar los productos';
      toast.error(errorMessage);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts((prev) =>
      prev.length === filteredProducts.length ? [] : filteredProducts.map((p: Product) => p.id)
    );
  };

  if (showForm) {
    return (
      <ProductFormWizard
        product={editingProduct || undefined}
        onSave={handleSaveProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        loading={creating || updating}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Gestión de Productos</h3>
          <p className="text-sm text-gray-400">Administra el catálogo de productos de tu tienda</p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 bg-slate-700 hover:bg-slate-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all placeholder-gray-400"
          />
        </div>

        {selectedProducts.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={deletingMultiple}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deletingMultiple ? 'Eliminando...' : `Eliminar (${selectedProducts.length})`}
          </button>
        )}
      </div>

      {/* Mobile Select All */}
      {filteredProducts.length > 0 && (
        <div className="md:hidden bg-gray-800 border border-gray-700 rounded-lg p-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={
                selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
              style={
                {
                  accentColor: primaryColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties
              }
            />
            <span className="text-sm text-white font-medium">
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </span>
            {selectedProducts.length > 0 && (
              <span className="text-xs text-gray-400">
                ({selectedProducts.length} seleccionados)
              </span>
            )}
          </label>
        </div>
      )}

      {/* Products Table/Cards */}
      {loadingProducts ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-slate-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando productos...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 text-slate-500 focus:ring-slate-500 bg-gray-700"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredProducts.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 rounded border-gray-600 text-slate-500 focus:ring-slate-500 bg-gray-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12">
                            {product.images.length > 0 ? (
                              <img
                                src={`https://emprendyup-images.s3.us-east-1.amazonaws.com/${product.images[0].url}`}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover shadow-sm"
                                style={{
                                  border: `2px solid ${primaryColor}40`,
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-white">{product.name}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {product.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          ${product.price.toLocaleString()} {product.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{product.stock}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                              product.available
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {product.available ? 'Disponible' : 'No disponible'}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold bg-fourth-base text-white rounded-full w-fit`}
                          >
                            {product.inStock ? 'En stock' : 'Sin stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-slate-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleting}
                            className="p-2 text-red-400 hover:bg-red-900 hover:text-red-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product: Product) => (
              <div
                key={product.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm"
                style={{
                  borderColor: selectedProducts.includes(product.id) ? primaryColor : '#374151',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 flex-shrink-0"
                      style={
                        {
                          accentColor: primaryColor,
                          '--tw-ring-color': primaryColor,
                        } as React.CSSProperties
                      }
                    />

                    {/* Image */}
                    <div className="flex-shrink-0">
                      {product.images.length > 0 ? (
                        <img
                          src={`https://emprendyup-images.s3.us-east-1.amazonaws.com/${product.images[0].url}`}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover shadow-sm"
                          style={{ border: `2px solid ${primaryColor}40` }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            border: `2px solid ${primaryColor}40`,
                          }}
                        >
                          <Package className="w-8 h-8" style={{ color: primaryColor }} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{product.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium text-white">
                          ${product.price.toLocaleString()} {product.currency}
                        </span>
                        <span className="text-xs text-gray-400">• Stock: {product.stock}</span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            product.available
                              ? 'bg-green-900 text-green-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {product.available ? 'Disponible' : 'No disponible'}
                        </span>
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-fourth-base text-white rounded-full">
                          {product.inStock ? 'En stock' : 'Sin stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === product.id ? null : product.id)
                      }
                      className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openDropdown === product.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-2" style={{ color: primaryColor }} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleting}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Package className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <p className="text-white text-lg font-medium mb-2">
            {searchTerm ? 'No se encontraron productos' : 'No tienes productos todavía'}
          </p>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primer producto para empezar a vender'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateProduct}
              className="text-white px-6 py-3 rounded-lg hover:shadow-md flex items-center mx-auto font-medium transition-all duration-200"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loadingProducts && totalProducts > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 sm:px-6 shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300 flex items-center">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-300">
                Mostrando{' '}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * pageSize + 1, totalProducts)}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalProducts)}
                </span>{' '}
                de <span className="font-medium">{totalProducts}</span> productos
              </p>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-1 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <option value={10}>10 por página</option>
                <option value={15}>15 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>

            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-lg shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 7) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 4) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNumber = totalPages - 6 + i;
                  } else {
                    pageNumber = currentPage - 3 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${
                        currentPage === pageNumber
                          ? 'z-10 text-white focus:z-20'
                          : 'text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                      }`}
                      style={currentPage === pageNumber ? { backgroundColor: primaryColor } : {}}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
