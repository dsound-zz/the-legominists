import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface WordStat {
  word: string;
  count: number;
  primary_language: string;
  languages: string[];
  pages: number;
}

const languageColors: Record<string, { bg: string; text: string; border: string }> = {
  English:  { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Greek:    { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Armenian: { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
  Sanskrit: { bg: '#FFF1F2', text: '#881337', border: '#FECDD3' },
  Arabic:   { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Latin:    { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE' },
  Turkish:  { bg: '#FEF9F0', text: '#78350F', border: '#FDE68A' },
  Persian:  { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
  Russian:  { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  Mixed:    { bg: '#F9F9F8', text: '#6b7280', border: '#E5E5E5' },
};

const LexiconList: React.FC = () => {
  const [words, setWords] = useState<WordStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof WordStat>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/lexicon')
      .then(res => { setWords(res.data); setLoading(false); })
      .catch(err => { console.error("Failed to fetch lexicon:", err); setLoading(false); });
  }, []);

  const handleSort = (key: keyof WordStat) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredWords = words
    .filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (a[sortKey] < b[sortKey]) comparison = -1;
      if (a[sortKey] > b[sortKey]) comparison = 1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  if (loading) return <div style={{ color: '#6b7280' }}>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display">Lexicon Index</h2>
          <p className="mt-1" style={{ color: '#6b7280' }}>
            {words.length} neologisms extracted from the tales.
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search words..."
            className="w-full bg-linen rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2"
            style={{
              fontSize: '17px',
              fontWeight: 400,
              border: '1px solid #E5E5E5',
              color: '#1a1a1a',
              '--tw-ring-color': '#CCCCCC',
            } as React.CSSProperties}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="scholar-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E5E5', color: '#6b7280', fontSize: '17px', fontWeight: 400 }}>
              <th
                className="px-6 py-4 cursor-pointer transition-colors"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                onClick={() => handleSort('word')}
              >
                Word {sortKey === 'word' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th
                className="px-6 py-4 cursor-pointer transition-colors"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                onClick={() => handleSort('count')}
              >
                Frequency {sortKey === 'count' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th
                className="px-6 py-4 cursor-pointer transition-colors"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                onClick={() => handleSort('pages')}
              >
                Page Breadth {sortKey === 'pages' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th className="px-6 py-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Language</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filteredWords.map((w) => {
              return (
                <tr
                  key={w.word}
                  style={{ borderBottom: '1px solid #E5E5E5', fontSize: '17px', fontWeight: 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <td className="px-6 py-4 font-display" style={{ fontSize: '24px', fontWeight: 400, color: '#6B3E1A' }}>
                    {w.word}
                  </td>
                  <td className="px-6 py-4" style={{ color: '#6b7280' }}>{w.count}</td>
                  <td className="px-6 py-4" style={{ color: '#6b7280' }}>{w.pages} pages</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(w.languages?.length ? w.languages : [w.primary_language]).map((lang) => {
                        const c = languageColors[lang] || languageColors.Mixed;
                        return (
                          <span
                            key={lang}
                            className="rounded-full border"
                            style={{
                              fontSize: '11px',
                              padding: '3px 10px',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              backgroundColor: c.bg,
                              color: c.text,
                              borderColor: c.border,
                            }}
                          >
                            {lang}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/word/${w.word}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
                      style={{ fontSize: '17px', border: '1px solid #E5E5E5', color: '#6b7280', backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0F0EF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Details <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredWords.length === 0 && (
          <div className="p-12 text-center" style={{ fontSize: '17px', color: '#6b7280' }}>
            No neologisms found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};

export default LexiconList;
