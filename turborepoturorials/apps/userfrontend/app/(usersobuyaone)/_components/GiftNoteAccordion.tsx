"use client";
import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function GiftNoteAccordion() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const { triggerToast } = useToast();

  const handleSave = () => {
    if (name || message) {
      triggerToast('Handwritten card attached to order');
      setIsOpen(false);
    } else {
      triggerToast('Please write a note or recipient name');
    }
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-space-xs">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
          </span>
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">Add Free Handwritten Note</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Pen on heavy textured cotton stock</p>
          </div>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>
      
      <div className={`mt-space-md pt-space-xs space-y-space-xs ${isOpen ? 'block' : 'hidden'}`}>
        <div className="space-y-space-2xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="recipient-name">Recipient Name</label>
          <input 
            className="w-full bg-surface-container-lowest text-on-surface px-space-sm py-2.5 rounded-lg font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
            id="recipient-name" 
            placeholder="e.g. Clara & Thomas" 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-space-2xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="gift-message">Personal Note (up to 180 chars)</label>
          <textarea 
            className="w-full bg-surface-container-lowest text-on-surface px-space-sm py-2 rounded-lg font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" 
            id="gift-message" 
            placeholder="Wishing you quiet mornings and warm gatherings in your new home..." 
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div className="flex items-center justify-between pt-space-2xs">
          <span className="font-label-sm text-[11px] text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">nature_people</span> Sealed with beeswax stamp
          </span>
          <button 
            className="bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold px-space-md py-2 rounded-full hover:bg-secondary/90 transition-all" 
            onClick={handleSave}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
