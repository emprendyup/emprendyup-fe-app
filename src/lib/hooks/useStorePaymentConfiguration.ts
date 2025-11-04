import { useMutation, useQuery } from '@apollo/client';
import { ApolloError } from '@apollo/client';

import {
  CREATE_PAYMENT_CONFIGURATION,
  GET_PAYMENT_CONFIGURATIONS,
  UPDATE_PAYMENT_CONFIGURATION,
} from '../graphql/queries';
import {
  CreatePaymentConfigurationInput,
  PaymentConfiguration,
  UpdatePaymentConfigurationInput,
} from '@/app/utils/types/payment';

// Error handling for configuration operations
export const getConfigurationErrorMessage = (error: ApolloError): string => {
  if (error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];

    switch (graphQLError.message) {
      case 'Configuration not found':
        return 'Payment configuration not found.';
      case 'Store not found':
        return 'Store not found.';
      case 'Invalid API key':
        return 'The provided API key is invalid.';
      case 'Configuration already exists':
        return 'Payment configuration already exists for this store.';
      case 'Insufficient permissions':
        return 'You do not have permission to manage payment configurations.';
      default:
        return graphQLError.message;
    }
  }

  if (error.networkError) {
    return 'Network error. Please check your connection.';
  }

  return 'An unexpected error occurred.';
};

// Custom hook for payment configurations
export const usePaymentConfigurations = (storeId?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_PAYMENT_CONFIGURATIONS, {
    variables: storeId ? { storeId } : {},
    errorPolicy: 'all',
  });

  const [createConfiguration, { loading: creating, error: createError }] = useMutation(
    CREATE_PAYMENT_CONFIGURATION,
    {
      refetchQueries: [
        { query: GET_PAYMENT_CONFIGURATIONS, variables: storeId ? { storeId } : {} },
      ],
      errorPolicy: 'all',
    }
  );

  const [updateConfiguration, { loading: updating, error: updateError }] = useMutation(
    UPDATE_PAYMENT_CONFIGURATION,
    {
      refetchQueries: [
        { query: GET_PAYMENT_CONFIGURATIONS, variables: storeId ? { storeId } : {} },
      ],
      errorPolicy: 'all',
    }
  );

  const handleCreateConfiguration = async (input: CreatePaymentConfigurationInput) => {
    try {
      const variables: any = { input };
      if (storeId) {
        variables.storeId = storeId;
      }
      const { data } = await createConfiguration({ variables });
      return data?.createPaymentConfiguration;
    } catch (err) {
      throw new Error(getConfigurationErrorMessage(err as ApolloError));
    }
  };

  const handleUpdateConfiguration = async (id: string, input: UpdatePaymentConfigurationInput) => {
    try {
      const { data } = await updateConfiguration({ variables: { id, input } });
      return data?.updatePaymentConfiguration;
    } catch (err) {
      throw new Error(getConfigurationErrorMessage(err as ApolloError));
    }
  };

  return {
    // Data
    configurations: (data?.paymentConfigurations as PaymentConfiguration[]) || [],
    loading: loading || creating || updating,
    error: error || createError || updateError,

    // Actions
    createConfiguration: handleCreateConfiguration,
    updateConfiguration: handleUpdateConfiguration,
    refetch,
  };
};

// Hook for getting current store's configuration
export const useStorePaymentConfiguration = (storeId?: string) => {
  const { configurations, loading, error, createConfiguration, updateConfiguration } =
    usePaymentConfigurations(storeId);

  // Assuming we have a way to get current store ID (could be from context/session)
  const currentConfiguration = configurations[0]; // For now, get the first one

  const setupWompiConfiguration = async (config: {
    publicKey: string;
    apiKey: string;
    testMode: boolean;
    webhookUrl: string;
    successUrl: string;
    cancelUrl: string;
  }) => {
    const input: CreatePaymentConfigurationInput = {
      wompiEnabled: true,
      wompiPublicKey: config.publicKey,
      wompiApiKey: config.apiKey,
      wompiTestMode: config.testMode,
      defaultCurrency: 'COP',
      autoCapture: true,
      webhookUrl: config.webhookUrl,
      successUrl: config.successUrl,
      cancelUrl: config.cancelUrl,
      fraudCheckEnabled: true,
    };

    if (currentConfiguration) {
      return updateConfiguration(currentConfiguration.id, input);
    } else {
      return createConfiguration(input);
    }
  };

  const setupMercadoPagoConfiguration = async (config: {
    publicKey: string;
    apiKey: string;
    testMode: boolean;
  }) => {
    const input: CreatePaymentConfigurationInput = {
      mercadoPagoEnabled: true,
      mercadoPagoPublicKey: config.publicKey,
      mercadoPagoApiKey: config.apiKey,
      mercadoPagoTestMode: config.testMode,
      defaultCurrency: 'COP',
      autoCapture: true,
    };

    if (currentConfiguration) {
      return updateConfiguration(currentConfiguration.id, input);
    } else {
      return createConfiguration(input);
    }
  };

  const setupEpaycoConfiguration = async (config: {
    publicKey: string;
    apiKey: string;
    testMode: boolean;
  }) => {
    const input: CreatePaymentConfigurationInput = {
      epaycoEnabled: true,
      epaycoPublicKey: config.publicKey,
      epaycoApiKey: config.apiKey,
      epaycoTestMode: config.testMode,
      defaultCurrency: 'COP',
      autoCapture: true,
    };

    if (currentConfiguration) {
      return updateConfiguration(currentConfiguration.id, input);
    } else {
      return createConfiguration(input);
    }
  };

  return {
    configuration: currentConfiguration,
    loading,
    error,
    setupWompiConfiguration,
    setupMercadoPagoConfiguration,
    setupEpaycoConfiguration,

    // Helper methods
    isWompiEnabled: currentConfiguration?.wompiEnabled || false,
    isMercadoPagoEnabled: currentConfiguration?.mercadoPagoEnabled || false,
    isEpaycoEnabled: currentConfiguration?.epaycoEnabled || false,
    getWompiPublicKey: () => currentConfiguration?.wompiPublicKey,
    getMercadoPagoPublicKey: () => currentConfiguration?.mercadoPagoPublicKey,
    getEpaycoPublicKey: () => currentConfiguration?.epaycoPublicKey,
    isTestMode: () =>
      currentConfiguration?.wompiTestMode ||
      currentConfiguration?.mercadoPagoTestMode ||
      currentConfiguration?.epaycoTestMode ||
      false,
  };
};
