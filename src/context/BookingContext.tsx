import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface BookingContextType {
    isBookingOpen: boolean;
    openBooking: (packageId?: string) => void;
    closeBooking: () => void;
    selectedPackageId: string | null;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

    const openBooking = (packageId?: string) => {
        if (packageId) setSelectedPackageId(packageId);
        setIsBookingOpen(true);
    };

    const closeBooking = () => {
        setIsBookingOpen(false);
        setSelectedPackageId(null);
    };

    return (
        <BookingContext.Provider value={{ isBookingOpen, openBooking, closeBooking, selectedPackageId }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};
