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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold">
                ETL / Data Pipeline
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dataset.municipio.nome} / {dataset.municipio.uf} (TSE: {dataset.municipio.codigo_tse})
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Script de Carga dos Dados Históricos (2000 a 2024)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Script gerado a partir do DTO JSON fornecido pelo usuário. Converte as estruturas aninhadas em declarações <code>INSERT INTO</code> idempotentes com integridade referencial protegida.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar INSERTs'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Carga (.sql)</span>
            </button>
          </div>
        </div>

        {/* Dataset Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Pessoas Físicas (Candidatos)</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalCandidatos}</div>
            <div className="text-[10px] text-slate-400">dados_candidato</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Pleitos Municipais</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalEleicoes}</div>
            <div className="text-[10px] text-slate-400">2000 até 2024</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Vote className="w-3.5 h-3.5 text-purple-400" />
              <span>Candidaturas Apuradas</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalCandidaturas}</div>
            <div className="text-[10px] text-slate-400">candidatos_eleicao</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Partidos Identificados</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalPartidosSet.size}</div>
            <div className="text-[10px] text-slate-400">partidos cadastrados</div>
          </div>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">03_seed_eleicoes_braunas.sql</span>
            <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedPreview('sql')}
                className={`px-2.5 py-0.5 rounded ${
                  selectedPreview === 'sql' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                SQL Inserts (~{seedSql.split('\n').length} linhas)
              </button>
              <button
                onClick={() => setSelectedPreview('json')}
                className={`px-2.5 py-0.5 rounded ${
                  selectedPreview === 'json' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Original (DTO)
              </button>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Tudo'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px] scrollbar-thin">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {selectedPreview === 'sql' ? seedSql : JSON.stringify(dataset, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
