import { fmtMoney, fmtNum, fmtWhole, formatDate } from './money';
import { Invoice, PaymentMethod, Settings, invoiceStatus, invoiceTotal } from '../types';

function esc(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(value: string | null | undefined): string {
  return esc(value).replace(/\n/g, '<br/>');
}

export function buildInvoiceHtml(
  invoice: Invoice,
  settings: Settings,
  paymentMethods: PaymentMethod[],
): string {
  const total = invoiceTotal(invoice);
  const dueAmount = Math.max(0, total - invoice.amountPaid);
  const status = invoiceStatus(invoice);
  const symbol = settings.currencySymbol || 'US$';
  const currency = settings.currencyCode || 'USD';

  const selectedMethods = paymentMethods.filter((m) => invoice.paymentMethodIds.includes(m.id));

  const conversionLines: string[] = [];
  if (invoice.showZar && invoice.zarTotal != null) {
    conversionLines.push(`Total in South African Rand: R${fmtWhole(invoice.zarTotal)}`);
  }
  if (invoice.showBwp && invoice.bwpTotal != null) {
    conversionLines.push(`Total in Botswana Pula: P${fmtWhole(invoice.bwpTotal)}`);
  }

  const itemsRows = invoice.items
    .map(
      (item, i) => `
        <tr>
          <td class="ci-col-num">${i + 1}</td>
          <td class="ci-col-desc">
            ${nl2br(item.desc)}
            ${item.description ? `<div class="ci-item-description">${nl2br(item.description)}</div>` : ''}
          </td>
          <td class="ci-num ci-col-qty">${esc(fmtNum(item.qty))}</td>
          <td class="ci-num ci-col-price">${esc(symbol)}${fmtMoney(item.price)}</td>
          <td class="ci-num ci-col-amount">${esc(symbol)}${fmtMoney(item.qty * item.price)}</td>
        </tr>`,
    )
    .join('');

  const contactBits: string[] = [];
  if (settings.companyPhone) contactBits.push(`Phone: ${settings.companyPhone}`);
  if (settings.companyEmail) contactBits.push(settings.companyEmail);

  const notesSection =
    conversionLines.length || invoice.notes || selectedMethods.length
      ? `
      <div class="ci-notes">
        <div class="ci-label">NOTES TO CUSTOMER</div>
        ${conversionLines.length ? `<p class="ci-conversion-lines">${conversionLines.map(esc).join('<br/>')}</p>` : ''}
        ${invoice.notes ? `<p>${nl2br(invoice.notes)}</p>` : ''}
        ${
          selectedMethods.length
            ? `<div class="ci-payment-details">
                <div class="ci-payment-heading">Payment details</div>
                ${selectedMethods
                  .map(
                    (m) => `
                  <div class="ci-payment-method">
                    ${m.title ? `<p class="ci-payment-method-title">${esc(m.title)}</p>` : ''}
                    ${m.content ? `<p>${nl2br(m.content)}</p>` : ''}
                  </div>`,
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice-${esc(invoice.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; }
  .ci-invoice { max-width: 820px; margin: 0 auto; padding: 10px 4px; color: #1a1a1a; font-size: 14px; line-height: 1.4; }
  .ci-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 20px; }
  .ci-header-logo { flex: 0 1 auto; }
  .ci-logo { max-width: 180px; max-height: 84px; }
  .ci-header-from { flex: 1 1 auto; text-align: right; }
  .ci-doc-title { margin: 0 0 10px; font-size: 27px; font-weight: 900; letter-spacing: 0.5px; color: #16A34A; }
  .ci-company-name { font-size: 15px; font-weight: 700; }
  .ci-company-address, .ci-company-contact { color: #333; }
  .ci-meta-band { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; background: #f0f8f3; padding: 16px 22px; margin-bottom: 22px; border-radius: 6px; }
  .ci-meta-row { padding: 1px 0; }
  .ci-meta-label { font-weight: 700; }
  .ci-meta-due { flex: 0 0 auto; text-align: right; }
  .ci-due-figure { font-size: 22px; font-weight: 700; margin-top: 4px; white-space: nowrap; }
  .ci-due-caption { font-weight: 700; letter-spacing: 0.3px; margin-top: 2px; }
  .ci-stamp { display: inline-block; padding: 2px 10px; border-radius: 3px; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; }
  .ci-stamp-paid { background: #12805A; }
  .ci-stamp-partial { background: #B07400; }
  .ci-label { font-weight: 700; letter-spacing: 0.3px; margin-bottom: 4px; }
  .ci-bill-to { margin-bottom: 24px; }
  .ci-items { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .ci-items thead th { text-align: left; font-weight: 700; letter-spacing: 0.3px; padding: 6px 8px 8px; border-bottom: 1.5px solid #16A34A; white-space: nowrap; }
  .ci-items tbody td { padding: 8px 8px; border-bottom: 1px solid #d9d9d9; vertical-align: top; }
  .ci-items .ci-num { text-align: right; white-space: nowrap; }
  .ci-items .ci-col-num { text-align: center; width: 34px; }
  .ci-item-description { margin-top: 1px; color: #333; }
  .ci-summary { display: flex; justify-content: flex-end; margin-bottom: 26px; }
  .ci-summary table { border-collapse: collapse; min-width: 320px; }
  .ci-summary th, .ci-summary td { padding: 6px 8px; text-align: right; font-weight: 400; white-space: nowrap; }
  .ci-summary .ci-total th, .ci-summary .ci-total td, .ci-summary .ci-due th, .ci-summary .ci-due td { border-top: 1px solid #c9c9c9; font-weight: 700; padding-top: 10px; }
  .ci-summary .ci-due th, .ci-summary .ci-due td { color: #16A34A; }
  .ci-notes { font-size: 13.5px; color: #1a1a1a; }
  .ci-notes p { margin: 0 0 10px; }
  .ci-payment-heading { font-size: 15px; font-weight: 700; }
  .ci-payment-method { margin-top: 8px; }
  .ci-payment-method p { margin: 0; }
  .ci-payment-method-title { font-weight: 700; }
</style>
</head>
<body>
  <div class="ci-invoice">
    <div class="ci-header">
      <div class="ci-header-logo">
        ${settings.logoUri ? `<img class="ci-logo" src="${esc(settings.logoUri)}" />` : ''}
      </div>
      <div class="ci-header-from">
        <h1 class="ci-doc-title">INVOICE</h1>
        ${settings.companyName ? `<div class="ci-company-name">${esc(settings.companyName)}</div>` : ''}
        ${settings.companyAddress ? `<div class="ci-company-address">${nl2br(settings.companyAddress)}</div>` : ''}
        ${contactBits.length ? `<div class="ci-company-contact">${esc(contactBits.join('; '))}</div>` : ''}
      </div>
    </div>

    <div class="ci-meta-band">
      <div class="ci-meta-fields">
        <div class="ci-meta-row"><span class="ci-meta-label">Invoice No#</span> : <span>${esc(invoice.number)}</span></div>
        <div class="ci-meta-row"><span class="ci-meta-label">Invoice Date</span> : <span>${esc(formatDate(invoice.date))}</span></div>
        <div class="ci-meta-row"><span class="ci-meta-label">Due Date</span> : <span>${esc(formatDate(invoice.dueDate))}</span></div>
      </div>
      <div class="ci-meta-due">
        ${status === 'paid' ? '<span class="ci-stamp ci-stamp-paid">PAID</span>' : ''}
        ${status === 'partial' ? '<span class="ci-stamp ci-stamp-partial">PARTIALLY PAID</span>' : ''}
        <div class="ci-due-figure">${esc(symbol)}${fmtMoney(dueAmount)}</div>
        <div class="ci-due-caption">AMOUNT DUE</div>
      </div>
    </div>

    <div class="ci-bill-to">
      <div class="ci-label">BILL TO</div>
      <div class="ci-bill-name"><strong>${esc(invoice.billToName)}</strong></div>
      ${invoice.billToAddress ? `<div>${nl2br(invoice.billToAddress)}</div>` : ''}
      ${invoice.billToEmail ? `<div>${esc(invoice.billToEmail)}</div>` : ''}
      ${invoice.billToPhone ? `<div>Phone: ${esc(invoice.billToPhone)}</div>` : ''}
    </div>

    <table class="ci-items">
      <thead>
        <tr>
          <th class="ci-col-num">#</th>
          <th>ITEMS &amp; DESCRIPTION</th>
          <th class="ci-num">QTY/HRS</th>
          <th class="ci-num">PRICE</th>
          <th class="ci-num">AMOUNT(${esc(symbol)})</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="ci-summary">
      <table>
        <tr><th>Subtotal</th><td>${esc(symbol)}${fmtMoney(total)}</td></tr>
        <tr class="ci-total"><th>TOTAL</th><td>${esc(symbol)}${fmtMoney(total)} ${esc(currency)}</td></tr>
        ${invoice.amountPaid > 0 ? `<tr><th>Amount paid</th><td>${esc(symbol)}${fmtMoney(invoice.amountPaid)}</td></tr>` : ''}
        <tr class="ci-due"><th>AMOUNT DUE</th><td>${esc(symbol)}${fmtMoney(dueAmount)} ${esc(currency)}</td></tr>
      </table>
    </div>

    ${notesSection}
  </div>
</body>
</html>`;
}
