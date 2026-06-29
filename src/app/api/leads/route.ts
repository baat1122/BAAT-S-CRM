import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Enable CORS OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    
    // De-structure inputs
    const {
      customer_name,
      email,
      phone,
      pickup_location,
      dropoff_location,
      estimated_price,
      notes,
      est_pickup_date,
      // Single vehicle fallback
      vehicle_year,
      vehicle_make,
      vehicle_model,
      operable,
      trailer_type,
      // Multiple vehicles array support
      vehicles
    } = body;

    // Validate required fields
    if (!customer_name || !pickup_location || !dropoff_location) {
      return NextResponse.json(
        { error: 'Customer name, pickup location, and dropoff location are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database connection configuration is missing on the CRM server.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Build the vehicle name summary string for the lead list view
    let vehicleNameStr = '';
    const vehicleList: any[] = [];

    if (Array.isArray(vehicles) && vehicles.length > 0) {
      vehicleNameStr = vehicles.map(v => `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim()).join(', ');
      vehicles.forEach(v => {
        vehicleList.push({
          year: v.year?.toString() || '',
          make: v.make || '',
          model: v.model || '',
          operable: v.operable !== false, // default true
          trailer_type: v.trailer_type || 'Open'
        });
      });
    } else if (vehicle_make) {
      vehicleNameStr = `${vehicle_year || ''} ${vehicle_make} ${vehicle_model || ''}`.trim();
      vehicleList.push({
        year: vehicle_year?.toString() || '',
        make: vehicle_make,
        model: vehicle_model || '',
        operable: operable !== false,
        trailer_type: trailer_type || 'Open'
      });
    } else {
      vehicleNameStr = 'Not Specified';
    }

    // 1. Insert the Lead record
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        customer_name,
        phone: phone || null,
        email: email || null,
        pickup_location,
        dropoff_location,
        vehicle_name: vehicleNameStr,
        estimated_price: estimated_price ? parseFloat(estimated_price) : 0,
        est_pickup_date: est_pickup_date || null,
        notes: notes || null,
        source: 'Website',
        status: 'New'
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('Database lead insertion failed:', leadError);
      return NextResponse.json(
        { error: `Database insertion error: ${leadError?.message || ''}` },
        { status: 500, headers: corsHeaders }
      );
    }

    // 2. Insert the Vehicle details referencing the new lead id
    if (vehicleList.length > 0) {
      const vehiclesToInsert = vehicleList.map(v => ({
        lead_id: lead.id,
        year: v.year,
        make: v.make,
        model: v.model,
        operable: v.operable,
        trailer_type: v.trailer_type
      }));

      const { error: vehicleError } = await supabase
        .from('quote_vehicles')
        .insert(vehiclesToInsert);

      if (vehicleError) {
        console.error('Database quote vehicles insertion failed:', vehicleError);
        // We don't fail the whole request since the lead was created successfully, but we log the issue
      }
    }

    return NextResponse.json(
      { success: true, lead_id: lead.id },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Lead webhook API failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error occurred.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
