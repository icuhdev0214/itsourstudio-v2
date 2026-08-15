export type EmailTemplateKey = 'received' | 'confirmed' | 'completed' | 'rejected' | 'reminder' | 'new_booking_admin';

export interface EmailTemplate {
    subject: string;
    preheader: string;
    body: string;
}

export type EmailTemplateMap = Record<EmailTemplateKey, EmailTemplate>;

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
    received: 'Booking Received',
    confirmed: 'Booking Confirmed',
    completed: 'Booking Completed',
    rejected: 'Booking Rejected',
    reminder: 'Session Reminder',
    new_booking_admin: 'Admin New Booking Alert'
};

export const EMAIL_TEMPLATE_PLACEHOLDERS = [
    '{customerName}',
    '{bookingReference}',
    '{packageName}',
    '{bookingDate}',
    '{bookingTime}',
    '{totalAmount}',
    '{downpayment}',
    '{remainingBalance}',
    '{reason}',
    '{businessEmail}'
];

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateMap = {
    received: {
        subject: 'Booking Received - Action Required [{bookingReference}]',
        preheader: 'We received your booking request and payment proof.',
        body: 'Hi {customerName},\n\nThanks for booking {packageName}. We received your booking request for {bookingDate} at {bookingTime}.\n\nPlease wait while our team verifies your downpayment of ₱{downpayment}. Your booking reference is {bookingReference}.'
    },
    confirmed: {
        subject: 'Booking Confirmed [{bookingReference}]',
        preheader: 'Your studio session is confirmed.',
        body: 'Hi {customerName},\n\nYour {packageName} session is officially confirmed for {bookingDate} at {bookingTime}.\n\nPlease arrive 10-15 minutes early. We are excited to see you at the studio!'
    },
    completed: {
        subject: 'Session Completed - Thank You [{bookingReference}]',
        preheader: 'Thank you for visiting It\'s ouR Studio.',
        body: 'Hi {customerName},\n\nThank you for completing your {packageName} session with us.\n\nYour booking reference is {bookingReference}. If you have questions about your photos or release timeline, reply to this email and our team will help you.'
    },
    rejected: {
        subject: 'Booking Status Update [{bookingReference}]',
        preheader: 'We have an update about your booking request.',
        body: 'Hi {customerName},\n\nWe are sorry, but we cannot confirm your {packageName} booking request for {bookingDate} at {bookingTime}.\n\nReason: {reason}\n\nPlease try booking another available slot.'
    },
    reminder: {
        subject: 'Reminder: Session in 30 Minutes [{bookingReference}]',
        preheader: 'Your studio session is starting soon.',
        body: 'Hi {customerName},\n\nYour {packageName} session starts soon at {bookingTime}.\n\nPlease head to the studio and arrive prepared for your shoot.'
    },
    new_booking_admin: {
        subject: 'NEW BOOKING - {customerName} [{bookingReference}]',
        preheader: 'A new booking is waiting for admin review.',
        body: 'A new booking was submitted by {customerName}.\n\nPackage: {packageName}\nDate and time: {bookingDate} at {bookingTime}\nTotal: ₱{totalAmount}\nRequired downpayment: ₱{downpayment}\n\nPlease review the payment proof in the admin dashboard.'
    }
};

export const mergeEmailTemplates = (templates?: Partial<EmailTemplateMap>): EmailTemplateMap => ({
    ...DEFAULT_EMAIL_TEMPLATES,
    ...(templates || {})
});
