import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, BookOpen, Quote, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.initialQuestion) {
      setQuestion(location.state.initialQuestion);
      handleQuery(location.state.initialQuestion);
    }
  }, [location.state]);

  const handleQuery = async (q: string = question) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/query', { question: q });
      setResponse(res.data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 h-full flex flex-col pt-10">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white tracking-tight">RAG Query Engine</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Ask complex questions about Gurdjieff's hierarchy, the neologisms, or the travels of Beelzebub.
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-2 p-2 bg-slate-900 border border-white/5 rounded-xl shadow-2xl focus-within:ring-2 focus-within:ring-brand-gold/30 transition-all">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent px-4 py-3 text-lg outline-none text-slate-100 placeholder:text-slate-600"
            placeholder="e.g., What is the difference between Legominism and history?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="bg-brand-gold text-black p-3 rounded-lg hover:bg-brand-gold-muted transition-colors disabled:opacity-50 disabled:grayscale"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-10 pb-20 scrollbar-hide">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-4 pt-12 grayscale opacity-50"
            >
              <div className="w-16 h-16 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
              <p className="font-mono text-xs tracking-widest text-brand-gold uppercase">Consulting the Legominisms...</p>
            </motion.div>
          ) : response ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              {/* Answer */}
              <div className="scholar-card border-brand-gold/10 bg-brand-gold/[0.02]">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-brand-gold uppercase tracking-[0.2em]">
                  <Info size={14} /> Synthetic Answer
                </div>
                <div className="text-xl text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">
                  {response.answer}
                </div>
              </div>

              {/* Citations */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                  <Quote size={14} /> Referenced Passages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.citations.map((cit, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      className="scholar-card group relative cursor-help border-l-2 border-l-slate-800 hover:border-l-brand-gold transition-colors"
                    >
                      <div className="absolute top-4 right-4 text-[9px] font-bold text-slate-500 group-hover:text-brand-gold transition-colors">
                        PAGE {cit.page_number}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-4 italic group-hover:text-slate-200 transition-colors">
                        "{cit.text}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 opacity-20 grayscale">
               <Loader2 size={48} className="text-slate-500 animate-pulse" />
               <p className="mt-4 text-sm font-mono tracking-widest">AWAITING INPUT</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QueryInterface;
