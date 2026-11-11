import React, { useState, useMemo } from 'react';
import { RawElectionDataset } from '../types/election';
import {
  User,
  Search,
  Award,
  Vote,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface DossiePoliticoViewProps {
  dataset: RawElectionDataset | null;
  onSelectCandidato: (tituloEleitor: string) => void;
}

export const DossiePoliticoView: React.FC<DossiePoliticoViewProps> = ({
  dataset,
  onSelectCandidato,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'prefeitos' | 'multiplos' | 'top_votos'>('todos');

  // Compute stats for all politicians across all years
  const politicos = useMemo(() => {
    if (!dataset) return [];

    const map = new Map<string, {
      titulo_eleitor: string;
      nome_completo: string;
      data_nascimento: string;
      eleicoes_count: number;
      mandatos_count: number;
      votos_total: number;
      anos: number[];
      cargos: Set<string>;
      partidos: Set<string>;
      nomes_urna: Set<string>;
    }>();

    // Initialize with base candidates
    Object.values(dataset.candidatos_base).forEach((base) => {
      map.set(base.titulo_eleitor, {
        titulo_eleitor: base.titulo_eleitor,
        nome_completo: base.nome_completo,
        data_nascimento: base.data_nascimento,
        eleicoes_count: 0,
        mandatos_count: 0,
        votos_total: 0,
        anos: [],
        cargos: new Set(),
        partidos: new Set(),
        nomes_urna: new Set(),
      });
    });

    // Populate with historical elections
    Object.keys(dataset.eleicoes).forEach((anoStr) => {
      const ano = parseInt(anoStr, 10);
      const el = dataset.eleicoes[anoStr];
      el.resultados.forEach((res) => {
        let entry = map.get(res.titulo_eleitor);
        if (!entry) {
          entry = {
            titulo_eleitor: res.titulo_eleitor,
            nome_completo: res.nome_urna,
            data_nascimento: '',
            eleicoes_count: 0,
            mandatos_count: 0,
            votos_total: 0,
            anos: [],
            cargos: new Set(),
            partidos: new Set(),
            nomes_urna: new Set(),
          };
          map.set(res.titulo_eleitor, entry);
        }

        entry.eleicoes_count++;
        entry.votos_total += res.votos;
        entry.anos.push(ano);
        entry.cargos.add(res.cargo);
        entry.partidos.add(res.partido);
        entry.nomes_urna.add(res.nome_urna);

        const sit = res.situacao.toLowerCase();
        if (sit.includes('eleito') && !sit.includes('não')) {
          entry.mandatos_count++;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.votos_total - a.votos_total);
  }, [dataset]);

  const filteredPoliticos = useMemo(() => {
    return politicos.filter((p) => {
      const nomesUrnaStr = Array.from(p.nomes_urna).join(' ').toLowerCase();
      const matchSearch =
        p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nomesUrnaStr.includes(searchTerm.toLowerCase()) ||
        p.titulo_eleitor.includes(searchTerm);

      if (!matchSearch) return false;

      if (filterType === 'prefeitos') {
        return p.cargos.has('Prefeito');
      }
      if (filterType === 'multiplos') {
        return p.mandatos_count >= 2;
      }
      if (filterType === 'top_votos') {
        return p.votos_total >= 300;
      }

      return true;
    });
  }, [politicos, searchTerm, filterType]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <span className="uppercase tracking-wider">Tabela Mestra: Dados_Candidato</span>
              <span>•</span>
              <span className="text-slate-400">Pessoas Físicas Únicas (TSE)</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>Dossiê Político: Trajetória Histórica dos Candidatos (2000 - 2024)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Consulte a vida política de qualquer pessoa física através do seu <strong>Título de Eleitor único</strong>. Acompanhe trocas de partido, número de mandatos conquistados e votação acumulada em 24 anos de história eleitoral em Braúnas/MG.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-900 font-mono text-xs font-semibold">
              {politicos.length} Cidadãos Registrados
            </span>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome civil, nome de urna ou título de eleitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({politicos.length})
            </button>
            <button
              onClick={() => setFilterType('prefeitos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'prefeitos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Disputaram Prefeitura
            </button>
            <button
              onClick={() => setFilterType('multiplos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'multiplos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2+ Mandatos Eleitos
            </button>
            <button
              onClick={() => setFilterType('top_votos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'top_votos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mais Votados (300+)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Politician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPoliticos.slice(0, 48).map((p) => {
          const nomesUrna = Array.from(p.nomes_urna);
          const partidos = Array.from(p.partidos);

          return (
            <div
              key={p.titulo_eleitor}
              onClick={() => onSelectCandidato(p.titulo_eleitor)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-blue-500/10 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-900 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        TÍTULO: {p.titulo_eleitor}
                      </span>
                      <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-300 transition" title={p.nome_completo}>
                        {p.nome_completo}
                      </h3>
                    </div>
                  </div>

                  {p.mandatos_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shrink-0">
                      <Award className="w-3 h-3" /> {p.mandatos_count} {p.mandatos_count === 1 ? 'mandato' : 'mandatos'}
                    </span>
                  )}
                </div>

                {/* Nomes de Urna & Partidos */}
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-400">Urna:</span>
                    <strong className="text-slate-200 truncate">
                      {nomesUrna.join(' / ')}
                    </strong>
                  </div>

                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-400">Partidos:</span>
                    <span className="font-mono text-blue-300 font-semibold truncate">
                      {partidos.join(' ➔ ')}
                    </span>
                  </div>

                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-400">Cargos:</span>
                    <span className="text-slate-300 font-medium">
                      {Array.from(p.cargos).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Votos Totais Acumulados</div>
                  <div className="font-mono font-black text-white text-base">
                    {p.votos_total.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                  <span>Abrir Dossiê</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
