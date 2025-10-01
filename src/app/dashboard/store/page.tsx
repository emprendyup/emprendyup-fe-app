'use client';

import React, { useEffect, useState } from 'react';

import { gql, useQuery, useMutation } from '@apollo/client';
import Image from 'next/image';
import {
  CheckCircle,
  AlertCircle,
  Settings,
  Palette,
  Building,
  FileText,
  Truck,
  Search,
  Save,
  CreditCard,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import { useSessionStore } from '@/lib/store/dashboard';
import DetailsStore from '@/app/components/Detalles';
import RichTextEditor from '@/app/components/blog/RichTextEditor';
import toast from 'react-hot-toast';

const GET_STORE_CONFIG = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      businessName
      primaryColor
      secondaryColor
      accentColor
      backgroundColor
      textColor
      description
      email
      phone
      address
      city
      department
      country
      businessType
      taxId
      currency
      language
      timezone
      metaTitle
      metaDescription
      metaKeywords
      logoUrl
      faviconUrl
      bannerUrl
      whatsappNumber
      facebookUrl
      instagramUrl
      twitterUrl
      youtubeUrl
      tiktokUrl
      freeShippingThreshold
      standardShippingCost
      expressShippingCost
      taxRate
      includeTaxInPrice
      mercadoPagoEnabled
      mercadoPagoPublicKey
      wompiEnabled
      wompiPublicKey
      ePaycoEnabled
      ePaycoPublicKey
    }
  }
`;

const UPDATE_STORE_CONFIG = gql`
  mutation UpdateStore($storeId: String!, $input: UpdateStoreInput!) {
    updateStore(storeId: $storeId, input: $input) {
      id
      storeId
      name
      businessName
      primaryColor
      secondaryColor
      accentColor
      backgroundColor
      textColor
      description
      email
      phone
      address
      city
      department
      country
      businessType
      taxId
      currency
      language
      timezone
      metaTitle
      metaDescription
      metaKeywords
      logoUrl
      faviconUrl
      bannerUrl
      whatsappNumber
      facebookUrl
      instagramUrl
      twitterUrl
      youtubeUrl
      tiktokUrl
      freeShippingThreshold
      standardShippingCost
      expressShippingCost
      taxRate
      includeTaxInPrice
      mercadoPagoEnabled
      mercadoPagoPublicKey
      wompiEnabled
      wompiPublicKey
      ePaycoEnabled
      ePaycoPublicKey
      __typename
    }
  }
`;
const POLICY_TYPES = [
  { value: 'PRIVACY_POLICY', label: 'Política de Privacidad' },
  { value: 'TERMS_CONDITIONS', label: 'Términos y Condiciones' },
  { value: 'RETURN_POLICY', label: 'Política de Devoluciones' },
  { value: 'SHIPPING_POLICY', label: 'Política de Envíos' },
  { value: 'COOKIE_POLICY', label: 'Política de Cookies' },
];

const GET_POLICIES = gql`
  query GetPolicies($storeId: String!) {
    storePolicies(storeId: $storeId) {
      id
      storeId
      type
      title
      content
      version
      isActive
      language
      lastUpdated
      createdAt
    }
  }
`;

const CREATE_STORE_POLICY = gql`
  mutation CreateStorePolicy($storeId: String!, $input: CreateStorePolicyInput!) {
    createStorePolicy(storeId: $storeId, input: $input) {
      id
      type
      title
      content
      version
      isActive
      language
      lastUpdated
      createdAt
    }
  }
`;
const DELETE_STORE_POLICY = gql`
  mutation DeleteStorePolicy($id: ID!) {
    deleteStorePolicy(id: $id)
  }
`;

const UPDATE_STORE_POLICY = gql`
  mutation UpdateStorePolicy($id: ID!, $input: UpdateStorePolicyInput!) {
    updateStorePolicy(id: $id, input: $input) {
      id
      type
      title
      content
      version
      isActive
      language
      lastUpdated
      createdAt
    }
  }
