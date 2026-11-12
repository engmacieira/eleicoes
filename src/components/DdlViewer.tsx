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
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Script DDL Estrutural (PostgreSQL / Google Cloud SQL)
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Modelagem relacional normalizada (3FN) das 6 tabelas com tipos nativos do PostgreSQL, integridade referencial estrita e ordem determinística de execução.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar DDL'}</span>
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

        {/* Execution Order Card */}
        <div className="mt-4 p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-blue-950">
                Ordem Rigorosa de Criação das Tabelas para evitar erro de Foreign Key:
              </p>
              <p className="text-blue-900/90 leading-relaxed">
                1. <strong>dados_candidato</strong> (Pessoa Física — PK Título de Eleitor) ➔ 
                2. <strong>eleicao</strong> (Ano/Pleito) ➔ 
                3. <strong>partidos</strong> (Catálogo Único de Siglas) ➔ 
                4. <strong>detalhes_votacao</strong> (FK <em>eleicao</em>) ➔ 
                5. <strong>partidos_eleicao</strong> (FKs <em>eleicao</em> e <em>partidos</em>) ➔ 
                6. <strong>candidatos_eleicao</strong> (FKs <em>dados_candidato</em>, <em>eleicao</em> e <em>partidos</em>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900">Detalhamento das 6 Tabelas e Constraints</h4>
          <div className="flex gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedTable('all')}
              className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                selectedTable === 'all'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas (6)
            </button>
            {SCHEMA_TABLES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.id)}
                className={`px-2.5 py-1 rounded font-mono transition cursor-pointer ${
                  selectedTable === t.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 transition shadow-xs"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <h5 className="font-mono font-bold text-slate-900 text-sm">{table.name}</h5>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{table.description}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  table.category === 'fato' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                    : table.category === 'dimensao'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {table.category}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="text-slate-500 font-semibold mb-1">Colunas Principais:</div>
                <div className="space-y-1.5">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/70"
                    >
                      <div className="flex items-center gap-1.5 font-mono">
                        {col.isPk && (
                          <span title="Primary Key" className="text-amber-600">
                            <Key className="w-3 h-3" />
                          </span>
                        )}
                        {col.isFk && (
                          <span title={`Foreign Key ➔ ${col.fkTarget}`} className="text-blue-600">
                            <LinkIcon className="w-3 h-3" />
                          </span>
                        )}
                        <span className={col.isPk ? 'text-amber-800 font-bold' : 'text-slate-800 font-medium'}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{col.type}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Constraints:</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                    {table.constraints.slice(0, 2).map((c, i) => (
                      <li key={i} className="truncate font-mono text-slate-500" title={c}>
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
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-700">01_schema_eleicoes_ddl.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[500px] scrollbar-dark">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {FULL_DDL_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
