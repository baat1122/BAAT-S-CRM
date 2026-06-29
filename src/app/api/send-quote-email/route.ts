import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json();
    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    // Initialize Supabase Client using server env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase URL or Anon Key is missing from configuration.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch lead details
    const { data: quote, error: quoteError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: `Lead not found: ${quoteError?.message || ''}` }, { status: 404 });
    }

    const customerEmail = quote.email;
    const customerName = quote.customer_name || 'Customer';

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer does not have a valid email address configured.' }, { status: 400 });
    }

    // Generate link to view PDF Quote using origin header
    const origin = request.headers.get('origin') || 'http://localhost:3001';
    const pdfLink = `${origin}/leads/${quote.id}/pdf`;

    // Mail configurations
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || 'jason.rivera@bestamericanautotransport.com';
    const smtpPass = process.env.SMTP_PASS || '';

    if (!smtpPass) {
      return NextResponse.json({ error: 'Hostinger SMTP Password is not configured. Please set SMTP_PASS in your environment configuration.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const displayId = quote.custom_order_id || quote.id.split('-')[0].toUpperCase();

    const mailOptions = {
      from: `"Jason Rivera" <${smtpUser}>`,
      to: customerEmail,
      subject: `Best American Auto Transport - Your Shipping Quote #${displayId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px;">
            <h1 style="color: #0a1128; font-size: 24px; font-weight: 800; margin: 0;">BEST AMERICAN AUTO TRANSPORT</h1>
            <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0;">Nationwide Car Shipping</p>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Dear ${customerName},</p>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">
            Thank you for requesting an auto transport quote with Best American Auto Transport! We are pleased to provide you with our estimated pricing for your shipping route:
          </p>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold; width: 35%;">Quote ID:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: bold;">#${displayId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Vehicle(s):</td>
                <td style="padding: 6px 0; color: #111827;">${quote.vehicle_name || 'Vehicle'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Origin:</td>
                <td style="padding: 6px 0; color: #111827;">${quote.pickup_location}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Destination:</td>
                <td style="padding: 6px 0; color: #111827;">${quote.dropoff_location}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 12px 0 6px 0; color: #2563eb; font-weight: bold; font-size: 16px;">Estimated Price:</td>
                <td style="padding: 12px 0 6px 0; color: #2563eb; font-weight: bold; font-size: 18px;">$${quote.estimated_price}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">
            You can view or print the full PDF copy of your quote sheet by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${pdfLink}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px;">
              View Quote PDF Sheet
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="font-size: 15px; color: #111827; font-weight: bold; line-height: 1.5;">
            Ready to book your transport?
          </p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            To lock in this price-lock guarantee and schedule your transport dates, please **reply directly to this email** or call us at <strong>(302) 355-5544</strong>. 
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

    // Save history log details inside the lead's notes field as a record
    const timestamp = new Date().toLocaleString();
    const newNoteText = `${quote.notes ? quote.notes + '\n' : ''}[Email Log - ${timestamp}] Quote sent successfully to ${customerEmail} by ${smtpUser}`;

    await supabase
      .from('leads')
      .update({ notes: newNoteText })
      .eq('id', quoteId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send email' }, { status: 500 });
  }
}
