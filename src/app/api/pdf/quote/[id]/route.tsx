import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { QuoteDocument } from "@/components/pdf/QuoteDocument";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: quoteData } = await supabase.from("leads").select("*").eq("id", id).single();
  const { data: vehiclesData } = await supabase.from("quote_vehicles").select("*").eq("lead_id", id);

  if (!quoteData) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  try {
    const stream: any = await renderToStream(<QuoteDocument quote={quoteData} vehicles={vehiclesData || []} />);
    
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: any) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err: any) => controller.error(err));
      }
    });

    const filename = `Quote-${quoteData.id.split('-')[0]}.pdf`;

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
