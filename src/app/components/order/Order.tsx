'use client';
import React, { use, useEffect, useState } from 'react';
import Image from 'next/image';
import { cartService, Cart as CartType, CartItem } from '@/lib/Cart';
import { ChevronDown, ChevronRight, Link, Shield, ShieldCheck } from 'lucide-react';
import { gql, useQuery, useMutation } from '@apollo/client';
// import { useSession } from 'next-auth/react'; // Removed - using custom auth
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import crypto from 'crypto';
import { CREATE_PAYMENT } from '@/lib/graphql/queries';
import { useWompiPayment } from '@/lib/hooks/usePayments';
import { useStorePaymentConfiguration } from '@/lib/hooks/useStorePaymentConfiguration';
import { PaymentMethod, PaymentProvider } from '@/app/utils/types/payment';

// Helper functions for Wompi integration
const generatePaymentReference = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${random}`;
};

// IMPORTANT: In production, this function should be moved to your backend API
// to protect the integrity secret. Create an endpoint like /api/wompi/generate-signature
const generateIntegritySignature = (
  reference: string,
  amountInCents: number,
  currency: string,
  expirationTime: string,
  integritySecret: string
) => {
  // Concatenate according to Wompi documentation:
  // <Reference><Amount><Currency><ExpirationTime><IntegritySecret>
  const concatenatedString = `${reference}${amountInCents}${currency}${expirationTime}${integritySecret}`;
  // Create SHA256 hash
  return crypto.createHash('sha256').update(concatenatedString).digest('hex');
};

const formatAmountInCents = (amount: number) => {
  return Math.round(amount * 100);
};

const getTaxAmount = (subtotal: number) => {
  return Math.round(subtotal * 0.19); // Assuming a fixed 19% tax rate
};

const getExpirationTime = () => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1); // 1 hour from now
  return expiration.toISOString();
};

// GraphQL mutation to create address
const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
      name
      street
      city
      department
      postalCode
      phone
      isDefault
      userId
    }
  }
`;
const GET_STORE_CONFIG = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      mercadoPagoEnabled
      mercadoPagoPublicKey
      wompiEnabled
      wompiPublicKey
      ePaycoEnabled
      ePaycoPublicKey
    }
  }
`;

const GET_ADDRESSES_BY_USER = gql`
  query GetAddressesByUser {
    addressesByUser {
      id
      name
      street
      city
      department
      postalCode
      phone
      isDefault
      userId
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
      total
      subtotal
      tax
      shipping
      createdAt
      items {
        id
        quantity
        price
        productId
      }
    }
  }
