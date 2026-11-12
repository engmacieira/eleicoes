import React, { useState } from 'react';
import { Copy, Check, Download, Zap, TrendingUp, Search, Database } from 'lucide-react';
import { FULL_INDEXES_SCRIPT } from '../utils/sqlGenerator';

export const IndexesViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_INDEXES_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([FULL_INDEXES_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '02_indexes_eleicoes.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const indexStrategy = [
    {
      title: 'idx_candidatos_eleicao_titulo',
      table: 'candidatos_eleicao',
      columns: '(titulo_eleitor)',
      type: 'B-Tree (FK Lookup)',
      justification:
        'Crucial para reconstruir a linha do tempo do político através dos anos (2000 a 2024). Evita Seq Scan na tabela fato ao buscar por indivíduo.',
      impact: 'Redução de O(N) para O(log N) em consultas de histórico pessoal.',
      icon: Search,
    },
    {
      title: 'idx_eleicao_ano',
      table: 'eleicao',
      columns: '(ano)',
      type: 'B-Tree (Unique / Range)',
      justification:
        'Acelera buscas por pleito específico (ex: WHERE ano = 2024) ou filtros de intervalos temporais.',
      impact: 'Acesso pontual instantâneo (Index Scan).',
      icon: Zap,
    },
    {
      title: 'idx_candidatos_eleicao_ranking',
      table: 'candidatos_eleicao',
      columns: '(id_eleicao, cargo, votos DESC)',
      type: 'Composite B-Tree (Order Optimization)',
      justification:
        'Elimina o custo de "Sort" em memória para apuração de eleitos ("ORDER BY votos DESC"). O Postgres realiza Index Scan direto na ordem correta.',
      impact: 'Zero custo de SORT no EXPLAIN ANALYZE para painéis de apuração.',
      icon: TrendingUp,
    },
    {
      title: 'idx_candidatos_eleicao_pleito_cargo',
      table: 'candidatos_eleicao',
      columns: '(id_eleicao, cargo)',
      type: 'Composite B-Tree',
      justification:
        'Permite filtrar rapidamente todos os concorrentes a Vereador ou Prefeito em uma eleição específica.',
      impact: 'Base para relatórios segmentados por cargo.',
      icon: Database,
    },
    {
      title: 'idx_partidos_sigla',
      table: 'partidos',
      columns: '(sigla)',
      type: 'B-Tree (Unique)',
      justification:
        'Garante unicidade e acelera a resolução de chaves durante processos de carga (ETL com UPSERT ON CONFLICT).',
      impact: 'Evita duplicação de legendas como MDB, PSDB, PT.',
      icon: Search,
    },
    {
      title: 'idx_candidatos_eleicao_partido',
      table: 'candidatos_eleicao',
      columns: '(id_partido)',
      type: 'B-Tree (FK Reverse)',
      justification:
        'No PostgreSQL, chaves estrangeiras não criam índices automáticos na tabela filha. Este índice evita Sequential Scan ao fazer JOIN com partidos.',
      impact: 'Evita Table Scan ao agregar votos da bancada partidária.',
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Estratégia de Indexação & Otimização de Performance
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Índices B-Tree compostos e simples desenhados especificamente para a carga analítica eleitoral e planos de execução otimizados no PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Índices'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .sql</span>
            </button>
          </div>
        </div>

        {/* DBA Tip Card */}
        <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <strong className="text-emerald-950 font-bold">Nota de DBA Especialista em Cloud SQL:</strong> O PostgreSQL <em>não</em> cria automaticamente índices em colunas que possuem Foreign Keys (apenas na Primary Key referenciada). Por isso, criamos explicitamente índices em <code>candidatos_eleicao(titulo_eleitor)</code> e <code>candidatos_eleicao(id_partido)</code> para prevenir bloqueios de tabela e Sequential Scans em operações de <code>JOIN</code> e <code>DELETE/UPDATE CASCADE</code>.
        </div>
      </div>

      {/* Index Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indexStrategy.map((idx, i) => {
          const Icon = idx.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 truncate max-w-[170px]" title={idx.title}>
                      {idx.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {idx.type}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 mt-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Tabela Alvo:</span>
                    <span className="font-mono text-slate-800 font-bold">{idx.table}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Colunas:</span>
                    <span className="font-mono text-blue-700 font-semibold">{idx.columns}</span>
                  </div>
                  <p className="text-slate-600 text-xs pt-2 border-t border-slate-100 leading-relaxed">
                    {idx.justification}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{idx.impact}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SQL Script Viewer */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-700">02_indexes_eleicoes.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[400px] scrollbar-dark">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {FULL_INDEXES_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
