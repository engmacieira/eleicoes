import React, { useState } from 'react';
import { Copy, Check, BarChart3, Database, Play, Sparkles } from 'lucide-react';
import { ANALYTICS_VIEWS_SCRIPT } from '../utils/sqlGenerator';

export const AnalyticsQueries: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyQuery = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const queries = [
    {
      id: 'q1',
      title: '1. TOP 10 Políticos com Mais Mandatos Conquistados (2000–2024)',
      description: 'Identifica as maiores lideranças municipais cruzando todas as eleições através do Título de Eleitor único.',
      sql: `SELECT 
    dc.nome_completo,
    dc.titulo_eleitor,
    COUNT(ce.id) AS total_eleicoes_disputadas,
    COUNT(CASE WHEN ce.situacao ILIKE 'Eleito%' THEN 1 END) AS total_mandatos,
    SUM(ce.votos) AS total_votos_acumulados,
    STRING_AGG(DISTINCT p.sigla, ', ' ORDER BY p.sigla) AS partidos_disputados
FROM dados_candidato dc
JOIN candidatos_eleicao ce ON ce.titulo_eleitor = dc.titulo_eleitor
JOIN partidos p ON p.id = ce.id_partido
GROUP BY dc.titulo_eleitor, dc.nome_completo
HAVING COUNT(CASE WHEN ce.situacao ILIKE 'Eleito%' THEN 1 END) >= 2
ORDER BY total_mandatos DESC, total_votos_acumulados DESC
LIMIT 10;`,
    },
    {
      id: 'q2',
      title: '2. Histórico de Prefeitos Eleitos e Votações (24 Anos de Histórico)',
      description: 'Lista cronológica de todos os prefeitos eleitos, percentual de votos válidos e partidos vitoriosos.',
      sql: `SELECT 
    e.ano,
    ce.nome_urna AS prefeito_eleito,
    dc.nome_completo,
    p.sigla AS partido,
    ce.votos AS votos_obtidos,
    ce.situacao
FROM candidatos_eleicao ce
JOIN eleicao e ON e.id = ce.id_eleicao
JOIN partidos p ON p.id = ce.id_partido
JOIN dados_candidato dc ON dc.titulo_eleitor = ce.titulo_eleitor
WHERE ce.cargo = 'Prefeito' 
  AND ce.situacao ILIKE 'Eleito%'
ORDER BY e.ano ASC;`,
    },
    {
      id: 'q3',
      title: '3. Evolução Histórica da Taxa de Abstenção Municipal',
      description: 'Mede o comparecimento e a abstenção nas urnas para vereador e prefeito de 2000 até 2024.',
      sql: `SELECT 
    e.ano,
    dv.cargo,
    dv.aptos AS total_aptos,
    dv.comparecimento,
    ROUND((dv.comparecimento::NUMERIC / NULLIF(dv.aptos, 0)) * 100, 2) AS pct_comparecimento,
    dv.abstencoes,
    ROUND((dv.abstencoes::NUMERIC / NULLIF(dv.aptos, 0)) * 100, 2) AS pct_abstencao,
    dv.brancos,
    dv.nulos
FROM detalhes_votacao dv
JOIN eleicao e ON e.id = dv.id_eleicao
ORDER BY e.ano ASC, dv.cargo;`,
    },
    {
      id: 'q4',
      title: '4. Bancada Partidária na Câmara de Vereadores por Eleição',
      description: 'Mostra quais legendas conquistaram o maior número de cadeiras no legislativo municipal em cada pleito.',
      sql: `SELECT 
    e.ano,
    p.sigla AS partido,
    COUNT(ce.id) AS cadeiras_conquistadas,
    SUM(ce.votos) AS total_votos_nominais
FROM candidatos_eleicao ce
JOIN eleicao e ON e.id = ce.id_eleicao
JOIN partidos p ON p.id = ce.id_partido
WHERE ce.cargo = 'Vereador' 
  AND ce.situacao ILIKE 'Eleito%'
GROUP BY e.ano, p.sigla
ORDER BY e.ano DESC, cadeiras_conquistadas DESC;`,
    },
    {
      id: 'q5',
      title: '5. Políticos que Trocaram de Sigla (Migração Partidária)',
      description: 'Descobre a volatilidade partidária de pessoas físicas que disputaram mais de uma eleição por legendas distintas.',
      sql: `SELECT 
    dc.nome_completo,
    COUNT(DISTINCT ce.id_partido) AS partidos_distintos,
    STRING_AGG(DISTINCT p.sigla, ' ➔ ' ORDER BY p.sigla) AS historico_partidos,
    COUNT(ce.id) AS total_eleicoes
FROM dados_candidato dc
JOIN candidatos_eleicao ce ON ce.titulo_eleitor = dc.titulo_eleitor
JOIN partidos p ON p.id = ce.id_partido
GROUP BY dc.titulo_eleitor, dc.nome_completo
HAVING COUNT(DISTINCT ce.id_partido) > 1
ORDER BY partidos_distintos DESC, total_eleicoes DESC;`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Consultas Analíticas & Views de Inteligência Política
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Queries SQL profissionais otimizadas pelos índices B-Tree, prontas para alimentar dashboards, relatórios e ferramentas de BI.
            </p>
          </div>
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-4">
        {queries.map((q) => (
          <div key={q.id} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>
              </div>
              <button
                onClick={() => copyQuery(q.sql, q.id)}
                className="self-start sm:self-center inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === q.id ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            {/* Dark SQL container */}
            <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto scrollbar-dark">
              <pre className="font-mono text-xs text-sky-300 leading-relaxed">
                {q.sql}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Pre-built Views Script Box */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900">Views Analíticas Predefinidas no PostgreSQL</h4>
          </div>
          <button
            onClick={() => copyQuery(ANALYTICS_VIEWS_SCRIPT, 'views')}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            {copiedId === 'views' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'views' ? 'Copiado!' : 'Copiar Views'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[350px] scrollbar-dark">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {ANALYTICS_VIEWS_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
