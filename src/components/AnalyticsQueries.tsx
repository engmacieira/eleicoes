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
      title: '1. TOP 10 Candidatos com Mais Mandatos Conquistados (2000-2024)',
      description: 'Identifica as maiores lideranças políticas do município cruzando todas as eleições através do Título de Eleitor único.',
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
      title: '5. Candidatos que Trocaram de Sigla Partidária (Migração Partidária)',
      description: 'Descobre a volatilidade partidária de pessoas físicas que disputaram mais de uma eleição por partidos distintos.',
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
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-900">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Consultas Analíticas & Views para Relatórios e BI
            </h2>
            <p className="text-sm text-slate-400">
              Coleção de queries SQL profissionais otimizadas pelos índices criados, prontas para extrair inteligência política dos dados.
            </p>
          </div>
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-4">
        {queries.map((q) => (
          <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span>{q.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
              </div>
              <button
                onClick={() => copyQuery(q.sql, q.id)}
                className="self-start sm:self-center inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
              >
                {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === q.id ? 'Copiado!' : 'Copiar Query'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 overflow-x-auto">
              <pre className="font-mono text-xs text-blue-300/90 leading-relaxed">
                {q.sql}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Pre-built Views Script Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Views Materializadas / Lógicas no Banco de Dados</h3>
          </div>
          <button
            onClick={() => copyQuery(ANALYTICS_VIEWS_SCRIPT, 'views')}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            {copiedId === 'views' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'views' ? 'Copiado!' : 'Copiar Views'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[350px] scrollbar-thin">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {ANALYTICS_VIEWS_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
