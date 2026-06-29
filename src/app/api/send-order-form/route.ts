import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Initialize Supabase Client using server env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase URL or Anon Key is missing from configuration.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: `Order not found: ${orderError?.message || ''}` }, { status: 404 });
    }

    const customerEmail = order.customers?.email;
    const customerName = order.customers?.customer_name || 'Customer';

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer does not have a valid email address configured.' }, { status: 400 });
    }

    // Generate secure link using origin header
    const origin = request.headers.get('origin') || 'http://localhost:3001';
    const formLink = `${origin}/order-form/${order.id}`;

    // Mail configurations
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || 'jason.rivera@bestamericanautotransport.com';
    const smtpPass = process.env.SMTP_PASS || '';

    if (!smtpPass) {
      return NextResponse.json({ error: 'Hostinger SMTP Password is not configured. Please set SMTP_PASS in your .env.local configuration.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // True for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"Jason Rivera" <${smtpUser}>`,
      to: customerEmail,
      subject: `Action Required: Signature Needed for Order #${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0a1128; font-size: 24px; font-weight: 800; margin: 0;">BEST AMERICAN AUTO TRANSPORT</h1>
            <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0;">Nationwide Car Shipping</p>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Dear ${customerName},</p>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">
            Thank you for choosing Best American Auto Transport! We have prepared the shipment agreement for your order <strong>#${order.order_id}</strong> (${order.vehicle_name || 'Vehicle'} from ${order.pickup_location} to ${order.dropoff_location}).
          </p>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">
            Please click the button below to review your order details, accept the transport terms, and sign the digital order form to book your shipment:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formLink}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              Sign Shipment Agreement
            </a>
          </div>
          
          <p style="font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center;">
            Or copy and paste this link in your browser:<br>
            <a href="${formLink}" style="color: #2563eb;">${formLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            If you have any questions or need assistance, feel free to call us at <strong>(302) 355-5544</strong> or reply directly to this email.
          </p>
          
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-top: 20px;">
            Best regards,<br>
            <strong>Jason Rivera</strong><br>
            Best American Auto Transport<br>
            <a href="https://www.bestamericanautotransport.com" style="color: #2563eb;">www.bestamericanautotransport.com</a>
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Save history log details
    const newLog = {
      status: 'Sent Successfully',
      date: new Date().toISOString(),
      sent_to: customerEmail,
      sender: smtpUser
    };

    // Try updating email_logs column first
    const existingLogs = Array.isArray(order.email_logs) ? order.email_logs : [];
    const updatedLogs = [...existingLogs, newLog];

    const { error: logUpdateError } = await supabase
      .from('orders')
      .update({ email_logs: updatedLogs })
      .eq('id', orderId);

    // Self-healing fallback: If column does not exist, append to 'notes' field
    if (logUpdateError) {
      console.warn('email_logs column update failed, falling back to notes:', logUpdateError.message);
      const timestamp = new Date().toLocaleString();
      const newNoteText = `${order.notes ? order.notes + '\n' : ''}[Email Log - ${timestamp}] Order form sent successfully to ${customerEmail} by ${smtpUser}`;

      await supabase
        .from('orders')
        .update({ notes: newNoteText })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true, log: newLog });
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send email' }, { status: 500 });
  }
}