`;

interface Address {
  id?: string;
  name: string;
  street: string;
  city: string;
  department: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}
interface CreateAddressInput {
  name: string;
  street: string;
  city: string;
  department: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}
interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number; // GraphQL input expects "unitPrice"
}
interface CreateOrderInput {
  addressId: string;
  items: OrderItemInput[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  storeId?: string; // Optional, some backends require this for product validation
}
interface AccordionStepProps {
  step: number;
  title: string;
  isOpen: boolean;
  isCompleted: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}

const AccordionStep: React.FC<AccordionStepProps> = ({
  step,
  title,
  isOpen,
  isCompleted,
  isDisabled = false,
  children,
  onToggle,
}) => {
  return (
    <div
      className={`border border-gray-700 bg-gray-800 rounded-lg mb-4 ${isDisabled ? 'opacity-50' : ''}`}
    >
      <button
        onClick={isDisabled ? undefined : onToggle}
        disabled={isDisabled}
        title={isDisabled ? 'Completa el paso anterior para continuar' : ''}
        className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
          isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-750'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
              isCompleted
                ? 'bg-green-600'
                : isOpen
                  ? 'bg-blue-600'
                  : isDisabled
                    ? 'bg-gray-600'
                    : 'bg-gray-500'
            }`}
          >
            {isCompleted ? '✓' : step}
          </div>
          <h3 className={`text-lg font-semibold ${isDisabled ? 'text-gray-500' : 'text-white'}`}>
            {title}
          </h3>
        </div>
        {isDisabled ? (
          <span className="text-xs text-gray-500 italic"></span>
        ) : isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && !isDisabled && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

interface OrderSummaryProps {
  cart: CartType;
  store?: any; // Optional for future theming support
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OrderSummary({ cart, store }: OrderSummaryProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Resumen del Pedido</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Subtotal:</span>
          <span className="font-medium text-white">${cart.subtotal.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">IVA (19%):</span>
          <span className="font-medium text-white">${cart.tax.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Envío:</span>
          <span className="font-medium text-white">
            {cart.shipping === 0 ? 'Gratis' : `$${cart.shipping.toLocaleString('es-CO')}`}
          </span>
        </div>
        {cart.shipping === 0 && cart.subtotal >= 150000 && (
          <p className="text-sm text-green-400">¡Envío gratis por compras superiores a $150.000!</p>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-white">Total:</span>
          <span className="text-xl font-bold text-white">
            ${cart.total.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Métodos de Pago Aceptados:</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-700 border border-gray-600 p-2 rounded text-center text-xs font-medium text-gray-200">
            MercadoPago
          </div>
          <div className="bg-gray-700 border border-gray-600 p-2 rounded text-center text-xs font-medium text-gray-200">
            Wompi
          </div>
          <div className="bg-gray-700 border border-gray-600 p-2 rounded text-center text-xs font-medium text-gray-200">
            ePayco
          </div>
          <div className="bg-gray-700 border border-gray-600 p-2 rounded text-center text-xs font-medium text-gray-200">
            Tarjeta
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Order() {
  const [cart, setCart] = useState<CartType>({
    items: [],
    total: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
  });
  const router = useRouter();
  // const { data: session } = useSession(); // Removed - using custom auth
  const [user, setUser] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [userData, setUserData] = useState<any>({});

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Payment hooks
  const { createWompiPayment, loading: paymentLoading, error: paymentError } = useWompiPayment();
  const {
    configuration: paymentConfig,
    isWompiEnabled,
    getWompiPublicKey,
  } = useStorePaymentConfiguration();
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      setUserData(stored ? JSON.parse(stored) : {});
    }
  }, []);
  const { data, loading, error } = useQuery(GET_STORE_CONFIG, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });
  const store = data?.store;
  // Generate payment reference on component mount
  React.useEffect(() => {
    setPaymentReference(generatePaymentReference());
  }, []);

  // GraphQL hooks
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const [createOrder] = useMutation(CREATE_ORDER);
  const [createPayment] = useMutation(CREATE_PAYMENT);

  // Query to get user addresses with bearer token validation
  const {
    data: addressesData,
    loading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useQuery(GET_ADDRESSES_BY_USER, {
    skip: !userData.id, // Skip query if user is not authenticated
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  // Colombian departments and cities data
  const departments = [
    'Amazonas',
    'Cundinamarca',
    'Antioquia',
    'Arauca',
    'Atlántico',
    'Bolívar',
    'Boyacá',
    'Caldas',
    'Caquetá',
    'Casanare',
    'Cauca',
  ];

  const cities = [
    'Bogotá',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cúcuta',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Ibagué',
    'Manizales',
    'Valledupar',
  ];

  // Load cart on component mount
  React.useEffect(() => {
    setCart(cartService.getCart());
  }, []);

  const [address, setAddress] = useState<Address>({
    name: '',
    street: '',
    city: '',
    department: '',
    postalCode: '',
    phone: '',
    isDefault: false,
  });

  const handleStepToggle = (step: number) => {
    // Prevent accessing steps that require previous completion
    if (step === 2 && cart.items.length === 0) {
      alert('Agrega productos al carrito antes de continuar');
      return;
    }

    if (step === 3 && !isAddressCompleted) {
      alert('Completa la información de dirección antes de continuar');
      return;
    }

    setActiveStep(activeStep === step ? 0 : step);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user && !userData?.id) {
      alert('Debes iniciar sesión para guardar la dirección');
      return;
    }

    // If an existing address is selected, use it
    if (selectedAddressId && !showNewAddressForm) {
      const selectedAddress = addressesData?.addressesByUser?.find(
        (addr: Address) => addr.id === selectedAddressId
      );
      if (selectedAddress) {
        setAddress({
          ...selectedAddress,
          id: selectedAddressId,
        });

        // Mark step as completed and move to next step
        setCompletedSteps([...completedSteps.filter((s) => s !== 2), 2]);
        setActiveStep(3);
        return;
      }
    }

    // Validate new address form
    const isValid =
      address.name && address.street && address.city && address.department && address.phone;

    if (!isValid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmittingAddress(true);

    try {
      // Create address input for GraphQL mutation
      const addressInput = {
        name: address.name,
        street: address.street,
        city: address.city,
        department: address.department,
        postalCode: address.postalCode,
        phone: address.phone,
        isDefault: address.isDefault,
      };

      // Execute the mutation
      const { data } = await createAddress({
        variables: {
          input: addressInput,
        },
      });

      // Update the address state with the returned ID
      setAddress((prev) => ({
        ...prev,
        id: data.createAddress.id,
      }));

      // Select the newly created address
      setSelectedAddressId(data.createAddress.id);

      // Hide new address form and show success
      setShowNewAddressForm(false);

      // Refetch addresses to update the list
      await refetchAddresses();

      // Mark step as completed and move to next step
      setCompletedSteps([...completedSteps.filter((s) => s !== 2), 2]);
      setActiveStep(3);

      toast.success('Dirección guardada exitosamente');
    } catch (error) {
      console.error('Error creating address:', error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }

      // Handle GraphQL errors
      if ((error as any).graphQLErrors?.length > 0) {
        const gqlError = (error as any).graphQLErrors[0];
        alert(`Error: ${gqlError.message}`);
      } else if ((error as any).networkError) {
        alert('Error de conexión. Verifica tu conexión a internet.');
      } else {
        alert('Error al guardar la dirección. Por favor intenta nuevamente.');
      }
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);

    // Clear the new address form when selecting an existing address
    setAddress({
      name: '',
      street: '',
      city: '',
      department: '',
      postalCode: '',
      phone: '',
      isDefault: false,
    });
  };

  const handleNewAddressClick = () => {
    setShowNewAddressForm(true);
    setSelectedAddressId('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    // Check if user is authenticated
    if (!userData?.id) {
      alert('Debes iniciar sesión para completar la orden');
      return;
    }

    // Check if address is saved or selected
    const addressId = address.id || selectedAddressId;
    if (!addressId) {
      alert('Debes seleccionar o guardar una dirección antes de completar la orden');
      return;
    }

    // Check if Wompi is enabled
    if (!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
      alert('El sistema de pagos no está configurado correctamente');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Prepare order items from cart
      const orderItems: OrderItemInput[] = cart.items.map((item: CartItem) => ({
        productId: item.productId, // Use productId instead of id
        quantity: item.quantity,
        unitPrice: item.price, // GraphQL input expects "unitPrice"
      }));

      // Create order input for GraphQL mutation
      const orderInput: CreateOrderInput = {
        addressId: addressId, // Use selected or created address ID
        items: orderItems,
        total: cart.total,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        // Some backends require storeId for product validation
        // Include store ID if available
        ...(userData?.storeId && !userData?.id && { storeId: userData.storeId }),
        ...(userData?.id && { storeId: userData.id }),
      };

      // First, create the order
      const { data } = await createOrder({
        variables: {
          input: orderInput,
        },
      });

      const createdOrder = data.createOrder;

      // Then create a payment record in the system using GraphQL
      const selectedAddress = selectedAddressId
        ? addressesData?.addressesByUser?.find((addr: Address) => addr.id === selectedAddressId) ||
          address
        : address;

      const paymentInput = {
        amount: cart.total,
        currency: 'COP',
        provider: PaymentProvider.WOMPI,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        description: `Pago para orden ${createdOrder.id}`,
        customerEmail: userData.email || '',
        customerPhone: selectedAddress?.phone || '',
        orderId: createdOrder.id,
        externalReference: paymentReference,
        ...(userData?.id && { storeId: userData.id }),
        ...(userData?.storeId && !userData?.id && { storeId: userData.storeId }),
      };

      const { data: paymentData } = await createPayment({
        variables: {
          input: paymentInput,
        },
      });

      const paymentRecord = paymentData.createPayment;

      // Generate Wompi payment data
      const reference = paymentRecord.id; // Use payment ID as reference
      const amountInCents = formatAmountInCents(cart.total);
      const currency = 'COP';
      const expirationTime = getExpirationTime();

      // Get Wompi configuration
      const wompiPublicKey =
        getWompiPublicKey() ||
        process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
        'pub_test_G6jyWcpGlLJG8ATDRf9u6gLKy3MH8J';

      // IMPORTANT: In production, generate signature on backend
      const integritySecret =
        process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET || 'test_integrity_secret';
      const integritySignature = generateIntegritySignature(
        reference,
        amountInCents,
        currency,
        expirationTime,
        integritySecret
      );

      const wompiData = {
        'public-key': wompiPublicKey,
        currency: currency,
        'amount-in-cents': amountInCents.toString(),
        reference: reference,
        'signature:integrity': integritySignature,
        'expiration-time': expirationTime,
        'redirect-url': `${window.location.origin}/orden-exitosa?payment=${paymentRecord.id}`,
        'customer-data:email': userData?.email || '',
        'customer-data:phone': selectedAddress?.phone || '',
        'customer-data:full-name': userData?.name || selectedAddress?.name || '',
        'customer-data:legal-id': '',
        'customer-data:legal-id-type': 'CC',
        'shipping-address:address-line-1': selectedAddress?.street || '',
        'shipping-address:city': selectedAddress?.city || '',
        'shipping-address:country': 'CO',
        'shipping-address:region': selectedAddress?.department || '',
        'shipping-address:phone-number': selectedAddress?.phone || '',
        'shipping-address:name': selectedAddress?.name || userData?.name || '',
        'tax-in-cents:vat': formatAmountInCents(cart.tax).toString(),
        'tax-in-cents:consumption': formatAmountInCents(cart.tax).toString(),
        'payment-methods': 'CARD,NEQUI,PSE',
      };

      // Instead of showing widget, redirect to Wompi checkout
      const redirectToWompiCheckout = (wompiData: any) => {
        const baseUrl = 'https://checkout.wompi.co/p/';
        const params = new URLSearchParams();

        Object.entries(wompiData).forEach(([key, value]) => {
          if (value && value !== 'undefined') {
            params.append(key, value.toString());
          }
        });

        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        // Clear cart before redirect since we're leaving the app
        cartService.clearCart();

        // Redirect to Wompi checkout
        window.location.href = checkoutUrl;
      };

      // Redirect to Wompi checkout instead of showing widget
      redirectToWompiCheckout(wompiData);

      // Mark step as completed
      setCompletedSteps([...completedSteps.filter((s) => s !== 3), 3]);

      // Note: Don't clear cart until payment is confirmed via webhook
    } catch (error) {
      console.error('Error creating order and payment:', error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        alert(`Error: ${error.message}`);
      } else {
        alert('Error al crear la orden y procesar el pago. Por favor intenta nuevamente.');
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const isAddressCompleted =
    completedSteps.includes(2) || (!!selectedAddressId && !showNewAddressForm);
  const isPaymentCompleted = completedSteps.includes(3);

  // Prepare Wompi payment data
  const prepareWompiData = () => {
    const selectedAddress = selectedAddressId
      ? addressesData?.addressesByUser?.find((addr: Address) => addr.id === selectedAddressId) ||
        address
      : address;

    const amountInCents = formatAmountInCents(cart.total);
    const currency = 'COP';
    const expirationTime = getExpirationTime();

    // Wompi integrity secret (should be in environment variables)
    const integritySecret =
      process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET ||
      'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6';

    // Generate integrity signature according to Wompi documentation
    const integritySignature = generateIntegritySignature(
      paymentReference,
      amountInCents,
      currency,
      expirationTime,
      integritySecret
    );

    const wompiData = {
      publicKey:
        store?.wompiPublicKey ||
        process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
        'pub_test_G6jyWcpGlLJG8ATDRf9u6gLKy3MH8J',
      currency,
      amountInCents,
      reference: paymentReference,
      integritySignature, // Now properly calculated according to Wompi documentation
      redirectUrl: `${window.location.origin}/orden-exitosa`,
      expirationTime,
      taxVatInCents: formatAmountInCents(cart.tax),
      taxConsumptionInCents: 0, // Colombia doesn't typically use consumption tax for most products
      customerEmail: user?.email || '',
      customerFullName: user?.name || selectedAddress?.name || '',
      customerPhoneNumber: selectedAddress?.phone || '',
      customerLegalId: '', // This would need to be collected separately
      customerLegalIdType: 'CC', // Default to Cédula de Ciudadanía
      shippingAddressLine1: selectedAddress?.street || '',
      shippingCountry: 'CO',
      shippingPhoneNumber: selectedAddress?.phone || '',
      shippingCity: selectedAddress?.city || '',
      shippingRegion: selectedAddress?.department || '',
    };

    return wompiData;
  };

  // Show login prompt if not authenticated
  if (!user && !userData?.id) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Inicia sesión para continuar</h2>
            <p className="text-gray-400 mb-6">
              Necesitas iniciar sesión para guardar tu dirección y completar la orden.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-colors bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-8">Finalizar Orden</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
              <div className="px-6 py-8">
                {/* Step 1: Order Summary */}
                <AccordionStep
                  step={1}
                  title="Resumen de la Orden"
                  isOpen={activeStep === 1}
                  isCompleted={true}
                  onToggle={() => handleStepToggle(1)}
                >
                  <div className="space-y-4">
                    {cart.items.map((item: CartItem) => (
                      <div
                        key={`${item.id}-${item.variant}`}
                        className="flex items-center space-x-4 p-4 border border-gray-600 bg-gray-750 rounded-lg"
                      >
                        <Image
                          src={
                            item.image?.startsWith('http')
                              ? item.image
                              : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${item.image}`
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          {item.variant && (
                            <p className="text-sm text-gray-400">Variante: {item.variant}</p>
                          )}
                          <p className="text-sm text-gray-400">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">
                            ${(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionStep>

                {/* Step 2: Address Form */}
                <AccordionStep
                  step={2}
                  title="Dirección de Entrega"
                  isOpen={activeStep === 2}
                  isCompleted={isAddressCompleted}
                  isDisabled={cart.items.length === 0}
                  onToggle={() => handleStepToggle(2)}
                >
                  <div className="space-y-6">
                    {/* Loading state */}
                    {addressesLoading && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                        <span className="ml-2 text-gray-400">Cargando direcciones...</span>
                      </div>
                    )}

                    {/* Error state */}
                    {addressesError && (
                      <div className="bg-red-900/50 border border-red-700 rounded-md p-4">
                        <p className="text-red-300 text-sm">
                          Error al cargar direcciones: {addressesError.message}
                        </p>
                        <button
                          onClick={() => refetchAddresses()}
                          className="mt-2 text-sm text-red-400 underline hover:no-underline"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}

                    {/* Existing addresses */}
                    {!addressesLoading && addressesData?.addressesByUser?.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-white mb-4">
                          Direcciones Guardadas
                        </h4>
                        <div className="space-y-3">
                          {addressesData.addressesByUser.map((savedAddress: Address) => (
                            <div
                              key={savedAddress.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedAddressId === savedAddress.id
                                  ? 'border-blue-500 bg-blue-900/30'
                                  : 'border-gray-600 bg-gray-750 hover:border-gray-500'
                              }`}
                              onClick={() => handleAddressSelection(savedAddress.id!)}
                            >
                              <div className="flex items-start space-x-3">
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  value={savedAddress.id}
                                  checked={selectedAddressId === savedAddress.id}
                                  onChange={() => handleAddressSelection(savedAddress.id!)}
                                  className="mt-1 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-medium text-white">{savedAddress.name}</h5>
                                    {savedAddress.isDefault && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                                        Predeterminada
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-300 mt-1">
                                    {savedAddress.street}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {savedAddress.city}, {savedAddress.department}
                                    {savedAddress.postalCode && ` - ${savedAddress.postalCode}`}
                                  </p>
                                  <p className="text-sm text-gray-400">Tel: {savedAddress.phone}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={handleNewAddressClick}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                          >
                            + Agregar nueva dirección
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New address form or when no addresses exist */}
                    {(!addressesData?.addressesByUser?.length || showNewAddressForm) &&
                      !addressesLoading && (
                        <div>
                          {addressesData?.addressesByUser?.length > 0 && (
                            <h4 className="text-lg font-medium text-white mb-4">Nueva Dirección</h4>
                          )}

                          <form onSubmit={handleAddressSubmit} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Dirección *
                              </label>
                              <input
                                type="text"
                                required
                                value={address.street}
                                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Descripción *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={address.name}
                                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Teléfono *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={address.phone}
                                  onChange={(e) =>
                                    setAddress({ ...address, phone: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Ciudad *
                                </label>
                                <select
                                  required
                                  value={address.city}
                                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Selecciona </option>
                                  {cities.map((city) => (
                                    <option key={city} value={city}>
                                      {city}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Departamento *
                                </label>
                                <select
                                  required
                                  value={address.department}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      department: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Selecciona </option>
                                  {departments.map((department) => (
                                    <option key={department} value={department}>
                                      {department}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Código Postal
                                </label>
                                <input
                                  type="text"
                                  value={address.postalCode}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      postalCode: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="isDefault"
                                checked={address.isDefault}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    isDefault: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-300">
                                Establecer como dirección predeterminada
                              </label>
                            </div>

                            <div className="flex justify-between">
                              {addressesData?.addressesByUser?.length > 0 && showNewAddressForm && (
                                <button
                                  type="button"
                                  onClick={() => setShowNewAddressForm(false)}
                                  className="px-4 py-2 text-gray-300 border border-gray-600 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button
                                type="submit"
                                disabled={isSubmittingAddress}
                                className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                              >
                                {isSubmittingAddress ? 'Guardando...' : 'Continuar'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                    {/* Continue button for selected address */}
                    {selectedAddressId && !showNewAddressForm && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleAddressSubmit}
                          disabled={isSubmittingAddress}
                          className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continuar con dirección seleccionada
                        </button>
                      </div>
                    )}
                  </div>
                </AccordionStep>

                {/* Step 3: Payment Information */}
                <AccordionStep
                  step={3}
                  title="Información de Pago"
                  isOpen={activeStep === 3}
                  isCompleted={isPaymentCompleted}
                  isDisabled={!isAddressCompleted}
                  onToggle={() => handleStepToggle(3)}
                >
                  {(() => {
                    const wompiData = prepareWompiData();

                    return (
                      <div className="space-y-6">
                        {/* Payment summary */}
                        <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-300 mb-2">Resumen de Pago</h4>
                          <div className="space-y-1 text-sm text-blue-200">
                            <div className="flex justify-between">
                              <span>Total a pagar:</span>
                              <span className="font-medium text-white">
                                ${cart.total.toLocaleString('es-CO')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Referencia:</span>
                              <span className="font-mono text-xs text-gray-300">
                                {wompiData.reference}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Security notice */}
                        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-2">
                            <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-300">
                                Nota de Seguridad Importante
                              </p>
                              <div className="text-yellow-200 mt-1 space-y-1">
                                <p>
                                  ⚠️ <strong>Desarrollo:</strong> La firma de integridad se está
                                  calculando en el frontend con fines de prueba.
                                </p>
                                <p>
                                  🔐 <strong>Producción:</strong> Mueve el cálculo de la firma al
                                  backend para proteger tu secreto de integridad.
                                </p>
                                <p className="text-xs mt-2">
                                  Variables de entorno requeridas:{' '}
                                  <code className="bg-gray-800 px-1 rounded">
                                    NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET
                                  </code>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Wompi Checkout Integration */}
                        <div id="wompi-checkout-container">
                          <form id="wompi-payment-form" onSubmit={handlePaymentSubmit}>
                            <div className="flex flex-col space-y-3">
                              {/* Security notice */}
                              <div className="flex items-start space-x-2 text-xs text-gray-400 bg-gray-800/50 border border-gray-700 p-3 rounded">
                                <Shield className="w-4 h-4 mt-0.5 text-green-400" />
                                <span>
                                  Tu pago será procesado de forma segura por Wompi. Serás redirigido
                                  a la plataforma de pago.
                                </span>
                              </div>

                              <button
                                type="submit"
                                disabled={isSubmittingOrder}
                                className="w-full px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ShieldCheck className="w-5 h-5" />
                                <span>
                                  {isSubmittingOrder
                                    ? 'Creando orden y redirigiendo...'
                                    : `Crear Orden y Pagar ${cart.total.toLocaleString('es-CO')}`}
                                </span>
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* Debug info in development */}
                        {process.env.NODE_ENV === 'development' && (
                          <details className="mt-4">
                            <summary className="text-xs text-gray-400 cursor-pointer">
                              Ver datos de depuración
                            </summary>
                            <div className="text-xs bg-gray-800 border border-gray-700 p-3 rounded mt-2 space-y-2">
                              <div>
                                <p className="font-medium text-gray-300 mb-1">
                                  Cálculo de Firma de Integridad:
                                </p>
                                <p className="text-gray-400">
                                  Concatenación:{' '}
                                  <code className="bg-gray-900 px-1 rounded text-gray-200">
                                    {wompiData.reference}
                                    {wompiData.amountInCents}
                                    {wompiData.currency}
                                    {wompiData.expirationTime}
                                  </code>
                                </p>
                                <p className="text-gray-400">
                                  Firma SHA256:{' '}
                                  <code className="bg-gray-900 px-1 rounded text-xs text-gray-200">
                                    {wompiData.integritySignature}
                                  </code>
                                </p>
                              </div>
                              <hr className="border-gray-600" />
                              <pre className="overflow-auto text-gray-300">
                                {JSON.stringify(wompiData, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}
                </AccordionStep>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary cart={cart} store={store} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
