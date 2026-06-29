import jsPDF from "jspdf";

export const TERMS = `1. By placing an order with Best American Auto Transport, the customer authorizes Best American Auto Transport and its assigned carrier to transport the vehicle from the pickup location to the delivery destination. While every effort is made to meet estimated pickup and delivery dates, delays may occur due to weather conditions, mechanical issues, traffic, carrier scheduling, or other unforeseen circumstances. Best American Auto Transport is not responsible for expenses caused by delays, including but not limited to rental vehicles, hotel stays, flights, or other related costs.

2. Once an order has been placed and confirmed, the customer agrees not to arrange transportation with another broker or carrier for the same shipment. Deposits and booking fees become non-refundable after the order is processed or dispatched.

3. Carriers provide door-to-door service whenever safely accessible. If the pickup or delivery location is restricted due to narrow roads, low trees, HOA restrictions, or safety concerns, the customer may be required to meet the carrier at a nearby open area such as a parking lot or shopping center.

4. Customers may place up to 100 lbs of personal belongings inside the trunk area only. Carriers are not licensed or insured to transport household goods. Best American Auto Transport and the carrier are not responsible for damages caused by overloaded or improperly stored items. Additional charges may apply for excess weight or undisclosed items.

5. Vehicles must be in operable condition unless otherwise disclosed during booking. The vehicle should contain no more than half a tank of fuel. Customers must ensure that alarms are disabled and loose parts, spoilers, antennas, or accessories are secured before transport.

6. All contracted carriers are required to carry cargo insurance coverage. Any damages occurring during transport are the responsibility of the carrier and must be reported immediately at the time of delivery on the Bill of Lading (BOL). Best American Auto Transport acts only as a transportation broker and is not liable for carrier-related damages.

7. The customer or an authorized representative must be present during pickup and delivery inspections. If the vehicle is unavailable at the scheduled pickup time, a rescheduling fee may apply.

8. Customers must carefully inspect the vehicle at pickup and delivery and sign the Bill of Lading/Condition Report accordingly. Failure to note damages at delivery may affect the ability to file a claim with the carrier's insurance provider.

9. All transport-related claims, including damage, theft, or loss, must be filed directly with the carrier's insurance company. Best American Auto Transport is not responsible for carrier negligence, weather damage, vandalism, theft, or acts of God.

10. Orders canceled after dispatch may be subject to a cancellation fee. To cancel an order, customers must contact Best American Auto Transport directly before dispatch confirmation.

11. Additional fees may apply for non-operational vehicles. Customers must accurately disclose the running condition of the vehicle during booking.

12. Quoted prices are based on current market conditions and carrier availability. In rare situations involving market fluctuations, fuel increases, weather conditions, or route demand, pricing may need adjustment before dispatch. Customers will always be notified and must approve any revised pricing before shipment proceeds.

13. Pickup and delivery dates are estimated and are not guaranteed. Best American Auto Transport will work diligently to secure timely transport but cannot guarantee exact dates or times due to factors beyond our control.

14. By placing an order, the customer confirms acceptance of all terms listed above. A small deposit may be charged to confirm the shipment, and the remaining balance is due upon delivery and payable directly to the carrier via cash, certified funds, Zelle, Cash App, or other approved payment methods.`;

