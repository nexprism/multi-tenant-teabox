
export const generateInvoiceHtml = (order, baseUrl = "", tenantConfig = null) => {
  if (!order) return "";

  const formatNumber = (v) => (v == null ? "" : Number(v).toFixed(2));

  // Compute GST / CGST / SGST rate values before building item rows
  const gstRateRaw = Number(order.gstRate ?? order.gst_rate ?? order.gst ?? 0);
  const cgstRateRaw = gstRateRaw ? gstRateRaw / 2 : (order.cgstRate || 0);
  const sgstRateRaw = gstRateRaw ? gstRateRaw / 2 : (order.sgstRate || 0);
  const cgstRate = formatNumber(cgstRateRaw);
  const sgstRate = formatNumber(sgstRateRaw);

  const items = (order.items || []).map((it, i) => {
    // Robust name resolution: prioritize name on item, then name on product object, then fallback
    let name = it.name || it.product?.name;
    if (!name && typeof it.product === 'string') {
      name = it.product;
    }
    if (!name || typeof name !== 'string') {
      name = "Product";
    }
    const qty = Number(it.qty || it.quantity || it.count || 0);
    const rate = Number(it.rate || it.price || 0);
    const amount = Number(it.total ?? (qty && rate ? qty * rate : 0));
    const lineAmountRaw = amount;
    const lineTaxRaw = gstRateRaw ? (lineAmountRaw * gstRateRaw) / 100 : Number(it.taxAmount || 0);
    const cgstLine = lineTaxRaw / 2;
    const sgstLine = lineTaxRaw / 2;
    const lineTotal = lineAmountRaw + cgstLine + sgstLine;
    return `
      <tr class="item-row">
        <td class="center">${i + 1}</td>
        <td>${name}</td>
        <td class="center">${it.hsn || ''}</td>
        <td class="center">${qty}</td>
        <td class="right">${formatNumber(rate)}</td>
        <td class="right">${formatNumber(lineAmountRaw)}</td>
        <td class="center">${it.discountPercent || ''}</td>
        <td class="right">${formatNumber(it.discountAmount || 0)}</td>
        <td class="right">${formatNumber(lineAmountRaw)}</td>
        <td class="center">${cgstRate}</td>
        <td class="right">${formatNumber(cgstLine)}</td>
        <td class="center">${sgstRate}</td>
        <td class="right">${formatNumber(sgstLine)}</td>
        <td class="right">${formatNumber(lineTotal)}</td>
        <td class="right"></td>
      </tr>`;
  }).join('\n');

  const gstAmountRaw = Number(order.gstAmount ?? order.gst_amount ?? 0);
  const totalAfterTaxRaw = Number(order.total ?? 0);
  const totalBeforeTaxRaw = (gstAmountRaw && totalAfterTaxRaw) ? (totalAfterTaxRaw - gstAmountRaw) : (Number(order.subTotal ?? order.subtotal ?? 0));
  const totalBeforeTax = formatNumber(totalBeforeTaxRaw);

  const cgstAmountRaw = gstAmountRaw ? gstAmountRaw / 2 : Number(order.cgst || 0);
  const sgstAmountRaw = gstAmountRaw ? gstAmountRaw / 2 : Number(order.sgst || 0);
  const cgst = formatNumber(cgstAmountRaw);
  const sgst = formatNumber(sgstAmountRaw);
  const totalTax = formatNumber((cgstAmountRaw + sgstAmountRaw) || 0);
  const totalAfterTax = formatNumber(totalAfterTaxRaw || (Number(totalBeforeTaxRaw || 0) + (cgstAmountRaw + sgstAmountRaw || 0)));

  // Build billing and shipping address HTML from order data
  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};
  const joinParts = (parts) => parts.filter(Boolean).join(', ');
  const billingAddressLine = joinParts([billing.addressLine1, billing.addressLine2, billing.city, billing.state, billing.postalCode, billing.country]);
  const shippingAddressLine = joinParts([shipping.addressLine1, shipping.addressLine2, shipping.city, shipping.state, shipping.postalCode, shipping.country]);

  const billingHtml = `\n                    <div><strong>Name:</strong> ${billing.fullName || ''}</div>\n                    <div><strong>Address:</strong> ${billingAddressLine}</div>\n                    <div><strong>Phone:</strong> ${billing.phoneNumber || ''}</div>`;

  const shippingHtml = `\n                    <div><strong>Name:</strong> ${shipping.fullName || ''}</div>\n                    <div><strong>Address:</strong> ${shippingAddressLine}</div>\n                    <div><strong>Phone:</strong> ${shipping.phoneNumber || ''}</div>`;

  const invoiceId = order._id ? order._id.toString() : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tax Invoice</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
  .invoice-container { max-width: 210mm; margin: 0 auto; background: white; padding: 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #000; padding: 4px 6px; font-size: 9px; vertical-align: top; }
  .logo-cell { width: 100px; text-align: center; vertical-align: middle; }
  .logo-cell img { width: 70px; height: 70px; }
  .company-info { text-align: center; font-size: 10px; line-height: 1.4; }
  .company-name { font-weight: bold; font-size: 14px; margin-bottom: 3px; }
  .document-type { text-align: right; font-weight: bold; font-size: 10px; width: 100px; line-height: 1.8; }
  .title-row { background: #e6e6ff; text-align: center; font-size: 16px; font-weight: bold; padding: 6px !important; }
  .subtitle { font-size: 8px; font-weight: normal; }
  .info-row td { font-size: 9px; padding: 3px 6px; }
  .section-header { background: #e6e6ff; font-weight: bold; font-size: 9px; text-align: center; padding: 4px !important; }
  .address-cell { font-size: 8px; line-height: 1.5; }
  .table-header { background: #e6e6ff; font-weight: bold; text-align: center; font-size: 8px; padding: 3px 2px !important; }
  .item-row td { font-size: 8px; padding: 2px 4px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .total-row { background: #e6e6ff; font-weight: bold; }
  .bank-details { font-size: 8px; line-height: 1.5; }
  .signature-section { text-align: right; font-size: 9px; padding: 20px 8px 8px 8px !important; }
  .footer-row { background: #e6e6ff; font-size: 8px; text-align: center; padding: 4px !important; }
  @media print { body { padding: 10px; background: white; } .invoice-container { max-width: 100%; margin: 0; padding: 0; } table { page-break-inside: avoid; } td, th { padding: 3px 4px; font-size: 8px; } @page { margin: 10mm; size: A4; } }
</style>
</head>
<body>
<div class="invoice-container">
  <table class="header-table">
    <tr>
      <td class="logo-cell">
        <img src="${baseUrl ? baseUrl.replace(/\/$/, '') : ''}/logo.webp" width="70" height="70" alt="Company Logo">
      </td>
      <td class="company-info">
        <div class="company-name">${tenantConfig?.companyName || "Our Store"}</div>
        <div>${tenantConfig?.addressLine1 || ""}</div>
        <div><strong>${tenantConfig?.city || ""} ${tenantConfig?.state || ""} ${tenantConfig?.postalCode || ""}</strong></div>
        <div>Email: ${tenantConfig?.email || ""}</div>
        <div><strong>${tenantConfig?.gstin ? "GSTIN: " + tenantConfig.gstin : ""}</strong></div>
      </td>
      <td class="document-type">
        <div>Original</div>
      </td>
    </tr>
  </table>

  <table>
    <tr>
      <td colspan="4" class="title-row">
        <div>Tax Invoice</div>
      </td>
    </tr>
    <tr class="info-row">
      <td colspan="2"><strong>Invoice No:</strong> ${invoiceId}</td>
      <td colspan="2"><strong>Dated:</strong> ${new Date(order.createdAt).toLocaleDateString()}</td>
    </tr>
  </table>

  <table style="margin-top: 2px;">
    <tr>
      <td colspan="2" class="section-header">Detail of Receiver (Billed to):</td>
      <td colspan="2" class="section-header">Detail of Consignee (Shipped to):</td>
    </tr>
    <tr>
      <td class="address-cell" colspan="2">${billingHtml}</td>
      <td class="address-cell" colspan="2">${shippingHtml}</td>
    </tr>
  </table>

  <table style="margin-top: 2px;">
    <tr class="table-header">
      <td rowspan="2" style="width: 25px;">Sr. No.</td>
      <td rowspan="2" style="width: 120px;">Product Description</td>
      <td rowspan="2" style="width: 50px;">HSN code</td>
      <td rowspan="2" style="width: 30px;">Qty</td>
      <td rowspan="2" style="width: 40px;">Rate</td>
      <td rowspan="2" style="width: 50px;">Amount</td>
      <td colspan="2">Discount</td>
      <td rowspan="2" style="width: 50px;">Total Value</td>
      <td colspan="2">CGST</td>
      <td colspan="2">SGST</td>
      <td rowspan="2" style="width: 50px;">Total Amount</td>
      <td rowspan="2" style="width: 45px;">Total</td>
    </tr>
    <tr class="table-header">
      <td style="width: 25px;">%</td>
      <td style="width: 35px;">Amt</td>
      <td style="width: 25px;">%</td>
      <td style="width: 40px;">Amount</td>
      <td style="width: 25px;">%</td>
      <td style="width: 40px;">Amount</td>
    </tr>
    ${items}
    <tr class="total-row">
      <td colspan="3" class="bold">Total</td>
      <td class="center bold">${order.items ? order.items.length : 0}</td>
      <td></td>
      <td class="right bold">${totalBeforeTax}</td>
      <td class="center"></td>
      <td class="right bold"></td>
      <td class="right bold"></td>
      <td></td>
            <td class="right bold">${cgst}</td>
      <td></td>
            <td class="right bold">${sgst}</td>
      <td></td>
      <td></td>
      <td class="center bold">0</td>
      <td class="right bold">${totalAfterTax}</td>
      <td></td>
    </tr>
  </table>

  <table style="margin-top: 2px;">
    <tr>
      <td rowspan="5" style="width: 60%; vertical-align: top; padding: 6px;">
        <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Total Invoice Amount (in words)</div>
        <div style="font-size: 8px;">${order.totalInWords || ""}</div>
      </td>
      <td colspan="2" class="right" style="font-size: 8px; padding: 2px 6px;\"><strong>Total Amount before Tax</strong></td>
      <td class="right" style="font-size: 8px; padding: 2px 6px; width: 70px;">${totalBeforeTax}</td>
    </tr>
    <tr>
      <td colspan="2" class="right" style="font-size: 8px; padding: 2px 6px;"><strong>Add: CGST (${cgstRate}% )</strong></td>
      <td class="right" style="font-size: 8px; padding: 2px 6px;">${cgst}</td>
    </tr>
    <tr>
      <td colspan="2" class="right" style="font-size: 8px; padding: 2px 6px;"><strong>Add: SGST (${sgstRate}% )</strong></td>
      <td class="right" style="font-size: 8px; padding: 2px 6px;">${sgst}</td>
    </tr>
    <tr>
      <td colspan="2" class="right" style="font-size: 8px; padding: 2px 6px;"><strong>Total Tax Amount</strong></td>
      <td class="right" style="font-size: 8px; padding: 2px 6px;">${totalTax}</td>
    </tr>
    <tr>
      <td colspan="2" class="right bold" style="font-size: 8px; padding: 2px 6px;"><strong>Total Amount after Tax</strong></td>
      <td class="right bold" style="font-size: 8px; padding: 2px 6px;">${totalAfterTax}</td>
    </tr>
  </table>
</div>
</body>
</html>`;
}
