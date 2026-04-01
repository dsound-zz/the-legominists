import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface WordStat {
  word: string;
  count: number;
  primary_language: string;
  pages: number;
}

const languageColors: Record<string, string> = {
  Greek: 'border-blue-500 text-blue-400 bg-blue-500/10',
  Armenian: 'border-red-500 text-red-400 bg-red-500/10',
  Arabic: 'border-green-500 text-green-400 bg-green-500/10',
  Turkish: 'border-orange-500 text-orange-400 bg-orange-500/10',
  Sanskrit: 'border-purple-500 text-purple-400 bg-purple-500/10',
  Persian: 'border-teal-500 text-teal-400 bg-teal-500/10',
  Mixed: 'border-slate-500 text-slate-400 bg-slate-500/10',
};

const LexiconList: React.FC = () => {
  const [words, setWords] = useState<WordStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof WordStat>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/lexicon')
      .then(res => {
        setWords(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch lexicon:", err);
        setLoading(false);
      });
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

  if (loading) return <div className="text-slate-500">Unearthing the sacred lexicon...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Lexicon Index</h2>
          <p className="text-slate-400">Total {words.length} neologisms extracted from the tales.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search words..."
            className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="scholar-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 cursor-pointer hover:text-slate-300" onClick={() => handleSort('word')}>
                Word {sortKey === 'word' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-slate-300" onClick={() => handleSort('count')}>
                Frequency {sortKey === 'count' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-slate-300" onClick={() => handleSort('pages')}>
                Page Breadth {sortKey === 'pages' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
              </th>
              <th className="px-6 py-4">Primary Language</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredWords.map((w) => (
              <tr key={w.word} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-mono text-brand-gold font-medium">{w.word}</td>
                <td className="px-6 py-4 text-slate-300">{w.count}</td>
                <td className="px-6 py-4 text-slate-400">{w.pages} pages</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
                    languageColors[w.primary_language] || languageColors.Mixed
                  )}>
                    {w.primary_language}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/word/${w.word}`)}
                    className="flex items-center gap-1.5 text-xs text-brand-gold/60 hover:text-brand-gold transition-colors font-medium border border-brand-gold/10 hover:border-brand-gold/40 px-3 py-1.5 rounded"
                  >
                    Details <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredWords.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No neologisms found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};

export default LexiconList;