export function generatePDF(data: any) {
  const {
    order,
    vehicles,
    fullName,
    email,
    phone,
    pickupDate,
    originAddress,
    originCity,
    originContactName,
    originContactEmail,
    originContactPhone,
    destinationAddress,
    destinationCity,
    destinationContactName,
    destinationContactEmail,
    destinationContactPhone,
    electronicSignature,
    ipAddress,
    agreedDate
  } = data;

  const pdf = new jsPDF("p", "mm", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const col = W - margin * 2;
  let y = 0;

  const checkPage = (needed = 10) => {
    if (y + needed > 275) { pdf.addPage(); y = 20; }
  };

  const line = (width = col, x = margin) => {
    pdf.setDrawColor(220, 220, 220);
    pdf.line(x, y, x + width, y);
    y += 4;
  };

  // ── HEADER ──────────────────────────────────────────────────────────────
  pdf.setFillColor(10, 17, 40);
  pdf.rect(0, 0, W, 32, "F");
  // Blue accent bar at top
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, W, 3, "F");
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  const name1 = "BEST AMERICAN";
  const name2 = " AUTO TRANSPORT";
  pdf.text(name1, margin, 18);
  pdf.setTextColor(59, 130, 246);
  const w1 = pdf.getTextWidth(name1);
  pdf.text(name2, margin + w1, 18);
  // Tagline
  pdf.setTextColor(160, 170, 190);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("Reliable Vehicle Shipping Nationwide", margin, 24);
  // Contact info on right
  pdf.setTextColor(200, 200, 210);
  pdf.setFontSize(8);
  pdf.text("(302) 355-5544", W - margin, 15, { align: "right" });
  pdf.text("info@bestamericanautotransport.com", W - margin, 21, { align: "right" });
  y = 40;

  // ── TITLE & QUOTE ───────────────────────────────────────────────────────
  pdf.setTextColor(10, 17, 40);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Shipment Agreement", margin, y);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Quote #${order?.order_id}  |  Signed: ${new Date(order?.signed_at || new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, y + 7);
  y += 18;
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, W - margin, y);
  pdf.setLineWidth(0.2);
  y += 8;

  const sectionHeader = (title: string) => {
    checkPage(14);
    pdf.setFillColor(240, 248, 255);
    pdf.rect(margin, y, col, 8, "F");
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(title.toUpperCase(), margin + 3, y + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(50, 50, 50);
    y += 12;
  };

  const row = (label: string, value: string) => {
    checkPage(8);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(80, 80, 80);
    pdf.text(label + ":", margin + 2, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20, 20, 20);
    const lines = pdf.splitTextToSize(value || "—", col - 60);
    pdf.text(lines, margin + 58, y);
    y += Math.max(6, lines.length * 5);
  };

  // ── CONTACT INFO ────────────────────────────────────────────────────────
  sectionHeader("Customer / Contact Info");
  row("Full Name", fullName);
  row("Email", email);
  row("Phone", phone);
  row("First Available Pickup Date", pickupDate);
  y += 4;

  // ── ORIGIN ──────────────────────────────────────────────────────────────
  sectionHeader("Origin (Pickup Location)");
  row("Address", originAddress);
  row("City", originCity);
  if (originContactName) row("Contact Name", originContactName);
  if (originContactEmail) row("Contact Email", originContactEmail);
  if (originContactPhone) row("Contact Phone", originContactPhone);
  y += 4;

  // ── DESTINATION ─────────────────────────────────────────────────────────
  sectionHeader("Destination (Delivery Location)");
  row("Address", destinationAddress);
  row("City", destinationCity);
  if (destinationContactName) row("Contact Name", destinationContactName);
  if (destinationContactEmail) row("Contact Email", destinationContactEmail);
  if (destinationContactPhone) row("Contact Phone", destinationContactPhone);
  y += 4;

  // ── CARGO ───────────────────────────────────────────────────────────────
  if (vehicles && vehicles.length > 0) {
    sectionHeader("Cargo / Vehicles");
    vehicles.forEach((v: any, i: number) => {
      row(`Vehicle ${i + 1}`, `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim());
      row("Transport Type", v.trailer_type || "Open");
      if (i < vehicles.length - 1) y += 2;
    });
    y += 4;
  }

  // ── PRICING ─────────────────────────────────────────────────────────────
  sectionHeader("Pricing Summary");
  const price = order?.customer_price ? `$${order.customer_price}.00` : "$0.00";
  row("Total Tariff", price);
  row("Payment Method", order?.payment_method || "Not Specified");
  row("Payment Timing", order?.payment_timing || "Not Specified");
  y += 4;

  // ── TERMS & CONDITIONS ──────────────────────────────────────────────────
  sectionHeader("Terms & Conditions");
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 80);
  const termsLines = pdf.splitTextToSize(TERMS, col - 4);
  termsLines.forEach((tLine: string) => {
    checkPage(5);
    pdf.text(tLine, margin + 2, y);
    y += 4.5;
  });
  y += 4;

  // ── SIGNATURE BLOCK ─────────────────────────────────────────────────────
  checkPage(30);
  sectionHeader("Electronic Signature & Acceptance");
  row("Signature", electronicSignature);
  row("IP Address", ipAddress);
  row("Agreed On", agreedDate);
  y += 6;

  // ── FOOTER ──────────────────────────────────────────────────────────────
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(10, 17, 40);
    pdf.rect(0, 285, W, 12, "F");
    pdf.setTextColor(180, 180, 180);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Best American Auto Transport  |  (302) 355-5544  |  info@bestamericanautotransport.com", W / 2, 291, { align: "center" });
    pdf.text(`Page ${p} of ${totalPages}`, W - margin, 291, { align: "right" });
  }

  pdf.save(`Order_${order?.order_id}_Shipment_Agreement.pdf`);
}
