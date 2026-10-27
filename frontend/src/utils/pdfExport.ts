import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BackendProduct, BackendCategory } from '../types';
import { Order } from '../redux/slices/orderSlice';

// Helper to format currency for PDF reports (using Rs. for universal PDF font compatibility)
const formatPdfCurrency = (amount: number | string | undefined | null): string => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN')}`;
};

// Helper to format dates cleanly
const formatPdfDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

const formatPdfDateTime = (dateStr?: string | Date | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};

interface SummaryItem {
  label: string;
  value: string | number;
}

interface ReportHeaderConfig {
  title: string;
  subtitle?: string;
  summaryItems?: SummaryItem[];
  orientation?: 'p' | 'l';
}

/**
 * Initializes and draws the branded Shree Home Decor PDF header & summary metrics.
 * Returns the starting Y coordinate for the autoTable.
 */
const initReportDocument = (config: ReportHeaderConfig): { doc: jsPDF; startY: number } => {
  const orientation = config.orientation || 'p';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Decorative Brand Accent Strip
  doc.setFillColor(30, 58, 138); // Deep Indigo
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  doc.setFillColor(217, 119, 6); // Warm Amber
  doc.rect(0, 4.5, pageWidth, 1.2, 'F');

  // 2. Company Brand Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('SHREE HOME DECOR', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Luxury Home Furnishings & Interior Decor | Administrative Management Portal', 14, 21);

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(config.title.toUpperCase(), 14, 29);

  // 4. Generation Metadata (Top-Right aligned)
  const now = new Date();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${formatPdfDateTime(now)}`, pageWidth - 14, 16, { align: 'right' });
  doc.text('Official System Report • Confidential', pageWidth - 14, 21, { align: 'right' });

  // 5. Divider Rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 32, pageWidth - 14, 32);

  let currentY = 36;

  // 6. Summary Metric Cards
  if (config.summaryItems && config.summaryItems.length > 0) {
    const items = config.summaryItems;
    const cardGap = 3;
    const totalGap = cardGap * (items.length - 1);
    const availableWidth = pageWidth - 28;
    const cardWidth = (availableWidth - totalGap) / items.length;
    const cardHeight = 12;

    items.forEach((item, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);

      // Card Background Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Metric Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      doc.text(String(item.value), cardX + cardWidth / 2, currentY + 5.5, { align: 'center' });

      // Metric Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label.toUpperCase(), cardX + cardWidth / 2, currentY + 9.5, { align: 'center' });
    });

    currentY += cardHeight + 5;
  }

  return { doc, startY: currentY };
};

/**
 * Attaches header lines and page numbering ("Page X of Y") to all pages of the document.
 */
const finalizeReportDocument = (doc: jsPDF, filename: string): void => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Shree Home Decor • Administrative Record • Generated via Admin Control Center',
      14,
      pageHeight - 6
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }

  doc.save(filename);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportProductsPdf = (products: BackendProduct[]): void => {
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValuation = products.reduce((acc, p) => {
    const unitPrice = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
    return acc + unitPrice * (p.stock || 0);
  }, 0);
  const inStockCount = products.filter((p) => (p.stock || 0) > 0).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;

  const { doc, startY } = initReportDocument({
    title: 'Products Inventory Report',
    orientation: 'l',
    summaryItems: [
      { label: 'Total Products', value: products.length },
      { label: 'In Stock Items', value: inStockCount },
      { label: 'Out of Stock', value: outOfStockCount },
      { label: 'Total Stock Units', value: totalStockUnits.toLocaleString('en-IN') },
      { label: 'Total Inventory Valuation', value: formatPdfCurrency(totalInventoryValuation) },
    ],
  });

  const tableHead = [
    [
      '#',
      'Product Title',
      'Category',
      'Brand',
      'Price',
      'Discount',
      'Stock',
      'Stock Status',
      'Rating',
      'Featured',
    ],
  ];

  const tableBody: (string | number)[][] = products.map((p, idx) => {
    const categoryName =
      typeof p.category === 'object' && p.category !== null ? p.category.name || '—' : String(p.category || '—');
    const brandName =
      typeof p.brand === 'object' && p.brand !== null ? p.brand.name || '—' : String(p.brand || '—');
    const stockStatus =
      (p.stock || 0) <= 0 ? 'Out of Stock' : (p.stock || 0) <= 5 ? 'Low Stock' : 'In Stock';
    const ratingAvg =
      p.ratings && typeof p.ratings === 'object' ? p.ratings.average : (p.ratings as number) || 0;
    const numReviews =
      p.ratings && typeof p.ratings === 'object' ? p.ratings.numReviews : p.numReviews || 0;

    return [
      idx + 1,
      p.title || 'Untitled',
      categoryName,
      brandName,
      formatPdfCurrency(p.price),
      p.discountPrice ? formatPdfCurrency(p.discountPrice) : '—',
      p.stock ?? 0,
      stockStatus,
      ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${numReviews})` : 'No reviews',
      p.isFeatured ? 'Yes' : 'No',
    ];
  });

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Products_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORIES REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportCategoriesPdf = (categories: BackendCategory[]): void => {
  const activeCount = categories.filter((c: any) => c.isActive !== false).length;
  const totalProductsCount = categories.reduce((acc, c: any) => acc + (c.productCount || 0), 0);

  const { doc, startY } = initReportDocument({
    title: 'Product Categories Report',
    orientation: 'p',
    summaryItems: [
      { label: 'Total Categories', value: categories.length },
      { label: 'Active Categories', value: activeCount },
      { label: 'Inactive Categories', value: categories.length - activeCount },
      { label: 'Assigned Products', value: totalProductsCount },
    ],
  });

  const tableHead = [['#', 'Category Name', 'Slug', 'Description', 'Products', 'Status']];

  const tableBody: (string | number)[][] = categories.map((c: any, idx) => [
    idx + 1,
    c.name || 'Unnamed',
    c.slug || '—',
    c.description || 'No description provided',
    c.productCount ?? 0,
    c.isActive !== false ? 'Active' : 'Inactive',
  ]);

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Categories_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. BRANDS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportBrandsPdf = (brands: any[]): void => {
  const activeCount = brands.filter((b) => b.isActive !== false).length;

  const { doc, startY } = initReportDocument({
    title: 'Brands Directory Report',
    orientation: 'p',
    summaryItems: [
      { label: 'Total Brands', value: brands.length },
      { label: 'Active Brands', value: activeCount },
      { label: 'Inactive Brands', value: brands.length - activeCount },
    ],
  });

  const tableHead = [['#', 'Brand Name', 'Slug', 'Website', 'Description', 'Status']];

  const tableBody: (string | number)[][] = brands.map((b, idx) => [
    idx + 1,
    b.name || 'Unnamed',
    b.slug || '—',
    b.website || '—',
    b.description || '—',
    b.isActive !== false ? 'Active' : 'Inactive',
  ]);

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      5: { cellWidth: 22, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Brands_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ORDERS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportOrdersPdf = (orders: Order[]): void => {
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const pendingCount = orders.filter(
    (o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing'
  ).length;

  const { doc, startY } = initReportDocument({
    title: 'Customer Orders Summary Report',
    orientation: 'l',
    summaryItems: [
      { label: 'Total Orders', value: orders.length },
      { label: 'Delivered Orders', value: deliveredCount },
      { label: 'Pending / Processing', value: pendingCount },
      { label: 'Total Sales Revenue', value: formatPdfCurrency(totalRevenue) },
    ],
  });

  const tableHead = [
    [
      '#',
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Items Ordered',
      'Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Order Date',
    ],
  ];

  const tableBody: (string | number)[][] = orders.map((o, idx) => {
    const customerName =
      typeof o.user === 'object' && o.user !== null ? o.user.name || 'Guest' : String(o.user || 'Guest');
    const customerEmail =
      typeof o.user === 'object' && o.user !== null ? o.user.email || '—' : '—';
    const itemsSummary = (o.orderItems || [])
      .map((item) => `${item.title} (x${item.quantity})`)
      .join(', ');

    return [
      idx + 1,
      `#${(o._id || '').slice(-8).toUpperCase()}`,
      customerName,
      customerEmail,
      itemsSummary || '—',
      formatPdfCurrency(o.totalPrice),
      o.paymentMethod ? o.paymentMethod.toUpperCase() : 'COD',
      o.isPaid ? 'PAID' : 'UNPAID',
      o.orderStatus || 'Pending',
      formatPdfDate(o.createdAt),
    ];
  });

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      4: { cellWidth: 65 },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Orders_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ORDER STATUS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportOrderStatusPdf = (orders: Order[]): void => {
  const pendingCount = orders.filter((o) => o.orderStatus === 'Pending').length;
  const inTransitCount = orders.filter(
    (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery'
  ).length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledCount = orders.filter((o) => o.orderStatus === 'Cancelled').length;

  const { doc, startY } = initReportDocument({
    title: 'Order Fulfillment & Tracking Report',
    orientation: 'l',
    summaryItems: [
      { label: 'Total Tracked Orders', value: orders.length },
      { label: 'Pending Processing', value: pendingCount },
      { label: 'In-Transit / Shipped', value: inTransitCount },
      { label: 'Successfully Delivered', value: deliveredCount },
      { label: 'Cancelled Orders', value: cancelledCount },
    ],
  });

  const tableHead = [
    [
      '#',
      'Order ID',
      'Customer',
      'Order Total',
      'Current Status',
      'Tracking Number',
      'Payment Status',
      'Placed Date',
      'Last Updated',
    ],
  ];

  const tableBody: (string | number)[][] = orders.map((o, idx) => {
    const customerName =
      typeof o.user === 'object' && o.user !== null ? o.user.name || 'Guest' : String(o.user || 'Guest');

    return [
      idx + 1,
      `#${(o._id || '').slice(-8).toUpperCase()}`,
      customerName,
      formatPdfCurrency(o.totalPrice),
      o.orderStatus || 'Pending',
      String(o.trackingNumber || 'Not assigned'),
      o.isPaid ? 'PAID' : 'UNPAID',
      formatPdfDate(o.createdAt),
      formatPdfDateTime(o.updatedAt || o.createdAt),
    ];
  });

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_OrderStatus_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CUSTOMERS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportCustomersPdf = (customers: any[]): void => {
  const adminCount = customers.filter((c) => c.role === 'admin').length;
  const blockedCount = customers.filter((c) => c.isBlocked).length;
  const activeCount = customers.length - blockedCount;

  const { doc, startY } = initReportDocument({
    title: 'Customer Directory Report',
    orientation: 'l',
    summaryItems: [
      { label: 'Total Registered Users', value: customers.length },
      { label: 'Active Users', value: activeCount },
      { label: 'Blocked Accounts', value: blockedCount },
      { label: 'Admin Accounts', value: adminCount },
    ],
  });

  const tableHead = [
    [
      '#',
      'User ID',
      'Full Name',
      'Email Address',
      'Phone',
      'Role',
      'Status',
      'Total Orders',
      'Total Spent',
      'Joined Date',
    ],
  ];

  const tableBody: (string | number)[][] = customers.map((c, idx) => [
    idx + 1,
    `#${(c._id || c.id || '').slice(-8).toUpperCase()}`,
    c.name || 'Anonymous',
    c.email || '—',
    c.phone || '—',
    String(c.role || 'customer').toUpperCase(),
    c.isBlocked ? 'BLOCKED' : 'ACTIVE',
    c.ordersCount ?? c.totalOrders ?? 0,
    c.totalSpent ? formatPdfCurrency(c.totalSpent) : 'Rs. 0',
    formatPdfDate(c.createdAt),
  ]);

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'right' },
      9: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Customers_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. COUPONS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportCouponsPdf = (coupons: any[]): void => {
  const activeCount = coupons.filter((c) => c.isActive !== false).length;
  const totalUses = coupons.reduce((acc, c) => acc + (c.usedCount || c.uses || 0), 0);

  const { doc, startY } = initReportDocument({
    title: 'Discount Coupons & Promotions Report',
    orientation: 'p',
    summaryItems: [
      { label: 'Total Coupons', value: coupons.length },
      { label: 'Active Promotions', value: activeCount },
      { label: 'Total Redemptions', value: totalUses },
    ],
  });

  const tableHead = [
    ['#', 'Code', 'Discount Type', 'Value', 'Min Order', 'Uses / Limit', 'Status', 'Expiry Date'],
  ];

  const tableBody: (string | number)[][] = coupons.map((c, idx) => {
    const isPercent = String(c.discountType || c.type || '').toLowerCase().includes('percent');
    const valStr = isPercent
      ? `${c.discountAmount || c.value}% OFF`
      : formatPdfCurrency(c.discountAmount || c.value);
    const uses = c.usedCount ?? c.uses ?? 0;
    const limit = c.usageLimit ?? c.limit ?? 'No Limit';

    return [
      idx + 1,
      c.code || '—',
      c.discountType || c.type || 'Fixed',
      valStr,
      formatPdfCurrency(c.minPurchase || c.minOrder || 0),
      `${uses} / ${limit}`,
      c.isActive !== false ? 'Active' : 'Inactive',
      formatPdfDate(c.expiresAt || c.expires),
    ];
  });

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Coupons_Report_${timestamp}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. REVIEWS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const exportReviewsPdf = (reviews: any[]): void => {
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const totalRatingSum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avgRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : '0.0';

  const { doc, startY } = initReportDocument({
    title: 'Customer Product Reviews Report',
    orientation: 'l',
    summaryItems: [
      { label: 'Total Reviews', value: reviews.length },
      { label: 'Approved Reviews', value: approvedCount },
      { label: 'Pending Moderation', value: pendingCount },
      { label: 'Average Customer Rating', value: `${avgRating} / 5.0` },
    ],
  });

  const tableHead = [['#', 'Product', 'Customer', 'Rating', 'Review Comment', 'Status', 'Date']];

  const tableBody: (string | number)[][] = reviews.map((r, idx) => {
    const prodTitle =
      typeof r.product === 'object' && r.product !== null ? r.product.title || '—' : String(r.product || '—');
    const customerName =
      typeof r.user === 'object' && r.user !== null ? r.user.name || 'Anonymous' : String(r.user || 'Anonymous');

    return [
      idx + 1,
      prodTitle,
      customerName,
      `${r.rating || 5} Stars`,
      r.comment || 'No comment provided',
      String(r.status || 'pending').toUpperCase(),
      formatPdfDate(r.createdAt),
    ];
  });

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 85 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  finalizeReportDocument(doc, `ShreeHomeDecor_Reviews_Report_${timestamp}.pdf`);
};
