import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Confirmación de ePayco recibida:', body);

    // Extraer datos importantes de la confirmación
    const {
      x_cust_id_cliente,
      x_ref_payco,
      x_id_invoice,
      x_description,
      x_amount,
      x_amount_base,
      x_tax,
      x_currency_code,
      x_transaction_id,
      x_approval_code,
      x_cod_response,
      x_response_reason_text,
      x_franchise,
    } = body;

    // Verificar que la confirmación viene de ePayco
    const expectedCustomerId = process.env.NEXT_PUBLIC_EPAYCO_CUSTOMER_ID;
    if (expectedCustomerId && x_cust_id_cliente !== expectedCustomerId) {
      console.error('ID de cliente no válido:', x_cust_id_cliente, 'esperado:', expectedCustomerId);
      return NextResponse.json({ error: 'ID de cliente no válido' }, { status: 400 });
    }

    // Procesar según el código de respuesta
    let status = 'unknown';
    switch (x_cod_response) {
      case 1:
        status = 'approved';
        break;
      case 2:
        status = 'rejected';
        break;
      case 3:
        status = 'pending';
        break;
      case 4:
        status = 'failed';
        break;
      default:
        status = 'unknown';
    }

    // Aquí deberías:
    // 1. Guardar la transacción en tu base de datos
    // 2. Activar la suscripción si el pago fue exitoso
    // 3. Enviar notificaciones al usuario
    // 4. Actualizar el estado del usuario

    console.log(`Transacción ${x_transaction_id} - Estado: ${status}`);

    if (status === 'approved') {
      // TODO: Implementar lógica para activar suscripción
      console.log(`Activando suscripción para factura: ${x_id_invoice}`);

      // Ejemplo de lo que podrías hacer:
      // await activateSubscription({
      //   invoiceId: x_id_invoice,
      //   transactionId: x_transaction_id,
      //   amount: x_amount,
      //   planId: extractPlanIdFromInvoice(x_id_invoice),
      // });
    }

    // Respuesta exitosa a ePayco
    return NextResponse.json({
      message: 'Confirmación procesada exitosamente',
      status: status,
    });
  } catch (error) {
    console.error('Error procesando confirmación de ePayco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// También manejar GET si ePayco envía confirmaciones por GET
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const confirmationData = {
      x_cust_id_cliente: searchParams.get('x_cust_id_cliente'),
      x_ref_payco: searchParams.get('x_ref_payco'),
      x_id_invoice: searchParams.get('x_id_invoice'),
      x_description: searchParams.get('x_description'),
      x_amount: searchParams.get('x_amount'),
      x_amount_base: searchParams.get('x_amount_base'),
      x_tax: searchParams.get('x_tax'),
      x_currency_code: searchParams.get('x_currency_code'),
      x_transaction_id: searchParams.get('x_transaction_id'),
      x_approval_code: searchParams.get('x_approval_code'),
      x_cod_response: parseInt(searchParams.get('x_cod_response') || '0'),
      x_response_reason_text: searchParams.get('x_response_reason_text'),
      x_franchise: searchParams.get('x_franchise'),
    };

    console.log('Confirmación GET de ePayco recibida:', confirmationData);

    // Procesar la confirmación usando la misma lógica que POST
    // ... (similar al código de arriba)

    return NextResponse.json({
      message: 'Confirmación GET procesada exitosamente',
    });
  } catch (error) {
    console.error('Error procesando confirmación GET de ePayco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
