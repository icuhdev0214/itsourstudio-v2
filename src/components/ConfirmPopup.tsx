import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmPopup.css'; // Changed CSS import

interface ConfirmPopupProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isDestructive = false
}) => {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = ''; // Changed to empty string
        }
        return () => {
            document.body.style.overflow = ''; // Changed to empty string
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Rendered via portal: an ancestor (e.g. Content Management's frosted-glass
    // panels, which use backdrop-filter) can otherwise become the containing
    // block for this fixed-position overlay, clipping/mispositioning it instead
    // of covering the full viewport.
    return createPortal(
        <div className="confirm-popup-overlay">
            <div className="confirm-popup-content">
                <div className="confirm-body">
                    <h3 className="confirm-title">{title}</h3>
                    <p className="confirm-message">{message}</p>
                </div>

                <div className="confirm-actions">
                    <button
                        onClick={onCancel}
                        className="confirm-btn cancel"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`confirm-btn confirm ${isDestructive ? 'destructive' : ''}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmPopup;
