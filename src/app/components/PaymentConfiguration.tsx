'use client';
import React, { useState, useEffect } from 'react';
import { Shield, Save, AlertCircle, CheckCircle, Key, Globe } from 'lucide-react';
import { useStorePaymentConfiguration } from '@/lib/hooks/useStorePaymentConfiguration';
import toast from 'react-hot-toast';

interface PaymentConfigurationProps {
  storeId?: string;
}

export default function PaymentConfiguration({ storeId }: PaymentConfigurationProps = {}) {
  // Fallback para obtener storeId si no se proporciona
  const fallbackStoreId = React.useMemo(() => {
    if (storeId) return storeId;

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return userData?.storeId;
    } catch {
      return undefined;
    }
  }, [storeId]);

  const {
    configuration,
    loading,
    error,
    setupWompiConfiguration,
    setupMercadoPagoConfiguration,
    setupEpaycoConfiguration,
    isWompiEnabled,
    isMercadoPagoEnabled,
    isEpaycoEnabled,
  } = useStorePaymentConfiguration(fallbackStoreId);

  const [activeTab, setActiveTab] = useState('wompi');
  const [saving, setSaving] = useState(false);

  // Wompi configuration state - inicializado vacío
  const [wompiConfig, setWompiConfig] = useState({
    publicKey: '',
    apiKey: '',
    testMode: true,
    webhookUrl: '',
    successUrl: '',
    cancelUrl: '',
  });

  // MercadoPago configuration state - inicializado vacío
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    publicKey: '',
    apiKey: '',
    testMode: true,
  });

  // ePayco configuration state - inicializado vacío
  const [epaycoConfig, setEpaycoConfig] = useState({
    publicKey: '',
    apiKey: '',
    testMode: true,
  });

  // Actualizar los estados solo cuando hay datos guardados en la base de datos
  useEffect(() => {
    if (configuration) {
      // Solo actualizar Wompi si hay datos guardados
      if (configuration.wompiPublicKey || configuration.wompiEnabled) {
        setWompiConfig({
          publicKey: configuration.wompiPublicKey || '',
          apiKey: '',
          testMode: configuration.wompiTestMode ?? true,
          webhookUrl: configuration.webhookUrl || '',
          successUrl: configuration.successUrl || '',
          cancelUrl: configuration.cancelUrl || '',
        });
      }

      // Solo actualizar MercadoPago si hay datos guardados
      if (configuration.mercadoPagoPublicKey || configuration.mercadoPagoEnabled) {
        setMercadoPagoConfig({
          publicKey: configuration.mercadoPagoPublicKey || '',
          apiKey: '',
          testMode: configuration.mercadoPagoTestMode ?? true,
        });
      }

      // Solo actualizar ePayco si hay datos guardados
      if (configuration.epaycoPublicKey || configuration.epaycoEnabled) {
        setEpaycoConfig({
          publicKey: configuration.epaycoPublicKey || '',
          apiKey: '',
          testMode: configuration.epaycoTestMode ?? true,
        });
      }
    }
  }, [configuration]);

  const handleSaveWompi = async () => {
    if (!fallbackStoreId) {
      toast.error('No se pudo identificar la tienda. Por favor, recarga la página.');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving Wompi config with storeId:', fallbackStoreId);
      await setupWompiConfiguration(wompiConfig);
      toast.success('Configuración de Wompi guardada exitosamente');
    } catch (error) {
      console.error('Error saving Wompi config:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la configuración de Wompi';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMercadoPago = async () => {
    if (!fallbackStoreId) {
      toast.error('No se pudo identificar la tienda. Por favor, recarga la página.');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving MercadoPago config with storeId:', fallbackStoreId);
      await setupMercadoPagoConfiguration(mercadoPagoConfig);
      toast.success('Configuración de MercadoPago guardada exitosamente');
    } catch (error) {
      console.error('Error saving MercadoPago config:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la configuración de MercadoPago';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEpayco = async () => {
    if (!fallbackStoreId) {
      toast.error('No se pudo identificar la tienda. Por favor, recarga la página.');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving ePayco config with storeId:', fallbackStoreId);
      await setupEpaycoConfiguration(epaycoConfig);
      toast.success('Configuración de ePayco guardada exitosamente');
    } catch (error) {
      console.error('Error saving ePayco config:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la configuración de ePayco';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 ">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-400 mt-2">Configura los proveedores de pago para tu tienda</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isWompiEnabled
                ? 'bg-green-900/20 border-green-700 shadow-green-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Wompi</h3>
                <p className={`text-sm ${isWompiEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                  {isWompiEnabled ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              {isWompiEnabled ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isMercadoPagoEnabled
                ? 'bg-blue-900/20 border-blue-700 shadow-blue-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">MercadoPago</h3>
                <p
                  className={`text-sm ${isMercadoPagoEnabled ? 'text-blue-400' : 'text-gray-500'}`}
                >
                  {isMercadoPagoEnabled ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              {isMercadoPagoEnabled ? (
                <CheckCircle className="w-6 h-6 text-blue-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isEpaycoEnabled
                ? 'bg-purple-900/20 border-purple-700 shadow-purple-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">ePayco</h3>
                <p className={`text-sm ${isEpaycoEnabled ? 'text-purple-400' : 'text-gray-500'}`}>
                  {isEpaycoEnabled ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              {isEpaycoEnabled ? (
                <CheckCircle className="w-6 h-6 text-purple-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
            </div>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('wompi')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'wompi'
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                Wompi
              </button>
              <button
                onClick={() => setActiveTab('mercadopago')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'mercadopago'
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                MercadoPago
              </button>
              <button
                onClick={() => setActiveTab('epayco')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'epayco'
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                ePayco
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Wompi Configuration */}
            {activeTab === 'wompi' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Configuración de Wompi</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Configura tu integración con Wompi para procesar pagos con tarjetas de crédito,
                    PSE y Nequi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Key className="w-4 h-4 inline mr-2" />
                      Clave Pública
                    </label>
                    <input
                      type="text"
                      value={wompiConfig.publicKey}
                      onChange={(e) =>
                        setWompiConfig({ ...wompiConfig, publicKey: e.target.value })
                      }
                      placeholder="pub_test_xxxxxxxx"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Clave Privada
                    </label>
                    <input
                      type="password"
                      value={wompiConfig.apiKey}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, apiKey: e.target.value })}
                      placeholder="prv_test_xxxxxxxx"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      URL de Webhook
                    </label>
                    <input
                      type="url"
                      value={wompiConfig.webhookUrl}
                      onChange={(e) =>
                        setWompiConfig({ ...wompiConfig, webhookUrl: e.target.value })
                      }
                      placeholder="https://tudominio.com/api/webhooks/wompi"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL de Éxito
                    </label>
                    <input
                      type="url"
                      value={wompiConfig.successUrl}
                      onChange={(e) =>
                        setWompiConfig({ ...wompiConfig, successUrl: e.target.value })
                      }
                      placeholder="https://tudominio.com/orden-exitosa"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL de Cancelación
                    </label>
                    <input
                      type="url"
                      value={wompiConfig.cancelUrl}
                      onChange={(e) =>
                        setWompiConfig({ ...wompiConfig, cancelUrl: e.target.value })
                      }
                      placeholder="https://tudominio.com/checkout/cancel"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="wompi-test-mode"
                      checked={wompiConfig.testMode}
                      onChange={(e) =>
                        setWompiConfig({ ...wompiConfig, testMode: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2 rounded"
                    />
                    <label htmlFor="wompi-test-mode" className="ml-2 block text-sm text-gray-300">
                      Modo de pruebas
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveWompi}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            )}

            {/* MercadoPago Configuration */}
            {activeTab === 'mercadopago' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Configuración de MercadoPago
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Configura tu integración con MercadoPago para procesar pagos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Key className="w-4 h-4 inline mr-2" />
                      Clave Pública
                    </label>
                    <input
                      type="text"
                      value={mercadoPagoConfig.publicKey}
                      onChange={(e) =>
                        setMercadoPagoConfig({ ...mercadoPagoConfig, publicKey: e.target.value })
                      }
                      placeholder="TEST-xxxxxxxx"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={mercadoPagoConfig.apiKey}
                      onChange={(e) =>
                        setMercadoPagoConfig({ ...mercadoPagoConfig, apiKey: e.target.value })
                      }
                      placeholder="TEST-xxxxxxxx"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="mp-test-mode"
                      checked={mercadoPagoConfig.testMode}
                      onChange={(e) =>
                        setMercadoPagoConfig({ ...mercadoPagoConfig, testMode: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2 rounded"
                    />
                    <label htmlFor="mp-test-mode" className="ml-2 block text-sm text-gray-300">
                      Modo de pruebas
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveMercadoPago}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            )}

            {/* ePayco Configuration */}
            {activeTab === 'epayco' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Configuración de ePayco</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Configura tu integración con ePayco para procesar pagos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Key className="w-4 h-4 inline mr-2" />
                      Clave Pública
                    </label>
                    <input
                      type="text"
                      value={epaycoConfig.publicKey}
                      onChange={(e) =>
                        setEpaycoConfig({ ...epaycoConfig, publicKey: e.target.value })
                      }
                      placeholder="ePayco public key"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Clave Privada
                    </label>
                    <input
                      type="password"
                      value={epaycoConfig.apiKey}
                      onChange={(e) => setEpaycoConfig({ ...epaycoConfig, apiKey: e.target.value })}
                      placeholder="ePayco private key"
                      className="w-full p-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="epayco-test-mode"
                      checked={epaycoConfig.testMode}
                      onChange={(e) =>
                        setEpaycoConfig({ ...epaycoConfig, testMode: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2 rounded"
                    />
                    <label htmlFor="epayco-test-mode" className="ml-2 block text-sm text-gray-300">
                      Modo de pruebas
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveEpayco}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-300">Error: {error.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
