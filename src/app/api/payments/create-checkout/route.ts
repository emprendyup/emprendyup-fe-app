import { NextRequest, NextResponse } from 'next/server';

interface CheckoutRequest {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerDocument?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();

    const {
      planId,
      planName,
      billingCycle,
      price,
      customerEmail,
      customerName = 'Cliente',
      customerPhone = '3000000000',
      customerDocument = '12345678',
    } = body;

    // Generar referencia única
    const reference = `plan_${planId}_${Date.now()}`;

    // Calcular impuestos (IVA 19%)
    const taxBase = Math.round(price / 1.19);
    const tax = price - taxBase;

    // Crear formulario HTML para Standard Checkout
    const checkoutForm = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Procesando pago...</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .loader {
            text-align: center;
            color: white;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h3>Redirigiendo al pago...</h3>
          <p>Por favor espera mientras te redirigimos a ePayco</p>
        </div>
        
        <form id="epayco-form" action="https://checkout.epayco.co/checkout.php" method="POST" style="display: none;">
          <input type="hidden" name="p_cust_id_cliente" value="${process.env.NEXT_PUBLIC_EPAYCO_KEY}">
          <input type="hidden" name="p_key" value="${process.env.NEXT_PUBLIC_EPAYCO_KEY}">
          
          <!-- Información del producto -->
          <input type="hidden" name="p_id_invoice" value="${reference}">
          <input type="hidden" name="p_description" value="Suscripción ${planName} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}">
          <input type="hidden" name="p_amount" value="${price}">
          <input type="hidden" name="p_amount_base" value="${taxBase}">
          <input type="hidden" name="p_tax" value="${tax}">
          <input type="hidden" name="p_currency_code" value="COP">
          
          <!-- Información del cliente -->
          <input type="hidden" name="p_cust_name" value="${customerName}">
          <input type="hidden" name="p_cust_email" value="${customerEmail}">
          <input type="hidden" name="p_cust_phone" value="${customerPhone}">
          <input type="hidden" name="p_cust_document" value="${customerDocument}">
          <input type="hidden" name="p_cust_document_type" value="CC">
          
          <!-- URLs de respuesta -->
          <input type="hidden" name="p_url_response" value="${process.env.NEXT_PUBLIC_EPAYCO_RESPONSE_URL}">
          <input type="hidden" name="p_url_confirmation" value="${process.env.NEXT_PUBLIC_EPAYCO_CONFIRMATION_URL}">
          
          <!-- Configuración -->
          <input type="hidden" name="p_test_request" value="TRUE">
          <input type="hidden" name="p_split_type" value="02">
          <input type="hidden" name="p_split_primary_receiver" value="${process.env.NEXT_PUBLIC_EPAYCO_KEY}">
          <input type="hidden" name="p_split_primary_receiver_fee" value="0">
        </form>

        <script>
          // Auto-enviar el formulario después de 2 segundos
          setTimeout(function() {
            document.getElementById('epayco-form').submit();
          }, 2000);
        </script>
      </body>
      </html>
    `;

    return new NextResponse(checkoutForm, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Error al crear el checkout' }, { status: 500 });
  }
}
