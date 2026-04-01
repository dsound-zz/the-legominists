import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeatmapData {
  words: string[];
  pages: string[];
  matrix: number[][];
}

const WordHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ word: string, page: string, count: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/heatmap')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch heatmap:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse text-slate-500">Calculating cosmic frequencies...</div>;
  if (!data) return <div>Error loading data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-gold to-amber-200 bg-clip-text text-transparent">
            Frequency Heatmap
          </h2>
          <p className="text-slate-400 mt-1">Occurrence distribution of the top 30 neologisms across 50-page buckets.</p>
        </div>
        <div className="flex gap-2 items-center text-xs text-slate-500 uppercase tracking-widest">
          Low <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-brand-gold/20" />
            <div className="w-1/3 bg-brand-gold/60" />
            <div className="w-1/3 bg-brand-gold" />
          </div> High
        </div>
      </div>

      <div className="scholar-card overflow-x-auto relative">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-[10px] font-bold text-slate-500 sticky left-0 bg-bg-card z-20 min-w-[150px]">
                NEOLOGISM
              </th>
              {data.pages.map((p, i) => (
                <th key={i} className="p-2 text-[10px] text-slate-500 font-medium rotate-45 origin-bottom-left whitespace-nowrap h-20">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.words.map((word, wordIdx) => (
              <tr key={wordIdx} className="hover:bg-white/5 transition-colors group">
                <td 
                  className="p-2 text-sm font-mono text-brand-gold/80 group-hover:text-brand-gold cursor-pointer sticky left-0 bg-bg-card z-10 border-r border-white/5"
                  onClick={() => navigate(`/word/${word}`)}
                >
                  {word}
                </td>
                {data.matrix[wordIdx].map((count, bucketIdx) => {
                  const opacity = Math.min(count / 10, 1);
                  return (
                    <td
                      key={bucketIdx}
                      className="p-0 border border-bg-deep"
                      onMouseEnter={() => setHoveredCell({ word, page: data.pages[bucketIdx], count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <motion.div
                        initial={false}
                        animate={{ backgroundColor: `rgba(255, 191, 0, ${opacity * 0.9 + 0.05})` }}
                        className="w-8 h-8 cursor-help transition-all hover:ring-2 hover:ring-brand-gold hover:z-20 relative"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tooltip */}
        {hoveredCell && (
          <div className="fixed bottom-10 right-10 p-4 bg-slate-900/90 backdrop-blur border border-brand-gold/20 rounded shadow-2xl z-50 pointer-events-none">
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Word: <span className="text-brand-gold">{hoveredCell.word}</span></div>
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Pages: <span className="text-white">{hoveredCell.page}</span></div>
            <div className="text-xl font-bold mt-1">{hoveredCell.count} <span className="text-xs font-normal text-slate-400 uppercase">Found</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordHeatmap;
