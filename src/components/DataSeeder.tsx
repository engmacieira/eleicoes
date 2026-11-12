import React, { useState, useEffect } from 'react';
import { RawElectionDataset } from '../types/election';
import { generateSeedSql } from '../utils/sqlGenerator';
import { Copy, Check, Download, Database, Users, Vote, Calendar, Award } from 'lucide-react';

interface DataSeederProps {
  dataset: RawElectionDataset | null;
}

export const DataSeeder: React.FC<DataSeederProps> = ({ dataset }) => {
  const [copied, setCopied] = useState(false);
  const [seedSql, setSeedSql] = useState<string>('');
  const [selectedPreview, setSelectedPreview] = useState<'sql' | 'json'>('sql');

  useEffect(() => {
    if (dataset) {
      const sql = generateSeedSql(dataset);
      setSeedSql(sql);
    }
  }, [dataset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(seedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([seedSql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '03_seed_eleicoes_braunas.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!dataset) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-500 shadow-xs">
        Carregando dados das eleições...
      </div>
    );
  }

  // Calculate statistics from the real dataset
  const totalCandidatos = Object.keys(dataset.candidatos_base).length;
  const anos = Object.keys(dataset.eleicoes).sort();
  const totalEleicoes = anos.length;
  let totalCandidaturas = 0;
  let totalPartidosSet = new Set<string>();

  anos.forEach((ano) => {
    const el = dataset.eleicoes[ano];
    totalCandidaturas += el.resultados.length;
    el.partidos_vereador.forEach((p) => totalPartidosSet.add(p.partido));
    el.resultados.forEach((r) => totalPartidosSet.add(r.partido));
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                ETL / Pipeline de Carga
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {dataset.municipio.nome} / {dataset.municipio.uf} (TSE: {dataset.municipio.codigo_tse})
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Script de Carga dos Dados Históricos (2000 a 2024)
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Gera declarações <code>INSERT INTO</code> idempotentes com integridade referencial protegida a partir do DTO JSON do TSE.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar INSERTs'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Carga (.sql)</span>
            </button>
          </div>
        </div>

        {/* Dataset Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Pessoas Físicas</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalCandidatos}</div>
            <div className="text-[10px] text-slate-400">dados_candidato</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Pleitos Municipais</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalEleicoes}</div>
            <div className="text-[10px] text-slate-400">2000 até 2024</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <Vote className="w-3.5 h-3.5 text-purple-600" />
              <span>Candidaturas Apuradas</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalCandidaturas}</div>
            <div className="text-[10px] text-slate-400">candidatos_eleicao</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Partidos Identificados</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalPartidosSet.size}</div>
            <div className="text-[10px] text-slate-400">partidos cadastrados</div>
          </div>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-slate-700">03_seed_eleicoes_braunas.sql</span>
            <div className="flex rounded-md bg-slate-200/70 p-0.5 border border-slate-300 text-xs">
              <button
                onClick={() => setSelectedPreview('sql')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  selectedPreview === 'sql' ? 'bg-blue-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SQL Inserts (~{seedSql.split('\n').length} linhas)
              </button>
              <button
                onClick={() => setSelectedPreview('json')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  selectedPreview === 'json' ? 'bg-blue-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                JSON Original (DTO)
              </button>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Tudo'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[500px] scrollbar-dark">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {selectedPreview === 'sql' ? seedSql : JSON.stringify(dataset, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
