import React, { useState } from 'react';
import { SCHEMA_TABLES } from '../utils/sqlGenerator';
import { Key, Link as LinkIcon, ArrowRight, Layers, Info } from 'lucide-react';

export const SchemaDiagram: React.FC = () => {
  const [highlightedTable, setHighlightedTable] = useState<string | null>(null);

  const relationships = [
    { from: 'detalhes_votacao', fromCol: 'id_eleicao', to: 'eleicao', toCol: 'id', type: '1:N', label: 'Estatísticas do pleito' },
    { from: 'partidos_eleicao', fromCol: 'id_eleicao', to: 'eleicao', toCol: 'id', type: '1:N', label: 'Bancada no pleito' },
    { from: 'partidos_eleicao', fromCol: 'id_partido', to: 'partidos', toCol: 'id', type: '1:N', label: 'Legenda partidária' },
    { from: 'candidatos_eleicao', fromCol: 'titulo_eleitor', to: 'dados_candidato', toCol: 'titulo_eleitor', type: '1:N', label: 'Pessoa física participante' },
    { from: 'candidatos_eleicao', fromCol: 'id_eleicao', to: 'eleicao', toCol: 'id', type: '1:N', label: 'Ano do pleito concorrido' },
    { from: 'candidatos_eleicao', fromCol: 'id_partido', to: 'partidos', toCol: 'id', type: '1:N', label: 'Partido da disputa' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>Diagrama Entidade-Relacionamento (ER) Conceitual & Físico</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Visualização gráfica das 6 tabelas, chaves primárias (PK), chaves estrangeiras (FK) e integridade referencial.
          Passe o mouse ou clique em uma tabela para filtrar seus relacionamentos ativos.
        </p>

        {/* Relationship Summary Badges */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {relationships.map((rel, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg border transition ${
                highlightedTable === rel.from || highlightedTable === rel.to
                  ? 'bg-blue-900/40 border-blue-500 text-blue-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-mono text-white font-semibold">{rel.from}</span>
              <span className="text-blue-400 mx-1.5 font-bold">➔</span>
              <span className="font-mono text-white font-semibold">{rel.to}</span>
              <span className="ml-2 text-[10px] text-slate-400 font-mono">({rel.fromCol} = {rel.toCol})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Canvas of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCHEMA_TABLES.map((table) => {
          const isHighlighted = highlightedTable === table.id;
          const isRelated =
            highlightedTable &&
            relationships.some(
              (r) =>
                (r.from === highlightedTable && r.to === table.id) ||
                (r.to === highlightedTable && r.from === table.id)
            );

          return (
            <div
              key={table.id}
              onMouseEnter={() => setHighlightedTable(table.id)}
              onMouseLeave={() => setHighlightedTable(null)}
              className={`bg-slate-900 rounded-xl border transition-all duration-200 shadow-md flex flex-col ${
                isHighlighted
                  ? 'border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/30'
                  : isRelated
                  ? 'border-sky-500/60 bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      table.category === 'fato'
                        ? 'bg-purple-500'
                        : table.category === 'dimensao'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="font-mono font-bold text-white text-sm">{table.name}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {table.category}
                </span>
              </div>

              {/* Columns */}
              <div className="p-3 flex-1 space-y-1 text-xs font-mono">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center space-x-1.5">
                      {col.isPk ? (
                        <span title="Primary Key"><Key className="w-3.5 h-3.5 text-amber-400 shrink-0" /></span>
                      ) : col.isFk ? (
                        <span title={`Foreign Key: ${col.fkTarget}`}><LinkIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" /></span>
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                      <span className={col.isPk ? 'text-amber-300 font-semibold' : col.isFk ? 'text-sky-300' : 'text-slate-300'}>
                        {col.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={col.type}>
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Relationship tags */}
              <div className="p-2.5 bg-slate-950/70 border-t border-slate-800/80 rounded-b-xl text-[11px] text-slate-400">
                {table.columns.filter((c) => c.isFk).length > 0 ? (
                  <div className="flex items-center gap-1 text-sky-400 font-medium">
                    <ArrowRight className="w-3 h-3" />
                    <span>
                      FKs: {table.columns.filter((c) => c.isFk).map((c) => c.fkTarget?.split('(')[0]).join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-medium">
                    <span>Dimensão Raiz (Tabela Independente)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Integrity Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-3">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Regras de Integridade e Modelagem Relacional (3FN):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400">
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <strong className="text-white block mb-1">1. Título de Eleitor como PK Única</strong>
            Pessoa física modelada uma única vez em <code>dados_candidato</code>. O mesmo indivíduo pode disputar múltiplos pleitos (2000 a 2024) com números e partidos diferentes sem duplicar seus dados civis.
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <strong className="text-white block mb-1">2. Isolamento de Siglas Partidárias</strong>
            A tabela <code>partidos</code> centraliza siglas e evita inconsistências textuais (ex: variações de "MDB" vs "PMDB" ou "PFL" vs "DEM").
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <strong className="text-white block mb-1">3. Integridade das Urnas</strong>
            A constraint <code>UNIQUE(id_eleicao, cargo)</code> em <code>detalhes_votacao</code> impede que o mesmo pleito registre dois balanços conflitantes para o mesmo cargo.
          </div>
        </div>
      </div>
    </div>
  );
};
