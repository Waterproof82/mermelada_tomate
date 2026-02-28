import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/brevo-email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const empresaId = searchParams.get('empresa');

    if (!email || !empresaId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://mermeladadetomate.com'}/?error=invalid_params`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .single();

    if (!cliente) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://mermeladadetomate.com'}/?error=cliente_no_encontrado`);
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('email_notification, nombre, dominio')
      .eq('id', empresaId)
      .single();

    await supabase
      .from('clientes')
      .update({ aceptar_promociones: false })
      .eq('id', cliente.id);

    if (BREVO_API_KEY && empresa?.email_notification) {
      const notifyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <p>Un cliente ha solicitado darse de baja de las promociones.</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Nombre:</strong> ${cliente.nombre || 'No especificado'}</p>
  <p><strong>Teléfono:</strong> ${cliente.telefono || 'No especificado'}</p>
</body>
</html>
      `.trim();

      try {
        await sendEmail({
          to: [empresa.email_notification],
          subject: 'Solicitud de baja de promociones',
          htmlContent: notifyHtml,
          senderName: 'Sistema de Promociones',
          senderEmail: 'a369cb001@smtp-brevo.com',
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mermeladadetomate.com';
    return NextResponse.redirect(`${baseUrl}/?baja=ok`);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://mermeladadetomate.com'}/?error=internal`);
  }
}
