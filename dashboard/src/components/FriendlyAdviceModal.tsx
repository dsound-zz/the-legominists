import React, { useEffect, useState } from 'react';

const FriendlyAdviceModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('has_visited_advice');
    if (!hasVisited) setIsOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem('has_visited_advice', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-in fade-in duration-300"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        onClick={close}
      />

      <div
        className="relative w-full max-w-lg rounded-xl shadow-xl p-8 animate-in zoom-in-95 fade-in duration-300"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
      >
        <h2 className="font-display mb-6" style={{ fontSize: '24px', fontWeight: 400, color: '#1a1a1a' }}>
          Friendly Advice
        </h2>

        <div className="space-y-4" style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a', lineHeight: 1.7 }}>
          <p>
            I find it necessary on the first page of this book, quite ready for publication, to give the following advice: Read each of my written expositions thrice:
          </p>

          <div className="space-y-3 pl-4" style={{ borderLeft: '2px solid #E5E5E5' }}>
            <p>
              <span style={{ fontWeight: 400, color: '#6B3E1A', marginRight: '8px' }}>1.</span>
              Firstly—at least as you have already become mechanized to read all contemporary books and newspapers.
            </p>
            <p>
              <span style={{ fontWeight: 400, color: '#6B3E1A', marginRight: '8px' }}>2.</span>
              Secondly—as if you were reading aloud to another person.
            </p>
            <p>
              <span style={{ fontWeight: 400, color: '#6B3E1A', marginRight: '8px' }}>3.</span>
              And only thirdly—try and fathom the gist of my writings.
            </p>
          </div>

          <p>
            Only then will you be able to count upon forming your own impartial judgment, proper to yourself alone, on my writings.
          </p>

          <p className="text-right font-display" style={{ fontStyle: 'italic', color: '#6B3E1A' }}>
            — G. I. Gurdjieff
          </p>
        </div>

        <button
          onClick={close}
          className="mt-6 px-6 py-2 rounded transition-opacity hover:opacity-80"
          style={{ fontSize: '17px', fontWeight: 400, backgroundColor: '#6B3E1A', color: '#FFFFFF' }}
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default FriendlyAdviceModal;
