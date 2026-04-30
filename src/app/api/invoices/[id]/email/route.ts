import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateInvoiceTemplate } from '@/lib/mail';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { contact: true, items: true }
    });

    if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.contact?.email) {
        return NextResponse.json({ error: 'Client email not found. Please update contact details first.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 });

    const emailHtml = generateInvoiceTemplate(invoice, tenant);
    const mailResult = await sendEmail({
      to: invoice.contact.email,
      subject: `Invoice Baru dari ${tenant.name}: ${invoice.invoiceNo} (Resend)`,
      html: emailHtml
    });

    if (mailResult.success) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { emailStatus: 'SENT' }
      });
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { emailStatus: 'FAILED' }
      });
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Resend Email Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
