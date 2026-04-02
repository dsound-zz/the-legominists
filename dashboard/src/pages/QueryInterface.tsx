import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, Quote, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Citation {
  text: string;
  page_number: number;
  distance: number;
}

interface QueryResponse {
  answer: string;
  citations: Citation[];
}

const QueryInterface: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    if (location.state?.initialQuestion) {
      setQuestion(location.state.initialQuestion);
      handleQuery(location.state.initialQuestion);
    }
  }, [location.state]);

  // Cancel on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const cancel = () => {
    reqRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError(null);
  };

  const handleQuery = async (q: string = question) => {
    if (!q.trim()) return;
    const id = ++reqRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/query', { question: q }, { signal: controller.signal });
      if (id === reqRef.current) setResponse(res.data);
    } catch (err: any) {
      if (id === reqRef.current && !controller.signal.aborted) {
        console.error('Query failed:', err);
        setError('The query timed out or failed. Try a shorter question.');
      }
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuestion(val);
    if (!val) cancel();
  };

  return (
    <div className="h-full flex flex-col items-center">
      {/* Centered header + input */}
      {/* Centered header + input */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center pt-8 md:pt-16 pb-6 md:pb-10 px-4">
        <h2 className="font-display text-center text-3xl md:text-[42px]" style={{ fontWeight: 400, color: '#1a1a1a', marginBottom: '10px' }}>
          RAG Query Engine
        </h2>
        <p className="text-center text-base md:text-[21px] mb-6 md:mb-8" style={{ fontWeight: 400, color: '#6b7280' }}>
          Ask questions about Gurdjieff's hierarchy, the neologisms, or the travels of Beelzebub.
        </p>

        <div className="w-full flex gap-2 rounded-xl" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none py-3 md:py-[18px] px-4 md:px-5 text-base md:text-[18px]"
            style={{ fontWeight: 400, color: '#1a1a1a' }}
            placeholder="Ask anything about Beelzebub's Tales…"
            value={question}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="m-1.5 md:m-2 px-4 md:px-5 py-2 md:py-3 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 text-sm md:text-[17px]"
            style={{ fontWeight: 400, backgroundColor: '#6B3E1A', color: '#FFFFFF' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto space-y-6 md:space-y-8 pb-32 md:pb-20 px-4">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-lg p-5 text-base md:text-[17px]"
              style={{ border: '1px solid #FECDD3', backgroundColor: '#FFF1F2', color: '#881337' }}
            >
              {error}
            </motion.div>
          ) : loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
              style={{ color: '#6b7280' }}
            >
              <Loader2 size={18} className="animate-spin" />
              <span className="text-base md:text-[17px]">Querying...</span>
            </motion.div>
          ) : response ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">

              {/* Answer */}
              <div className="rounded-lg p-5 md:p-6" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
                <div
                  className="flex items-center gap-2 mb-3 md:mb-4 text-xs md:text-[17px]"
                  style={{ fontWeight: 400, color: '#6B3E1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  <Info size={14} /> Answer
                </div>
                <div className="text-base md:text-[17px]" style={{ fontWeight: 400, color: '#1a1a1a', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {response.answer}
                </div>
              </div>

              {/* Citations */}
              <div className="space-y-3">
                <h3
                  className="flex items-center gap-2 text-xs md:text-[17px]"
                  style={{ fontWeight: 400, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  <Quote size={14} /> Referenced Passages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {response.citations.map((cit, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-4 md:p-5 transition-colors"
                      style={{ border: '1px solid #E5E5E5', borderLeftWidth: '2px', borderLeftColor: '#E5E5E5', backgroundColor: '#F9F9F8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = '#6B3E1A')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = '#E5E5E5')}
                    >
                      <div className="text-xs md:text-[17px]" style={{ fontWeight: 400, color: '#6b7280', marginBottom: '8px' }}>
                        Page {cit.page_number}
                      </div>
                      <p className="text-base md:text-[17px]" style={{ fontWeight: 400, color: '#1a1a1a', lineHeight: 1.7 }}>
                        "{cit.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-base md:text-[17px]" style={{ color: '#6b7280', opacity: 0.5 }}>
              Enter a question above to begin.
            </div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default QueryInterface;
