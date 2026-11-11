import React, { useState } from 'react';
import { Copy, Check, Download, AlertCircle, Key, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { FULL_DDL_SCRIPT, SCHEMA_TABLES } from '../utils/sqlGenerator';

export const DdlViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_DDL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([FULL_DDL_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '01_schema_eleicoes_ddl.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Architectural Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Script DDL Completo (PostgreSQL / Google Cloud SQL)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Modelagem relacional normalizada (3FN) das 6 tabelas com tipos nativos do PostgreSQL, integridade referencial estrita e ordem determinística de execução.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar DDL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar .sql</span>
            </button>
          </div>
        </div>

        {/* Execution Order Card */}
        <div className="mt-5 p-4 rounded-lg bg-blue-950/40 border border-blue-900/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-200 space-y-1">
              <p className="font-semibold text-blue-300">
                Ordem Rigorosa de Criação das Tabelas para evitar erro de Foreign Key:
              </p>
              <p className="text-slate-300">
                1. <strong className="text-white">dados_candidato</strong> (Pessoa Física - PK Título de Eleitor) ➔ 
                2. <strong className="text-white">eleicao</strong> (Ano/Pleito) ➔ 
                3. <strong className="text-white">partidos</strong> (Catálogo Único de Siglas) ➔ 
                4. <strong className="text-white">detalhes_votacao</strong> (Depende de <em>eleicao</em>) ➔ 
                5. <strong className="text-white">partidos_eleicao</strong> (Depende de <em>eleicao</em> e <em>partidos</em>) ➔ 
                6. <strong className="text-white">candidatos_eleicao</strong> (Depende de <em>dados_candidato</em>, <em>eleicao</em> e <em>partidos</em>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Detalhamento das 6 Tabelas e Constraints</h3>
          <div className="flex gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedTable('all')}
              className={`px-2.5 py-1 rounded transition ${
                selectedTable === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas (6)
            </button>
            {SCHEMA_TABLES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.id)}
                className={`px-2.5 py-1 rounded font-mono transition ${
                  selectedTable === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCHEMA_TABLES.filter((t) => selectedTable === 'all' || selectedTable === t.id).map((table, idx) => (
            <div
              key={table.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition"
            >
              <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="font-mono font-bold text-white text-sm">{table.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{table.description}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  table.category === 'fato' 
                    ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                    : table.category === 'dimensao'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {table.category}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="text-slate-400 font-medium mb-1">Colunas Principais:</div>
                <div className="space-y-1.5">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-950/50 border border-slate-800/60"
                    >
                      <div className="flex items-center gap-1.5 font-mono">
                        {col.isPk && (
                          <span title="Primary Key" className="text-amber-400">
                            <Key className="w-3 h-3" />
                          </span>
                        )}
                        {col.isFk && (
                          <span title={`Foreign Key ➔ ${col.fkTarget}`} className="text-sky-400">
                            <LinkIcon className="w-3 h-3" />
                          </span>
                        )}
                        <span className={col.isPk ? 'text-amber-200 font-semibold' : 'text-slate-200'}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{col.type}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Constraints Notáveis:</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                    {table.constraints.slice(0, 2).map((c, i) => (
                      <li key={i} className="truncate font-mono text-slate-400" title={c}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Box with Syntax Styling */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs font-mono text-slate-400 ml-2">01_schema_eleicoes_ddl.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px] scrollbar-thin">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {FULL_DDL_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
