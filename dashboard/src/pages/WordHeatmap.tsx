import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeatmapData {
  words: string[];
  pages: string[];
  matrix: number[][];
}

function getHeatmapColor(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio === 0)  return 'var(--heatmap-0)';
  if (ratio < 0.2)  return 'var(--heatmap-1)';
  if (ratio < 0.4)  return 'var(--heatmap-2)';
  if (ratio < 0.6)  return 'var(--heatmap-3)';
  if (ratio < 0.8)  return 'var(--heatmap-4)';
  return                   'var(--heatmap-5)';
}

const WordHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ word: string; page: string; count: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/heatmap')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { console.error("Failed to fetch heatmap:", err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: '#6b7280' }}>Loading...</div>;
  if (!data) return <div>Error loading data.</div>;

  const maxCount = Math.max(...data.matrix.flat(), 1);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display">Frequency Heatmap</h2>
          <p className="mt-1 text-sm md:text-base" style={{ color: '#6b7280' }}>
            Occurrence distribution of the top 30 neologisms across 50-page buckets.
          </p>
        </div>
        <div className="flex gap-2 items-center text-sm md:text-[17px]" style={{ color: '#6b7280' }}>
          Low
          <div className="w-16 h-2 rounded-full overflow-hidden flex">
            <div className="w-1/5" style={{ backgroundColor: 'var(--heatmap-0)' }} />
            <div className="w-1/5" style={{ backgroundColor: 'var(--heatmap-1)' }} />
            <div className="w-1/5" style={{ backgroundColor: 'var(--heatmap-2)' }} />
            <div className="w-1/5" style={{ backgroundColor: 'var(--heatmap-3)' }} />
            <div className="w-1/5" style={{ backgroundColor: 'var(--heatmap-5)' }} />
          </div>
          High
        </div>
      </div>

      <div className="scholar-card relative overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="border-collapse min-w-[800px] md:w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '160px' }} className="md:w-[200px]" />
              {data.pages.map((_, i) => <col key={i} />)}
            </colgroup>
            <thead>
              <tr>
                <th
                  className="p-2 text-left sticky left-0 z-20 text-xs md:text-[17px]"
                  style={{
                    fontWeight: 400,
                    color: '#6b7280',
                    backgroundColor: '#F9F9F8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  NEOLOGISM
                </th>
                {data.pages.map((p, i) => (
                  <th
                    key={i}
                    className="p-0"
                    style={{ height: '110px', position: 'relative', verticalAlign: 'bottom' }}
                  >
                    <div 
                      className="text-[11px] md:text-[13px]"
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '50%',
                        fontWeight: 400,
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        transform: 'rotate(-45deg)',
                        transformOrigin: 'left bottom',
                      }}
                    >
                      {p}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.words.map((word, wordIdx) => (
                <tr key={wordIdx}>
                  <td
                    className="p-2 font-display cursor-pointer sticky left-0 z-10 text-base md:text-[20px]"
                    style={{
                      fontWeight: 400,
                      color: '#1a1a1a',
                      backgroundColor: '#F9F9F8',
                      borderRight: '1px solid #E5E5E5',
                    }}
                    onClick={() => navigate(`/word/${word}`)}
                  >
                    {word}
                  </td>
                  {data.matrix[wordIdx].map((count, bucketIdx) => (
                    <td
                      key={bucketIdx}
                      className="p-0"
                      style={{ border: '1px solid #FFFFFF' }}
                      onMouseEnter={() => setHoveredCell({ word, page: data.pages[bucketIdx], count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <motion.div
                        initial={false}
                        animate={{ backgroundColor: getHeatmapColor(count, maxCount) }}
                        className="cursor-help"
                        style={{ borderRadius: '3px', width: '100%', height: '32px' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoveredCell && (
          <div
            className="fixed bottom-20 right-4 md:bottom-10 md:right-10 p-3 rounded shadow-lg z-50 pointer-events-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
          >
            <div className="text-xs md:text-[17px]" style={{ color: '#6b7280' }}>Word</div>
            <div className="font-display text-base md:text-[17px]" style={{ color: '#6B3E1A' }}>{hoveredCell.word}</div>
            <div className="text-xs md:text-[17px]" style={{ color: '#6b7280', marginTop: '4px' }}>Pages {hoveredCell.page}</div>
            <div className="font-display text-base md:text-[17px]" style={{ color: '#1a1a1a' }}>
              {hoveredCell.count} <span style={{ color: '#6b7280' }}>occurrences</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordHeatmap;
