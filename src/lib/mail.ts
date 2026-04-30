import nodemailer from 'nodemailer';

// --- ENTERPRISE-GRADE MAILING INFRASTRUCTURE ---

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Bizzcount ERP" <${process.env.SMTP_FROM || 'no-reply@bizzcount.id'}>`,
      to,
      subject,
      html,
    });
    console.log('[Mail] Sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('[Mail] Failed:', error);
    return { success: false, error };
  }
}

export function generateInvoiceTemplate(invoice: any, tenant: any) {
  const currencySymbol = 'Rp ';
  const formatValue = (val: number) => val.toLocaleString('id-ID');

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; color: white;">
        <table width="100%">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">BIZZCOUNT</h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.7; font-weight: 600;">Enterprise Resource Intelligence</p>
            </td>
            <td align="right">
              <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Invoice No</p>
                <p style="margin: 0; font-size: 16px; font-weight: 800; font-family: monospace;">${invoice.invoiceNo}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="padding: 40px;">
        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Halo <strong>${invoice.clientName}</strong>,</p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Terima kasih atas kepercayaan Anda kepada <strong>${tenant.name}</strong>. Tagihan baru Anda telah diterbitkan dan berikut adalah ringkasannya:</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Total Tagihan</p>
                <p style="margin: 4px 0 0; font-size: 24px; color: #0f172a; font-weight: 800;">${currencySymbol}${formatValue(invoice.grandTotal)}</p>
              </td>
              <td align="right" style="padding-bottom: 16px;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Jatuh Tempo</p>
                <p style="margin: 4px 0 0; font-size: 16px; color: #0f172a; font-weight: 700;">${new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0;">
          <table width="100%" style="margin-top: 16px;">
            <tr>
              <td><p style="margin: 0; font-size: 14px; color: #64748b;">Status Tagihan</p></td>
              <td align="right"><p style="margin: 0; font-size: 12px; font-weight: 800; color: #ffffff; background-color: #ef4444; padding: 4px 12px; border-radius: 100px; display: inline-block;">PENDING PAYMENT</p></td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Anda dapat melihat rincian lengkap dan mengunduh salinan PDF melalui tautan di bawah ini:</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXTAUTH_URL}/invoices/${invoice.id}" style="background-color: #279C5A; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(39, 156, 90, 0.3);">Lihat Invoice Digital</a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 48px;">
          Ini adalah email otomatis dari sistem Bizzcount ERP.<br>
          Pertanyaan mengenai tagihan? Hubungi tim keuangan kami di ${tenant.email || 'finance@' + tenant.name.toLowerCase().replace(/\s/g, '') + '.id'}.
        </p>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">&copy; ${new Date().getFullYear()} ${tenant.name}. Powered by Bizzcount Enterprise.</p>
      </div>
    </div>
  `;
}
