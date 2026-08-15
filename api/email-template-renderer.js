const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatValue = (value) => {
    if (value === undefined || value === null || value === '') return '';
    return String(value);
};

const getTemplateValues = (booking = {}) => ({
    customerName: booking.name || booking.fullName || 'Customer',
    bookingReference: booking.referenceNumber || 'IOS',
    packageName: booking.package || 'Selected package',
    bookingDate: booking.date || '',
    bookingTime: booking.time_start || booking.time || '',
    totalAmount: formatValue(booking.total_amount ?? booking.totalPrice ?? 0),
    downpayment: formatValue(booking.downpayment ?? booking.requiredDownpayment ?? 0),
    remainingBalance: formatValue(booking.remainingBalance ?? 0),
    reason: booking.reason || 'We are unable to accommodate this booking at the requested time.',
    businessEmail: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER || ''
});

export const applyEmailTemplate = (template = '', booking = {}) => {
    const values = getTemplateValues(booking);
    return String(template).replace(/\{(\w+)\}/g, (_, key) => escapeHtml(values[key] ?? ''));
};

const renderBody = (body = '', booking = {}) => applyEmailTemplate(body, booking)
    .split('\n')
    .map(line => line.trim() ? `<p style="margin: 0 0 14px; color: #334155; line-height: 1.65;">${line}</p>` : '<div style="height: 8px;"></div>')
    .join('');

const renderDetails = (booking = {}, detailRow, detailLabel, detailValue) => `
    <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 30px 0 15px;">Booking Details</h3>
    <div style="border-top: 1px solid #f1f5f9;">
        <div style="${detailRow}"><span style="${detailLabel}">Reference:</span><span style="${detailValue}">${escapeHtml(booking.referenceNumber || 'IOS')}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Package:</span><span style="${detailValue}">${escapeHtml(booking.package || '')}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Date:</span><span style="${detailValue}">${escapeHtml(booking.date || '')}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Time:</span><span style="${detailValue}">${escapeHtml(booking.time_start || booking.time || '')}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Total:</span><span style="${detailValue}">₱${escapeHtml(booking.total_amount ?? booking.totalPrice ?? 0)}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Downpayment:</span><span style="${detailValue}">₱${escapeHtml(booking.downpayment ?? booking.requiredDownpayment ?? 0)}</span></div>
        <div style="${detailRow}"><span style="${detailLabel}">Remaining Balance:</span><span style="${detailValue}">₱${escapeHtml(booking.remainingBalance ?? 0)}</span></div>
    </div>
`;

export const buildTemplateEmail = ({ template, booking, style, title = 'Booking Update' }) => {
    const safeTitle = escapeHtml(title);
    const preheader = template?.preheader ? applyEmailTemplate(template.preheader, booking) : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
</head>
<body style="${style.body}">
    <span style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden;">${preheader}</span>
    <div style="${style.container}">
        <div style="background-color: #1e293b; padding: 30px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">It's ouR Studio</h1>
        </div>
        <div style="${style.hero}">
            <h2 style="${style.heroTitle}">${safeTitle}</h2>
            <div style="max-width: 480px; margin: 0 auto; text-align: left;">
                ${renderBody(template?.body, booking)}
            </div>
        </div>
        <div style="${style.section}">
            ${renderDetails(booking, style.detailRow, style.detailLabel, style.detailValue)}
        </div>
        <div style="${style.footer}">
             <p style="${style.footerText}">Questions? Reply to this email.<br>© It's ouR Studio</p>
        </div>
    </div>
</body>
</html>`;
};
