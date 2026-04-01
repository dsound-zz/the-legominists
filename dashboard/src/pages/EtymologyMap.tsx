import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Globe, Info, Languages } from 'lucide-react';

interface LanguageStat {
  name: string;
  value: number;
}

const COLORS = [
  '#3b82f6', // Greek - Blue
  '#ef4444', // Armenian - Red
  '#22c55e', // Arabic - Green
  '#f97316', // Turkish - Orange
  '#a855f7', // Sanskrit - Purple
  '#14b8a6', // Persian - Teal
  '#64748b', // Mixed/Other - Slate
];

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
      .catch(err => {
        console.error("Failed to fetch etymology stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-slate-500 italic">Mapping root languages...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white tracking-tight">Etymology Distribution</h2>
        <p className="text-slate-400 max-w-2xl mx-auto italic">
          Gurdjieff's neologisms are composite structures, blending ancient root languages to form new meaning-resonances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
        <div className="h-80 scholar-card p-0 flex items-center justify-center bg-transparent border-none shadow-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                stroke="rgba(255,255,255,0.05)"
              >
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#16161a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Languages size={14} /> Root Frequency
          </h3>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 scholar-card hover:border-white/10 transition-all border-l-4" style={{ borderLeftColor: COLORS[i % COLORS.length] }}>
                <span className="font-medium text-slate-300">{s.name}</span>
                <div className="flex items-center gap-4">
                   <div className="text-xs text-slate-500">{Math.round((s.value / stats.reduce((a,b)=>a+b.value, 0)) * 100)}%</div>
                   <span className="text-xl font-bold text-white">{s.value} <span className="text-[10px] text-slate-600 font-normal">words</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scholar-card border-brand-gold/10 bg-brand-gold/[0.02] p-6 mt-12 flex items-start gap-4">
        <Info className="text-brand-gold mt-1 shrink-0" size={20} />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-brand-gold uppercase tracking-widest">About the Extraction</h4>
          <p className="text-sm text-slate-400 leading-relaxed italic">
            The etymological roots shown here are determined by Gemini using morpheme analysis across the entire lexicon.
            Most neologisms are "mixed," utilizing roots from multiple overlapping language families (e.g., Indo-European, Semitic, Turkic). 
            The chart represents the <span className="text-slate-200">dominant</span> root language for each term.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EtymologyMap;
