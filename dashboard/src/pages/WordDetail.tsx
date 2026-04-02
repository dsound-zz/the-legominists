import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, BookOpen, Clock, Globe, Info, MessageSquare, Search } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface WordDetailData {
  word: string;
  etymology: {
    word: string;
    roots: { morpheme: string; language: string; meaning: string }[];
    confidence: string | number;
    notes: string;
  };
  definition: {
    word: string;
    definition: string;
    role: string;
    key_quotes: { text: string; page_number: number }[];
  };
  frequency: { page_number: number; count: number }[];
  passages: { text: string; page_number: number; distance: number }[];
  total_count: number;
}

const languageColors: Record<string, { bg: string; text: string; border: string }> = {
  English: { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Greek: { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Armenian: { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
  Sanskrit: { bg: '#FFF1F2', text: '#881337', border: '#FECDD3' },
  Arabic: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Latin: { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE' },
  Turkish: { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Persian: { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
};

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h3
    className="flex items-center gap-2"
    style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}
  >
    {icon} {children}
  </h3>
);

const WordDetail: React.FC = () => {
  const { word } = useParams<{ word: string }>();
  const [data, setData] = useState<WordDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (word) {
      setLoading(true);
      api.get(`/api/word/${word}`)
        .then(res => { setData(res.data); setLoading(false); })
        .catch(err => { console.error("Failed to fetch word details:", err); setLoading(false); });
    }
  }, [word]);

  if (loading) return <div style={{ color: '#6b7280' }}>Loading...</div>;
  if (!data) return <div>Word not found.</div>;

  const quotes = data.definition?.key_quotes?.length ? data.definition.key_quotes : data.passages;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 transition-colors"
        style={{ fontSize: '17px', color: '#6b7280' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
      >
        <ArrowLeft size={15} />
        Back to Lexicon
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-5xl font-display lowercase" style={{ color: '#6B3E1A' }}>
            {data.word}
          </h2>
          <p className="mt-1" style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {data.definition?.role || 'Neologism'}
          </p>
          <div className="flex gap-3 mt-3">
            <span
              className="rounded"
              style={{ fontSize: '17px', fontWeight: 400, padding: '4px 10px', backgroundColor: '#F9F9F8', border: '1px solid #E5E5E5', color: '#6b7280' }}
            >
              <Clock size={11} className="inline mr-1" />{data.total_count} occurrences
            </span>
            <span
              className="rounded"
              style={{ fontSize: '17px', fontWeight: 400, padding: '4px 10px', backgroundColor: '#F9F9F8', border: '1px solid #E5E5E5', color: '#6b7280' }}
            >
              <Globe size={11} className="inline mr-1" />{data.frequency.length} pages
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/query', { state: { initialQuestion: `What is the significance of the word ${data.word}?` } })}
          className="flex items-center gap-2 px-4 py-2 rounded transition-opacity hover:opacity-80 whitespace-nowrap shrink-0"
          style={{ fontSize: '17px', fontWeight: 400, backgroundColor: '#6B3E1A', color: '#FFFFFF' }}
        >
          <Search size={17} />
          Ask about this word
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main */}
        <div className="lg:col-span-8 space-y-8">

          {/* Definition */}
          <div className="space-y-3">
            <SectionLabel icon={<BookOpen size={13} />}>Definition</SectionLabel>
            <div
              className="p-5 rounded-lg"
              style={{ border: '1px solid #E5E5E5', borderLeftWidth: '2px', borderLeftColor: '#6B3E1A', backgroundColor: '#F9F9F8' }}
            >
              <p style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a', lineHeight: 1.7 }}>
                {data.definition?.definition || 'Description loading from text analysis...'}
              </p>
            </div>
          </div>

          {/* Passages */}
          <div className="space-y-3">
            <SectionLabel icon={<MessageSquare size={13} />}>Key Passages</SectionLabel>
            <div className="space-y-3">
              {quotes?.map((q, i) => (
                <div key={i} className="relative p-4 rounded-lg" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
                  <div style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', marginBottom: '6px' }}>
                    Page {q.page_number}
                  </div>
                  <blockquote style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a', lineHeight: 1.7 }}>
                    "{q.text}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>

          {/* Frequency Chart */}
          <div className="space-y-3">
            <SectionLabel icon={<Clock size={13} />}>Frequency over Narrative</SectionLabel>
            <div className="h-40 w-full rounded-lg overflow-hidden" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.frequency}>
                  <defs>
                    <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B3E1A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6B3E1A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="page_number" hide />
                  <YAxis hide domain={[0, 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', color: '#1a1a1a', fontSize: '17px', fontFamily: 'inherit' }}
                    labelFormatter={(label) => `Page ${label}`}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6B3E1A" fillOpacity={1} fill="url(#colorFreq)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar: Etymology */}
        <div className="lg:col-span-4 space-y-4">
          <SectionLabel icon={<Globe size={13} />}>Linguistic Roots</SectionLabel>
          <div className="space-y-3">
            {data.etymology?.roots?.map((root, i) => {
              const colors = languageColors[root.language];
              return (
                <div key={i} className="p-4 rounded-lg" style={{ border: '1px solid #E5E5E5', backgroundColor: '#F9F9F8' }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-display" style={{ fontSize: '18px', fontWeight: 400, color: '#6B3E1A' }}>{root.morpheme}</span>
                    <span
                      className="rounded-full"
                      style={{
                        fontSize: '13px',
                        padding: '2px 8px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        backgroundColor: colors?.bg ?? '#F9F9F8',
                        color: colors?.text ?? '#6b7280',
                        border: `1px solid ${colors?.border ?? '#E5E5E5'}`,
                      }}
                    >
                      {root.language}
                    </span>
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280' }}>{root.meaning}</div>
                </div>
              );
            })}
            {data.etymology?.notes && (
              <p style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', paddingTop: '12px', borderTop: '1px solid #E5E5E5' }}>
                {data.etymology.notes}
              </p>
            )}
            {!data.etymology?.roots && (
              <div style={{ fontSize: '17px', color: '#6b7280' }}>No root breakdown available.</div>
            )}
          </div>

          {data.etymology?.confidence && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{
                fontSize: '17px',
                fontWeight: 400,
                border: '1px solid #E5E5E5',
                ...(data.etymology.confidence === 'high' || (typeof data.etymology.confidence === 'number' && data.etymology.confidence >= 0.8)
                  ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#14532D' }
                  : data.etymology.confidence === 'low' || (typeof data.etymology.confidence === 'number' && data.etymology.confidence < 0.4)
                    ? { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#881337' }
                    : { backgroundColor: '#F9F9F8', color: '#6b7280' })
              }}
            >
              <Info size={13} />
              {typeof data.etymology.confidence === 'number'
                ? `${Math.round(data.etymology.confidence * 100)}% confidence`
                : `${data.etymology.confidence.charAt(0).toUpperCase() + data.etymology.confidence.slice(1)} confidence`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordDetail;
