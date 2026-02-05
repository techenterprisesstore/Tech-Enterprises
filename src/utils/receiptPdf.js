import { jsPDF } from 'jspdf';

// Use "Rs." in PDF to avoid distorted/missing ₹ symbol in default fonts
const formatCurrency = (amount) => `Rs. ${Number(amount).toLocaleString('en-IN')}`;

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get full image URL (for relative paths)
 */
const getFullImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return origin + (t.startsWith('/') ? t : '/' + t);
};

/**
 * Load image as base64 data URL and natural dimensions (for aspect-ratio-preserving draw)
 */
const loadImageData = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src.startsWith('http') ? src : window.location.origin + (src.startsWith('/') ? src : '/' + src);
  });

/**
 * Draw image in PDF preserving aspect ratio, centered in the given box (no stretch)
 */
const addImageFit = (doc, dataUrl, x, y, boxW, boxH, imgWidth, imgHeight) => {
  if (!dataUrl || !imgWidth || !imgHeight) return;
  const ar = imgWidth / imgHeight;
  let w = boxW;
  let h = boxW / ar;
  if (h > boxH) {
    h = boxH;
    w = boxH * ar;
  }
  const x0 = x + (boxW - w) / 2;
  const y0 = y + (boxH - h) / 2;
  doc.addImage(dataUrl, 'PNG', x0, y0, w, h);
};

/**
 * Build shipping address lines without duplication (e.g. city only once)
 */
const getShippingAddressLines = (addr) => {
  if (!addr) return [];
  const lines = [];
  if (addr.name && addr.name.trim()) lines.push(addr.name.trim());
  const street = (addr.street || '').trim();
  const city = (addr.city || '').trim();
  if (street && street !== city) lines.push(street);
  if (addr.landmark && String(addr.landmark).trim()) lines.push(String(addr.landmark).trim());
  const cityStatePincode = [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  if (cityStatePincode) lines.push(cityStatePincode);
  return lines;
};

/**
 * Generate and download a PDF receipt for an order.
 */
export const generateOrderReceiptPdf = async (order, logoPath = '/assets/primarylogo.png') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const colMid = pageW / 2;
  let y = 10;

  const logoUrl = logoPath.startsWith('http') ? logoPath : window.location.origin + logoPath;
  const logoData = await loadImageData(logoUrl);
  if (logoData && logoData.dataUrl) {
    const boxW = 50;
    const boxH = 20;
    const logoX = (pageW - boxW) / 2;
    addImageFit(doc, logoData.dataUrl, logoX, y, boxW, boxH, logoData.width, logoData.height);
    y += boxH + 6;
  } else {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Tech Enterprises', pageW / 2, y + 6, { align: 'center' });
    y += 14;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const orderId = order.id ? order.id.substring(0, 8).toUpperCase() : '—';
  doc.setFont('helvetica', 'bold');
  doc.text(`Order #${orderId}`, pageW / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(formatDate(order.createdAt), pageW / 2, y, { align: 'center' });
  y += 12;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const rowStart = y;
  const leftX = margin;
  const rightX = colMid + 5;
  const colWidth = colMid - margin - 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Customer details', leftX, y);
  doc.text('Shipping address', rightX, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const customerLines = [
    `Name: ${order.userName || '—'}`,
    `Email: ${order.userEmail || '—'}`,
    `Phone: ${order.userPhone || '—'}`,
  ];
  const shippingLines = getShippingAddressLines(order.shippingAddress);
  const maxLines = Math.max(customerLines.length, Math.max(1, shippingLines.length));

  for (let i = 0; i < maxLines; i++) {
    if (customerLines[i]) doc.text(customerLines[i], leftX, y);
    if (shippingLines[i]) doc.text(shippingLines[i], rightX, y);
    y += 6;
  }
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Product details', margin, y);
  y += 8;

  const imgSize = 14;
  const colImg = margin;
  const colName = margin + imgSize + 4;
  const colQty = 95;
  const colPrice = 108;
  const colOffer = 130;
  const colTotal = 155;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Product', colName, y);
  doc.text('Qty', colQty, y);
  doc.text('Price', colPrice, y);
  doc.text('Offer', colOffer, y);
  doc.text('Total', colTotal, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const items = order.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const price = item.isOffer && item.offerPrice != null ? item.offerPrice : item.price;
    const qty = item.quantity || 1;
    const lineTotal = (price || 0) * qty;
    const name = (item.name || 'Item').substring(0, 32);
    const rowY = y;

    const imgUrl = getFullImageUrl(item.imageUrl);
    const itemImgData = imgUrl ? await loadImageData(imgUrl) : null;
    if (itemImgData && itemImgData.dataUrl) {
      try {
        addImageFit(doc, itemImgData.dataUrl, colImg, rowY - 4, imgSize, imgSize, itemImgData.width, itemImgData.height);
      } catch (_) {}
    }

    doc.text(name, colName, rowY);
    doc.text(String(qty), colQty, rowY);
    doc.text(formatCurrency(item.price || 0), colPrice, rowY);
    doc.text(item.isOffer && item.offerPrice != null ? formatCurrency(item.offerPrice) : '—', colOffer, rowY);
    doc.text(formatCurrency(lineTotal), colTotal, rowY);
    y += imgSize + 2;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Order total', margin, y);
  doc.text(formatCurrency(order.totalPrice ?? 0), colTotal, y);
  y += 10;

  if (order.discountAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Discount (${order.appliedCouponCode || 'coupon'})`, margin, y);
    doc.text(`-${formatCurrency(order.discountAmount)}`, colTotal, y);
    y += 6;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Thank you for your order.', pageW / 2, Math.min(y + 15, 285), { align: 'center' });

  const filename = `receipt-${orderId}-${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
};
