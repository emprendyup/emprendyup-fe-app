# Configuración de ePayco

Este proyecto usa ePayco para procesar pagos de suscripciones. A continuación se explica cómo configurarlo:

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# ePayco Configuration
NEXT_PUBLIC_EPAYCO_PUBLIC_KEY=tu_public_key_aqui
NEXT_PUBLIC_EPAYCO_CUSTOMER_ID=tu_customer_id_aqui
NEXT_PUBLIC_EPAYCO_TEST=true
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Configuración de ePayco

### 1. Crear Cuenta en ePayco

1. Ve a [https://epayco.co](https://epayco.co)
2. Regístrate como comercio
3. Completa el proceso de verificación

### 2. Obtener Credenciales

En tu panel de ePayco:

1. Ve a "Configuración" > "API Keys"
2. Copia tu `Public Key` (llave pública)
3. Copia tu `Customer ID` (ID de cliente)

### 3. Configurar URLs en ePayco

En tu panel de ePayco, configura:

- **URL de respuesta**: `https://tu-dominio.com/payment/response`
- **URL de confirmación**: `https://tu-dominio.com/api/payments/epayco/confirmation`

## Planes Configurados

Los planes están configurados en el componente `EpaycoCheckout.tsx`:

```typescript
const EPAYCO_PLANS = {
  basic: {
    monthly: { amount: 19900, description: 'Plan Basic - Mensual' },
    annual: { amount: 166440, description: 'Plan Basic - Anual' }, // 30% descuento
  },
  pro: {
    monthly: { amount: 129000, description: 'Plan Pro - Mensual' },
    annual: { amount: 1083600, description: 'Plan Pro - Anual' }, // 30% descuento
  },
  partner: {
    monthly: { amount: 189000, description: 'Plan Emprendy Partner - Mensual' },
    annual: { amount: 1587600, description: 'Plan Emprendy Partner - Anual' }, // 30% descuento
  },
};
```

## Flujo de Pago

1. **Usuario selecciona plan**: En `/dashboard/plans`
2. **Modal de checkout**: Se abre `EpaycoCheckout` con datos del plan
3. **Validación de datos**: Se validan datos requeridos del usuario
4. **Checkout ePayco**: Se abre el checkout oficial de ePayco
5. **Procesamiento**: ePayco procesa el pago
6. **Respuesta**: Usuario es redirigido a `/payment/response`
7. **Confirmación**: ePayco envía confirmación a `/api/payments/epayco/confirmation`

## Desarrollo Local

Para desarrollo local:

1. Usar `NEXT_PUBLIC_EPAYCO_TEST=true`
2. Usar las credenciales de prueba de ePayco
3. Las transacciones serán simuladas

## Producción

Para producción:

1. Cambiar `NEXT_PUBLIC_EPAYCO_TEST=false`
2. Usar credenciales reales de ePayco
3. Configurar `NEXT_PUBLIC_BASE_URL` con tu dominio real

## Seguridad

- Las variables públicas (`NEXT_PUBLIC_*`) son visibles en el frontend
- No incluyas claves secretas en variables públicas
- La validación de pagos se hace en el backend (confirmation endpoint)

## Integración con Base de Datos

El endpoint de confirmación (`/api/payments/epayco/confirmation/route.ts`) debe:

1. Validar que la confirmación viene de ePayco
2. Guardar la transacción en la base de datos
3. Activar la suscripción del usuario
4. Enviar notificaciones de confirmación

## Códigos de Respuesta ePayco

- `1`: Transacción aprobada
- `2`: Transacción rechazada
- `3`: Transacción pendiente
- `4`: Transacción fallida

## Solución de Problemas

### Error: "Script de ePayco no carga"

- Verificar conexión a internet
- Verificar que no hay bloqueadores de scripts

### Error: "Plan no encontrado"

- Verificar que el planId existe en EPAYCO_PLANS
- Verificar que el billingCycle es 'monthly' o 'annual'

### Error: "Datos de cliente faltantes"

- Asegurar que todos los campos requeridos estén completos
- Verificar formato de teléfono y documento

## Logs

Los pagos se logean en:

- Console del navegador (desarrollo)
- Confirmaciones en server logs (`/api/payments/epayco/confirmation`)
