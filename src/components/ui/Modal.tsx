import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
    xl: 'max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl',
    full: 'max-w-[95%] sm:max-w-[90%] h-[90%] sm:h-[85%]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-30 backdrop-blur-sm transition-all animate-fade-in">
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-modal w-full ${sizeClasses[size]} overflow-hidden animate-scale`}
      >
        {title && (
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900">{title}</h3>
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-500 transition-colors p-1 rounded-full hover:bg-neutral-100"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        {!title && (
          <button
            type="button"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-neutral-400 hover:text-neutral-500 z-10 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-all"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}
        
        <div className={`${size === 'full' ? 'overflow-auto h-full' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;