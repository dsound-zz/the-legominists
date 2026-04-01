import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, Clock, Globe, Info, MessageSquare, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '../lib/utils';

interface WordDetailData {
  word: string;
  etymology: {
    word: string;
    roots: { morpheme: string; language: string; meaning: string }[];
    confidence: number;
    notes: string;
  };
  frequency: { page_number: number; count: number }[];
  passages: { text: string; page_number: number; distance: number }[];
  total_count: number;
}

const languageColors: Record<string, string> = {
  Greek: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Armenian: 'text-red-400 bg-red-400/10 border-red-400/20',
  Arabic: 'text-green-400 bg-green-400/10 border-green-400/20',
  Turkish: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Sanskrit: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Persian: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
};

const WordDetail: React.FC = () => {
  const { word } = useParams<{ word: string }>();
  const [data, setData] = useState<WordDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (word) {
      setLoading(true);
      axios.get(`/api/word/${word}`)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch word details:", err);
          setLoading(false);
        });
    }
  }, [word]);

  if (loading) return <div className="text-slate-500">Decrypting "{word}"...</div>;
  if (!data) return <div>Word not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Lexicon
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4 flex-1">
          <h2 className="text-5xl font-mono font-bold text-brand-gold tracking-tight lowercase">
            {data.word}
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300">
              <Clock size={14} className="text-slate-500" />
              {data.total_count} occurrences
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300">
              <Globe size={14} className="text-slate-500" />
              {data.frequency.length} unique pages
            </div>
              {data.etymology?.confidence && (
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-gold/5 border border-brand-gold/20 rounded-full text-xs font-medium text-brand-gold">
                  <Info size={14} />
                  {typeof data.etymology.confidence === 'number' 
                    ? `${Math.round(data.etymology.confidence * 100)}% Confidence`
                    : `${data.etymology.confidence} Confidence`}
                </div>
              )}
          </div>
          <p className="text-slate-400 italic text-lg leading-relaxed">
            {data.etymology?.notes || "A neologism found within Gurdjieff's cosmic hierarchy."}
          </p>
        </div>

        <button
          onClick={() => navigate('/query', { state: { initialQuestion: `What is the significance of the word ${data.word}?` } })}
          className="px-6 py-3 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold-muted transition-colors flex items-center gap-2 shadow-lg shadow-brand-gold/10"
        >
          <Search size={18} />
          Ask about this word
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Etymology Column */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Globe size={16} /> Etymological Breakdown
          </h3>
          <div className="space-y-4">
            {data.etymology?.roots?.map((root, i) => (
              <div key={i} className="scholar-card border-l-2 border-l-brand-gold/30 hover:border-l-brand-gold transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl font-mono text-brand-gold">{root.morpheme}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider",
                    languageColors[root.language] || "border-white/20 text-white/40"
                  )}>
                    {root.language}
                  </span>
                </div>
                <div className="text-sm text-slate-300 font-medium">{root.meaning}</div>
              </div>
            ))}
            {!data.etymology?.roots && <div className="text-slate-500 italic">No root breakdown available.</div>}
          </div>
        </div>

        {/* Frequency & Passages Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock size={16} /> Frequency over Narrative
            </h3>
            <div className="h-48 w-full scholar-card p-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.frequency}>
                  <defs>
                    <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffbf00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffbf00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="page_number" hide />
                  <YAxis hide domain={[0, 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#16161a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    labelFormatter={(label) => `Page ${label}`}
                  />
                  <Area type="monotone" dataKey="count" stroke="#ffbf00" fillOpacity={1} fill="url(#colorFreq)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <BookOpen size={16} /> Literary Context
            </h3>
            <div className="space-y-4">
              {data.passages.map((p, i) => (
                <div key={i} className="scholar-card relative group">
                  <div className="absolute top-4 right-4 text-[10px] text-slate-500 font-bold uppercase">PAGE {p.page_number}</div>
                  <blockquote className="text-slate-300 leading-relaxed pr-12 italic">
                    "{p.text}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDetail;
