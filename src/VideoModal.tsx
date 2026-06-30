import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string;
  title: string;
}

export default function VideoModal({ isOpen, onClose, youtubeId, title }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-surface border border-outline-variant/50 shadow-2xl z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30">
          <span className="font-display font-normal text-headline-md tracking-wider text-primary uppercase">{title}</span>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
            aria-label="Close video"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}
