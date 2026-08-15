import { useState } from 'react';
import { X, CheckCircle, Banknote, Smartphone } from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import ConfirmPopup from '../ConfirmPopup';
import { calculatePaymentBreakdown } from '../../utils/payment';
import './InvoiceModal.css';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
    onUpdate: () => void; // Refresh parent data
    onStatusEmail?: (booking: any, status: 'confirmed' | 'completed') => Promise<void>;
}

const InvoiceModal = ({ isOpen, onClose, booking, onUpdate, onStatusEmail }: InvoiceModalProps) => {
    const [loading, setLoading] = useState(false);
    const [confirmPopup, setConfirmPopup] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    if (!isOpen || !booking) return null;

    const total = Number(booking.totalPrice) || 0;
    const addOns = Number(booking.addOnsAmount) || 0;
    const selectedAddOns = Array.isArray(booking.selectedAddOns) ? booking.selectedAddOns : [];
    const recordedDownpayment = Number(booking.downpaymentAmount) || 0;
    const paymentBreakdown = calculatePaymentBreakdown(total);
    const requiredDownpayment = Number(booking.requiredDownpayment || booking.downpayment) || paymentBreakdown.requiredDownpayment;
    const paidCash = Number(booking.fullPaymentCash) || 0;
    const paidGcash = Number(booking.fullPaymentGcash) || 0;
    const totalPaid = recordedDownpayment + paidCash + paidGcash;
    const balance = total - totalPaid;
    const balanceDue = Math.max(0, balance);
    const isPaid = balance <= 0;
    const isDownpaymentVerified = recordedDownpayment >= requiredDownpayment;

    const closeConfirm = () => setConfirmPopup(prev => ({ ...prev, isOpen: false }));

    const syncSlotStatus = async (status: 'confirmed' | 'completed') => {
        try {
            await updateDoc(doc(db, 'booked_slots', booking.id), { status });
        } catch (err) {
            console.log('Slot doc not found, skipping invoice status sync');
        }
    };

    const handleMarkPaid = (method: 'cash' | 'gcash') => {
        setConfirmPopup({
            isOpen: true,
            title: 'Confirm Full Payment',
            message: `Mark remaining balance of ₱${balanceDue.toLocaleString()} as paid via ${method.toUpperCase()}?`,
            onConfirm: async () => {
                closeConfirm();
                setLoading(true);
                try {
                    const updateData: any = {
                        status: 'completed',
                        remainingBalance: 0
                    };
                    if (method === 'cash') {
                        updateData.fullPaymentCash = paidCash + balanceDue;
                    } else {
                        updateData.fullPaymentGcash = paidGcash + balanceDue;
                    }
                    await updateDoc(doc(db, 'bookings', booking.id), updateData);
                    await syncSlotStatus('completed');
                    await onStatusEmail?.({ ...booking, ...updateData }, 'completed');
                    onUpdate();
                } catch (err) {
                    console.error("Error updating invoice:", err);
                    alert("Failed to update payment.");
                }
                setLoading(false);
            }
        });
    };

    const handleDownpayment = () => {
        const defaultDown = requiredDownpayment;

        setConfirmPopup({
            isOpen: true,
            title: 'Verify Downpayment',
            message: `Confirm that you have verified the required downpayment of ₱${defaultDown.toLocaleString()}? This will update the booking and ledger.`,
            onConfirm: async () => {
                closeConfirm();
                setLoading(true);
                try {
                    await updateDoc(doc(db, 'bookings', booking.id), {
                        downpaymentAmount: defaultDown,
                        requiredDownpayment: defaultDown,
                        amountToPayNow: defaultDown,
                        remainingBalance: Math.max(0, total - defaultDown),
                        status: 'confirmed'
                    });
                    await syncSlotStatus('confirmed');
                    await onStatusEmail?.({
                        ...booking,
                        downpaymentAmount: defaultDown,
                        requiredDownpayment: defaultDown,
                        amountToPayNow: defaultDown,
                        remainingBalance: Math.max(0, total - defaultDown),
                        status: 'confirmed'
                    }, 'confirmed');
                    onUpdate();
                } catch (err) {
                    console.error("Error updating downpayment:", err);
                    alert("Failed to update downpayment.");
                }
                setLoading(false);
            }
        });
    };

    return (

        <>
            <div className="invoice-overlay" onClick={onClose}>
                <div className="invoice-container" onClick={e => e.stopPropagation()}>
                    <button className="invoice-close-floating" onClick={onClose}>
                        <X size={24} />
                    </button>

                    <div className="invoice-layout">
                        {/* LEFT PANEL: The Invoice Document */}
                        <div className="invoice-paper" id="printable-invoice">
                            <div className="paper-header">
                                <div className="brand-section">
                                    <img src="/logo/android-chrome-512x512.png" alt="Logo" className="brand-logo" />
                                    <div className="brand-info">
                                        <h1>INVOICE</h1>
                                        <span className="ref-number">#{booking.referenceNumber || booking.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="invoice-meta">
                                    <div className="meta-group">
                                        <label>Date Issued</label>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="meta-group">
                                        <label>Due Date</label>
                                        <span>{booking.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="paper-body">
                                <div className="client-section">
                                    <h3>Bill To:</h3>
                                    <p className="client-name">{booking.fullName}</p>
                                    <p className="client-contact">{booking.phone || booking.email || 'No contact info'}</p>
                                    <p className="service-date">Service Date: {booking.date} @ {booking.time}</p>
                                </div>

                                <div className="items-table-wrapper">
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th className="th-desc">Description</th>
                                                <th className="th-amount">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div className="item-name">{booking.package} Package</div>
                                                    <div className="item-sub">Standard Studio Package</div>
                                                </td>
                                                <td className="amount">₱{(total - addOns).toLocaleString()}</td>
                                            </tr>
                                            {selectedAddOns.length > 0 ? (
                                                selectedAddOns.map((addOn: any) => (
                                                    <tr key={addOn.id || addOn.name}>
                                                        <td>
                                                            <div className="item-name">{addOn.name}</div>
                                                            <div className="item-sub">Selected add-on</div>
                                                        </td>
                                                        <td className="amount">₱{Number(addOn.price || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : addOns > 0 && (
                                                <tr>
                                                    <td>
                                                        <div className="item-name">Add-ons / Extras</div>
                                                        <div className="item-sub">Additional services or items</div>
                                                    </td>
                                                    <td className="amount">₱{addOns.toLocaleString()}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="row-total">
                                                <td>Total Amount</td>
                                                <td>₱{total.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="paper-footer">
                                <p>Thank you for choosing ItsourStudio!</p>
                                <p className="contact-support">Questions? Contact us at itsourstudio1@gmail.com</p>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Controls & Summary */}
                        <div className="invoice-sidebar">
                            <div className="sidebar-card summary-card">
                                <h3>Payment Summary</h3>
                                <div className="summary-row">
                                    <span>Total</span>
                                    <span>₱{total.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Required Downpayment</span>
                                    <span>₱{requiredDownpayment.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Verified Downpayment</span>
                                    <span className={isDownpaymentVerified ? 'text-success' : 'text-danger'}>
                                        ₱{recordedDownpayment.toLocaleString()}
                                    </span>
                                </div>
                                <div className="summary-row">
                                    <span>Total Paid</span>
                                    <span className="text-success">- ₱{totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="divider"></div>
                                <div className="summary-row balance-row">
                                    <span>Balance Due</span>
                                    <span className={isPaid ? 'text-success' : 'text-danger'}>
                                        ₱{balanceDue.toLocaleString()}
                                    </span>
                                </div>

                                <div className={`status-badge ${isPaid ? 'paid' : 'pending'}`}>
                                    {isPaid ? (
                                        <>
                                            <CheckCircle size={16} /> PAID
                                        </>
                                    ) : (
                                        'PAYMENT PENDING'
                                    )}
                                </div>
                            </div>

                            {/* Downpayment Section */}
                            {!isDownpaymentVerified && !isPaid && (
                                <div className="sidebar-card actions-card">
                                    <h3>Confirm Downpayment</h3>
                                    <p>Verify the proof of payment matches the required downpayment of ₱{requiredDownpayment.toLocaleString()}.</p>
                                    <div className="payment-buttons">
                                        <button className="btn-action gcash" onClick={() => handleDownpayment()} disabled={loading}>
                                            <CheckCircle size={18} /> Verify & Confirm
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPaid && (
                                <div className="sidebar-card actions-card">
                                    <h3>Accept Payment</h3>
                                    <p>Record a payment for the remaining balance.</p>
                                    <div className="payment-buttons">
                                        <button className="btn-action cash" onClick={() => handleMarkPaid('cash')} disabled={loading}>
                                            <Banknote size={18} /> Cash Payment
                                        </button>
                                        <button className="btn-action gcash" onClick={() => handleMarkPaid('gcash')} disabled={loading}>
                                            <Smartphone size={18} /> GCash Payment
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <ConfirmPopup
                isOpen={confirmPopup.isOpen}
                title={confirmPopup.title}
                message={confirmPopup.message}
                onConfirm={confirmPopup.onConfirm}
                onCancel={closeConfirm}
            />
        </>
    );
};

export default InvoiceModal;