`;

export default function SingleStoreSettingsPage() {
  const [deletePolicy] = useMutation(DELETE_STORE_POLICY);

  const currentStore = useSessionStore((s: any) => s.currentStore);
  const storeId = currentStore?.storeId;
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const { data, loading, error } = useQuery(GET_STORE_CONFIG, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });

  const [updateStore] = useMutation(UPDATE_STORE_CONFIG);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (data?.store) setFormData(data.store);
  }, [data]);
  // Policy tab state
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({
    title: '',
    content: '',
    type: 'PRIVACY_POLICY',
    language: 'es',
  });
  const { data: policiesData, refetch: refetchPolicies } = useQuery(GET_POLICIES, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });
  const [createPolicy] = useMutation(CREATE_STORE_POLICY);
  const [updatePolicy] = useMutation(UPDATE_STORE_POLICY);

  const handlePolicyFormChange = (e: any) => {
    const { name, value } = e.target;
    setPolicyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyForm({
      title: policy.title,
      content: policy.content,
      language: policy.language,
      type: policy.type ?? 'PRIVACY_POLICY',
    });
    setShowPolicyForm(true);
  };

  const handleCreatePolicy = async (e: any) => {
    e.preventDefault();

    // ✅ Validar si ya existe una política del mismo tipo
    const exists = (policiesData?.storePolicies ?? []).some((p: any) => p.type === policyForm.type);

    if (exists) {
      toast.error('Ya existe una política con este tipo.');
      return;
    }

    try {
      await createPolicy({
        variables: {
          storeId: userData?.storeId,
          input: {
            ...policyForm,
          },
        },
      });

      toast.success('Política creada correctamente ✅', {
        position: 'top-center',
      });

      setShowPolicyForm(false);
      setPolicyForm({
        title: '',
        content: '',
        type: 'PRIVACY_POLICY',
        language: 'es',
      });
      refetchPolicies();
    } catch (err: any) {
      toast.error('Error al crear la política ❌', {
        position: 'top-center',
      });
    }
  };
  const handleDeletePolicy = async (id: string) => {
    try {
      await deletePolicy({ variables: { id } });
      toast.success('Política eliminada correctamente ✅', { position: 'top-center' });
      refetchPolicies();
    } catch (err: any) {
      toast.error('Error al eliminar la política ❌', { position: 'top-center' });
    }
  };

  const handleUpdatePolicy = async (e: any) => {
    e.preventDefault();

    const { title, content, language } = policyForm;

    try {
      await updatePolicy({
        variables: {
          id: editingPolicy.id,
          input: { title, content, language },
        },
      });

      toast.success('Política actualizada correctamente ✅', {
        position: 'top-center',
      });

      setShowPolicyForm(false);
      setEditingPolicy(null);
      setPolicyForm({
        title: '',
        content: '',
        type: 'PRIVACY_POLICY',
        language: 'es',
      });
      refetchPolicies();
    } catch (err: any) {
      toast.error('Error al actualizar la política ❌', {
        position: 'top-center',
      });
    }
  };
  // Helper: verifica si ya existen todas las políticas para el idioma seleccionado
  const allTypesCreated = POLICY_TYPES.every((type) =>
    (policiesData?.storePolicies ?? []).some((p: any) => p.type === type.value)
  );
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

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

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const { id, storeId: _sid, __typename, ...inputData } = formData;

      await updateStore({
        variables: {
          storeId: userData?.storeId || '',
          input: inputData,
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev: any) => ({ ...prev, logoUrl: '' }));
  };

  const handleRemoveFavicon = () => {
    setFormData((prev: any) => ({ ...prev, faviconUrl: '' }));
  };

  const handleRemoveBanner = () => {
    setFormData((prev: any) => ({ ...prev, bannerUrl: '' }));
  };

  const tabs = [
    { id: 'detalles', label: 'Detalles', icon: Info },
    { id: 'general', label: 'General', icon: Settings },
    { id: 'brand', label: 'Marca', icon: Palette },
    { id: 'business', label: 'Negocio', icon: Building },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'shipping', label: 'Envíos', icon: Truck },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'policies', label: 'Políticas', icon: ShieldCheck },
  ];

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontró el ID de la tienda</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fourth-base"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  function setToast({ type, message }: { type: string; message: string }) {
    if (type === 'error') {
      toast.error(message, { position: 'top-center' });
    } else if (type === 'success') {
      toast.success(message, { position: 'top-center' });
    } else {
      toast(message, { position: 'top-center' });
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Tienda</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Personaliza la configuración de tu tienda
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center px-4 py-2 bg-fourth-base text-black rounded-lg hover:bg-fourth-base/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveStatus === 'saving' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              ) : saveStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="container mx-auto px-6">
            <div className="flex gap-2 overflow-x-auto py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? ' text-black shadow bg-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-black ' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 p-6 mt-6">
            <div className="w-full">
              {/* Detalles Tab */}
              {activeTab === 'detalles' && (
                <>
                  <DetailsStore />
                </>
              )}

              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Información General
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre de la Tienda
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Fashion Store"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ID de la Tienda (URL)
                          </label>
                          <input
                            type="text"
                            name="storeId"
                            value={formData.storeId || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="mi-tienda"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descripción
                        </label>
                        <textarea
                          name="description"
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          placeholder="Describe tu tienda..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Moneda
                          </label>
                          <select
                            name="currency"
                            value={formData.currency || 'COP'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          >
                            <option value="COP">Peso Colombiano (COP)</option>
                            <option value="USD">Dólar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="MXN">Peso Mexicano (MXN)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Idioma
                          </label>
                          <select
                            name="language"
                            value={formData.language || 'es'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                            <option value="pt">Português</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Zona Horaria
                          </label>
                          <select
                            name="timezone"
                            value={formData.timezone || 'America/Bogota'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          >
                            <option value="America/Bogota">Bogotá</option>
                            <option value="America/Mexico_City">Ciudad de México</option>
                            <option value="America/New_York">New York</option>
                            <option value="Europe/Madrid">Madrid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Brand Tab */}
              {activeTab === 'brand' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Marca y Apariencia
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      {/* Logo, Favicon, Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Logo
                          </label>
                          <div className="border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                            {formData.logoUrl ? (
                              <div className="space-y-2">
                                <div className="relative inline-block">
                                  <Image
                                    src={resolveImageUrl(formData.logoUrl)}
                                    alt="Logo"
                                    width={300}
                                    height={100}
                                    className="w-full h-16 mx-auto rounded object-cover"
                                    unoptimized={Boolean(
                                      formData.logoUrl?.startsWith('blob:') ||
                                        formData.logoUrl?.startsWith('data:')
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                                    disabled={saveStatus === 'saving'}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="mt-3">
                                  <FileUpload
                                    onFile={(url) =>
                                      setFormData((prev: any) => ({ ...prev, logoUrl: url }))
                                    }
                                    storeId={formData.storeId || storeId}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Sube el logo de tu tienda
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Favicon
                          </label>
                          <div className="border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                            {formData.faviconUrl ? (
                              <div className="space-y-2">
                                <div className="relative inline-block">
                                  <Image
                                    src={resolveImageUrl(formData.faviconUrl)}
                                    alt="Favicon"
                                    width={300}
                                    height={100}
                                    className="w-full h-16 mx-auto rounded object-cover"
                                    unoptimized={Boolean(
                                      formData.faviconUrl?.startsWith('blob:') ||
                                        formData.faviconUrl?.startsWith('data:')
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveFavicon}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                                    disabled={saveStatus === 'saving'}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="mt-3">
                                  <FileUpload
                                    onFile={(url) =>
                                      setFormData((prev: any) => ({ ...prev, faviconUrl: url }))
                                    }
                                    storeId={formData.storeId || storeId}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Ícono de la pestaña del navegador
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Banner
                          </label>
                          <div className="border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                            {formData.bannerUrl ? (
                              <div className="space-y-2">
                                <div className="relative inline-block">
                                  <Image
                                    src={resolveImageUrl(formData.bannerUrl)}
                                    alt="Banner"
                                    width={400}
                                    height={100}
                                    className="w-full h-16 mx-auto rounded object-cover"
                                    unoptimized={Boolean(
                                      formData.bannerUrl?.startsWith('blob:') ||
                                        formData.bannerUrl?.startsWith('data:')
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveBanner}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                                    disabled={saveStatus === 'saving'}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="mt-3">
                                  <FileUpload
                                    onFile={(url) =>
                                      setFormData((prev: any) => ({ ...prev, bannerUrl: url }))
                                    }
                                    storeId={formData.storeId || storeId}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Imagen principal de tu tienda
                          </p>
                        </div>
                      </div>

                      {/* Theme Colors */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                          Colores del Tema
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { key: 'primaryColor', label: 'Principal' },
                            { key: 'secondaryColor', label: 'Secundario' },
                            { key: 'accentColor', label: 'Acento' },
                            { key: 'backgroundColor', label: 'Fondo' },
                            { key: 'textColor', label: 'Texto' },
                          ].map(({ key, label }) => (
                            <div key={key}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {label}
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  name={key}
                                  value={(formData as any)[key] || '#000000'}
                                  onChange={handleInputChange}
                                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  name={key}
                                  value={(formData as any)[key] || ''}
                                  onChange={handleInputChange}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Información del Negocio
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre del Negocio
                          </label>
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Mi Empresa SAS"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Negocio
                          </label>
                          <select
                            name="businessType"
                            value={formData.businessType || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="individual">Persona Natural</option>
                            <option value="sas">SAS</option>
                            <option value="ltda">Limitada</option>
                            <option value="sa">Sociedad Anónima</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            NIT/RUT
                          </label>
                          <input
                            type="text"
                            name="taxId"
                            value={formData.taxId || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="123456789-1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email de Contacto
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="contacto@mitienda.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="+57 300 123 4567"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            WhatsApp
                          </label>
                          <input
                            type="tel"
                            name="whatsappNumber"
                            value={formData.whatsappNumber || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="+57 300 123 4567"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dirección Completa
                        </label>
                        <textarea
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          placeholder="Calle 72 #10-15, Bogotá, Colombia"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ciudad
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Bogotá"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Departamento
                          </label>
                          <input
                            type="text"
                            name="department"
                            value={formData.department || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Cundinamarca"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Métodos de Pago
                    </h2>

                    <div className="space-y-6">
                      {/* MercadoPago */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">MercadoPago</h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="mercadoPagoEnabled"
                              checked={formData.mercadoPagoEnabled || false}
                              onChange={(e) =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  mercadoPagoEnabled: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {formData.mercadoPagoEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Clave Pública
                            </label>
                            <input
                              type="text"
                              name="mercadoPagoPublicKey"
                              value={formData.mercadoPagoPublicKey || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                              placeholder="TEST-..."
                            />
                          </div>
                        )}
                      </div>

                      {/* Wompi */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">Wompi</h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="wompiEnabled"
                              checked={formData.wompiEnabled || false}
                              onChange={(e) =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  wompiEnabled: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {formData.wompiEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Clave Pública
                            </label>
                            <input
                              type="text"
                              name="wompiPublicKey"
                              value={formData.wompiPublicKey || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                              placeholder="pub_test_..."
                            />
                          </div>
                        )}
                      </div>

                      {/* ePayco */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">ePayco</h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="ePaycoEnabled"
                              checked={formData.ePaycoEnabled || false}
                              onChange={(e) =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  ePaycoEnabled: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {formData.ePaycoEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Clave Pública
                            </label>
                            <input
                              type="text"
                              name="ePaycoPublicKey"
                              value={formData.ePaycoPublicKey || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                              placeholder="test_..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Configuración de Envíos
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Envío Gratis Desde (COP)
                          </label>
                          <input
                            type="number"
                            name="freeShippingThreshold"
                            value={formData.freeShippingThreshold || 150000}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                freeShippingThreshold: Number(e.target.value),
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Costo Envío Estándar (COP)
                          </label>
                          <input
                            type="number"
                            name="standardShippingCost"
                            value={formData.standardShippingCost || 15000}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                standardShippingCost: Number(e.target.value),
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Costo Envío Express (COP)
                          </label>
                          <input
                            type="number"
                            name="expressShippingCost"
                            value={formData.expressShippingCost || ''}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                expressShippingCost: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Opcional"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tasa de Impuesto (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            name="taxRate"
                            value={formData.taxRate || 0.19}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                taxRate: Number(e.target.value),
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            IVA Colombia: 0.19 (19%)
                          </p>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="includeTaxInPrice"
                              checked={formData.includeTaxInPrice || false}
                              onChange={(e) =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  includeTaxInPrice: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-fourth-base focus:ring-fourth-base border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Incluir impuesto en el precio
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      SEO y Metadatos
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título Meta
                          </label>
                          <input
                            type="text"
                            name="metaTitle"
                            value={formData.metaTitle || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Título que aparece en Google"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción Meta
                          </label>
                          <textarea
                            rows={4}
                            name="metaDescription"
                            value={formData.metaDescription || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="Descripción que aparece en los resultados de búsqueda"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Palabras Clave Meta
                          </label>
                          <input
                            type="text"
                            name="metaKeywords"
                            value={formData.metaKeywords || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                            placeholder="palabra1, palabra2, palabra3"
                          />
                        </div>

                        <div>
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                            Redes Sociales
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { key: 'facebookUrl', label: 'Facebook' },
                              { key: 'instagramUrl', label: 'Instagram' },
                              { key: 'twitterUrl', label: 'Twitter' },
                              { key: 'youtubeUrl', label: 'YouTube' },
                              { key: 'tiktokUrl', label: 'TikTok' },
                            ].map(({ key, label }) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {label}
                                </label>
                                <input
                                  type="url"
                                  name={key}
                                  value={formData[key] || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                                  placeholder={`https://${label.toLowerCase()}.com/...`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Policies Tab */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Políticas de la Tienda
                    </h2>
                    <button
                      className="px-4 py-2 bg-fourth-base text-black rounded-lg hover:bg-fourth-base/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={allTypesCreated}
                      onClick={() => {
                        if (allTypesCreated) {
                          toast.error(
                            'Solo puedes tener una política por cada tipo (máximo 5 tipos: Privacidad, Términos, Devoluciones, Envíos, Cookies). Si necesitas cambiar una política, edítala o elimina una existente para poder crear otra del mismo tipo.',
                            {
                              position: 'top-center',
                            }
                          );
                          return;
                        }
                        setShowPolicyForm(true);
                        setEditingPolicy(null);
                        setPolicyForm({
                          title: '',
                          content: '',
                          type: 'PRIVACY_POLICY',
                          language: 'es',
                        });
                      }}
                    >
                      Crear nueva política
                    </button>
                  </div>

                  {/* Modal de Política */}
                  {showPolicyForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => {
                          setShowPolicyForm(false);
                          setEditingPolicy(null);
                        }}
                      />

                      {/* Modal */}
                      <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-auto">
                          {/* Header */}
                          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {editingPolicy ? 'Editar Política' : 'Crear Nueva Política'}
                            </h3>
                            <button
                              onClick={() => {
                                setShowPolicyForm(false);
                                setEditingPolicy(null);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Body */}
                          <form onSubmit={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}>
                            <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Título
                                  </label>
                                  <input
                                    type="text"
                                    name="title"
                                    value={policyForm.title}
                                    onChange={handlePolicyFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Política de Privacidad"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo
                                  </label>
                                  <select
                                    name="type"
                                    value={policyForm.type}
                                    onChange={handlePolicyFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  >
                                    {POLICY_TYPES.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Contenido
                                </label>
                                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                  <div className="max-h-64 overflow-y-auto">
                                    <RichTextEditor
                                      value={policyForm.content}
                                      onChange={(value) =>
                                        setPolicyForm({ ...policyForm, content: value })
                                      }
                                      onKeyDown={() => {}}
                                      onSubmit={() => {}}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPolicyForm(false);
                                  setEditingPolicy(null);
                                }}
                                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                              >
                                {editingPolicy ? 'Guardar Cambios' : 'Crear Política'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    {(policiesData?.storePolicies ?? []).length === 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                          No hay políticas registradas.
                        </div>
                      </div>
                    )}

                    {/* Desktop: Lista tipo tabla */}
                    {(policiesData?.storePolicies ?? []).length > 0 && (
                      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Título
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Versión
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {(policiesData?.storePolicies ?? []).map((policy: any) => (
                                <tr
                                  key={policy.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {POLICY_TYPES.find((pt) => pt.value === policy.type)?.label ||
                                        policy.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      {policy.title}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                      {policy.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      v{policy.version}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        className="inline-flex items-center px-3 py-1.5 bg-fourth-base text-white rounded-lg hover:bg-fourth-300 transition-colors text-sm font-medium"
                                        onClick={() => handleEditPolicy(policy)}
                                      >
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                        onClick={() => handleDeletePolicy(policy.id)}
                                      >
                                        <span>
                                          <X width={16} height={16} />
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Mobile: Cards */}
                    {(policiesData?.storePolicies ?? []).length > 0 && (
                      <div className="md:hidden space-y-4">
                        {(policiesData?.storePolicies ?? []).map((policy: any) => (
                          <div
                            key={policy.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                                    {POLICY_TYPES.find((pt) => pt.value === policy.type)?.label ||
                                      policy.type}
                                  </h4>
                                  <div className="flex gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {policy.language.toUpperCase()}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                      v{policy.version}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-4">
                                <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                                  {policy.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                  {policy.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                </p>
                              </div>

                              <button
                                className="w-full px-4 py-2 bg-fourth-base text-white rounded-lg hover:bg-fourth-300 transition-colors text-sm font-medium mb-2"
                                onClick={() => handleEditPolicy(policy)}
                              >
                                Editar
                              </button>
                              <button
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                onClick={() => handleDeletePolicy(policy.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Toast */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Cambios guardados correctamente
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error al guardar los cambios
        </div>
      )}
    </div>
  );
}
