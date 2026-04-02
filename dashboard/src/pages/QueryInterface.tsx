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

  useEffect(() => {
    if (location.state?.initialQuestion) {
      setQuestion(location.state.initialQuestion);
      handleQuery(location.state.initialQuestion);
    }
  }, [location.state]);

  const cancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleQuery = async (q: string = question) => {
    if (!q.trim()) return;
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/query', { question: q }, {
        signal: controller.signal,
        timeout: 90000,
      });
      setResponse(res.data);
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Query failed:', err);
        setError('The query timed out or failed. Try a shorter question.');
      }
    } finally {
      setLoading(false);
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
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center pt-16 pb-10 px-4">
        <h2 className="font-display text-center" style={{ fontSize: '42px', fontWeight: 400, color: '#1a1a1a', marginBottom: '10px' }}>
          RAG Query Engine
        </h2>
        <p className="text-center" style={{ fontSize: '21px', fontWeight: 400, color: '#6b7280', marginBottom: '32px' }}>
          Ask questions about Gurdjieff's hierarchy, the neologisms, or the travels of Beelzebub.
        </p>

        <div className="w-full flex gap-2 rounded-xl" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: '18px', fontWeight: 400, color: '#1a1a1a', padding: '18px 20px' }}
            placeholder="Ask anything about Beelzebub's Tales…"
            value={question}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="m-2 px-5 py-3 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ fontSize: '17px', fontWeight: 400, backgroundColor: '#6B3E1A', color: '#FFFFFF' }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto space-y-8 pb-20 px-4">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-lg p-5"
              style={{ border: '1px solid #FECDD3', backgroundColor: '#FFF1F2', color: '#881337', fontSize: '17px' }}
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
              <span style={{ fontSize: '17px' }}>Querying...</span>
            </motion.div>
          ) : response ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

              {/* Answer */}
              <div className="rounded-lg p-6" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
                <div
                  className="flex items-center gap-2 mb-4"
                  style={{ fontSize: '17px', fontWeight: 400, color: '#6B3E1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  <Info size={15} /> Answer
                </div>
                <div style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {response.answer}
                </div>
              </div>

              {/* Citations */}
              <div className="space-y-3">
                <h3
                  className="flex items-center gap-2"
                  style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  <Quote size={15} /> Referenced Passages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.citations.map((cit, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-5 transition-colors"
                      style={{ border: '1px solid #E5E5E5', borderLeftWidth: '2px', borderLeftColor: '#E5E5E5', backgroundColor: '#F9F9F8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = '#6B3E1A')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = '#E5E5E5')}
                    >
                      <div style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', marginBottom: '8px' }}>
                        Page {cit.page_number}
                      </div>
                      <p style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a', lineHeight: 1.7 }}>
                        "{cit.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ color: '#6b7280', opacity: 0.5, fontSize: '17px' }}>
              Enter a question above to begin.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QueryInterface;
