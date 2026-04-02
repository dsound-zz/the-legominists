import React, { useEffect, useState } from 'react';
import api from '../api/client';

interface LanguageStat {
  name: string;
  value: number;
}

const EtymologyMap: React.FC = () => {
  const [stats, setStats] = useState<LanguageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/lexicon')
      .then(res => {
        const counts: Record<string, number> = {};
        res.data.forEach((w: any) => {
          const lang = w.primary_language || 'Unknown';
          counts[lang] = (counts[lang] || 0) + 1;
        });
        const formatted = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        setStats(formatted);
        setLoading(false);
      })
      .catch(err => { console.error('Failed to fetch etymology stats:', err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: '#6b7280' }}>Loading...</div>;

  const total = stats.reduce((a, b) => a + b.value, 0);
  const max = stats[0]?.value ?? 1;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-display">Etymology Distribution</h2>
        <p className="mt-1" style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280' }}>
          Dominant root language per neologism, extracted by morpheme analysis.
        </p>
      </div>

      <div className="space-y-4">
        {stats.map((s) => (
          <div key={s.name}>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: '17px', fontWeight: 400, color: '#1a1a1a' }}>{s.name}</span>
              <span style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280' }}>
                {s.value} &middot; {Math.round((s.value / total) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#E5E5E5' }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${(s.value / max) * 100}%`, backgroundColor: '#6B3E1A' }}
              />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '17px', fontWeight: 400, color: '#6b7280', paddingTop: '16px', borderTop: '1px solid #E5E5E5' }}>
        Most neologisms blend roots from multiple language families. The bar above shows the <em>dominant</em> root language per term.
      </p>
    </div>
  );
};

export default EtymologyMap;
