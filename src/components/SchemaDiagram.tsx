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
    { from: 'coligacoes', fromCol: 'id_eleicao', to: 'eleicao', toCol: 'id', type: '1:N', label: 'Pleito da coligação' },
    { from: 'coligacao_partidos', fromCol: 'id_coligacao', to: 'coligacoes', toCol: 'id', type: '1:N', label: 'Chapa/Coligação' },
    { from: 'coligacao_partidos', fromCol: 'id_partido', to: 'partidos', toCol: 'id', type: '1:N', label: 'Partido integrante' },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Diagrama Entidade-Relacionamento (ER) Conceitual & Físico</span>
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Visualização gráfica das 8 tabelas relacionais com Soft Delete Universal, chaves primárias (PK), chaves estrangeiras (FK) e integridade referencial.
          Passe o mouse sobre qualquer tabela para destacar seus relacionamentos ativos.
        </p>

        {/* Relationship Summary Badges */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {relationships.map((rel, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg border transition ${
                highlightedTable === rel.from || highlightedTable === rel.to
                  ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-400/30'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="font-mono text-slate-900 font-bold">{rel.from}</span>
              <span className="text-blue-600 mx-1.5 font-bold">➔</span>
              <span className="font-mono text-slate-900 font-bold">{rel.to}</span>
              <span className="ml-2 text-[10px] text-slate-400 font-mono">({rel.fromCol} = {rel.toCol})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Canvas of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              className={`bg-white rounded-xl border transition-all duration-200 shadow-xs flex flex-col ${
                isHighlighted
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : isRelated
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      table.category === 'fato'
                        ? 'bg-purple-600'
                        : table.category === 'dimensao'
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                  />
                  <span className="font-mono font-bold text-slate-900 text-sm">{table.name}</span>
                </div>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  table.category === 'fato'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : table.category === 'dimensao'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {table.category}
                </span>
              </div>

              {/* Columns */}
              <div className="p-3 flex-1 space-y-1 text-xs font-mono">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center space-x-1.5">
                      {col.isPk ? (
                        <span title="Primary Key"><Key className="w-3.5 h-3.5 text-amber-600 shrink-0" /></span>
                      ) : col.isFk ? (
                        <span title={`Foreign Key: ${col.fkTarget}`}><LinkIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" /></span>
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                      <span className={col.isPk ? 'text-amber-800 font-bold' : col.isFk ? 'text-blue-800 font-semibold' : 'text-slate-700'}>
                        {col.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 truncate max-w-[130px]" title={col.type}>
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Relationship tags */}
              <div className="p-2.5 bg-slate-50/70 border-t border-slate-200 rounded-b-xl text-[11px] text-slate-500">
                {table.columns.filter((c) => c.isFk).length > 0 ? (
                  <div className="flex items-center gap-1 text-blue-700 font-medium">
                    <ArrowRight className="w-3 h-3" />
                    <span>
                      FKs: {table.columns.filter((c) => c.isFk).map((c) => c.fkTarget?.split('(')[0]).join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="text-emerald-700 font-medium">
                    <span>Dimensão Raiz (Tabela Independente)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Integrity Rules */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 text-xs text-slate-700 space-y-3 shadow-xs">
        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Regras de Integridade e Modelagem Relacional (3FN):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">1. Título de Eleitor como PK Única</strong>
            Pessoa física modelada uma única vez em <code>dados_candidato</code>. O mesmo indivíduo pode disputar múltiplos pleitos (2000 a 2024) com números e partidos diferentes sem duplicar seus dados civis.
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">2. Isolamento de Siglas Partidárias</strong>
            A tabela <code>partidos</code> centraliza siglas e evita redundâncias textuais (ex: variações de "MDB" vs "PMDB" ou "PFL" vs "DEM").
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">3. Integridade das Urnas</strong>
            A constraint <code>UNIQUE(id_eleicao, cargo)</code> em <code>detalhes_votacao</code> impede que o mesmo pleito registre dois balanços conflitantes para o mesmo cargo.
          </div>
        </div>
      </div>
    </div>
  );
};
