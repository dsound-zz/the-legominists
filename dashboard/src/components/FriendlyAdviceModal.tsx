import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const FriendlyAdviceModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('has_visited_advice');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const closeFooter = () => {
    localStorage.setItem('has_visited_advice', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={closeFooter}
      />
      
      <div className="relative w-full max-w-xl bg-bg-card border border-white/10 rounded-xl shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 fade-in duration-500">
        <div className="flex flex-col items-center text-center space-y-8">
          
          <h2 className="text-3xl font-serif text-brand-gold tracking-wide">
            Friendly Advice
          </h2>

          <div className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base font-light text-left max-w-lg mx-auto">
            <p>
              I find it necessary on the first page of this book, quite ready for publication, to give the following advice: Read each of my written expositions thrice:
            </p>
            
            <div className="space-y-4 pl-4 border-l border-brand-gold/30">
              <p>
                <span className="text-brand-gold font-medium mr-2">1.</span>
                Firstly—at least as you have already become mechanized to read all contemporary books and newspapers.
              </p>
              <p>
                <span className="text-brand-gold font-medium mr-2">2.</span>
                Secondly—as if you were reading aloud to another person.
              </p>
              <p>
                <span className="text-brand-gold font-medium mr-2">3.</span>
                And only thirdly—try and fathom the gist of my writings.
              </p>
            </div>

            <p>
              Only then will you be able to count upon forming your own impartial judgment, proper to yourself alone, on my writings. And only then can my hope be actualized that according to your understanding you will obtain the specific benefit for yourself which I anticipate, and which I wish for you with all my being.
            </p>
            
            <p className="text-right text-brand-gold italic font-serif mt-6">
              — G. I. Gurdjieff
            </p>
          </div>

          <button
            onClick={closeFooter}
            className="mt-8 px-10 py-3 bg-brand-gold text-bg-deep font-medium rounded hover:bg-white transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendlyAdviceModal;
