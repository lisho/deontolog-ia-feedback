import React, { useEffect, useState } from 'react';

interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const SuccessIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        const fadeInTimer = setTimeout(() => setIsVisible(true), 10);

        const lifeTimer = setTimeout(() => {
            // Start fade out
            setIsVisible(false);
            // Call onClose after animation finishes
            const closeTimer = setTimeout(onClose, 300);
            return () => clearTimeout(closeTimer);
        }, 3000); // Display duration

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(lifeTimer);
        }
    }, [onClose]);

    const baseClasses = "fixed bottom-5 right-5 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-semibold flex items-center gap-3 transition-all duration-300";
    const visibilityClasses = isVisible ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4";

    const typeClasses = {
        success: "bg-green-600",
        error: "bg-red-600",
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert">
            {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            <span>{message}</span>
        </div>
    );
};
