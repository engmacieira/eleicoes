import React, { useState, useMemo } from 'react';
import { RawElectionDataset } from '../types/election';
import { CHAPAS_MAJORITARIAS } from '../services/api';
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
  X,
  Filter,
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

  // Compute stats for all politicians across all years, including Prefeitos and Vice-Prefeitos
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

    const getOrCreate = (titulo: string, nomeCompleto: string, dataNasc: string = '') => {
      let entry = map.get(titulo);
      if (!entry) {
        entry = {
          titulo_eleitor: titulo,
          nome_completo: nomeCompleto,
          data_nascimento: dataNasc,
          eleicoes_count: 0,
          mandatos_count: 0,
          votos_total: 0,
          anos: [],
          cargos: new Set(),
          partidos: new Set(),
          nomes_urna: new Set(),
        };
        map.set(titulo, entry);
      }
      return entry;
    };

    // 1. Initialize with base candidates
    Object.values(dataset.candidatos_base).forEach((base) => {
      getOrCreate(base.titulo_eleitor, base.nome_completo, base.data_nascimento);
    });

    // 2. Initialize with Majoritarian Tickets (Prefeitos e Vice-Prefeitos)
    CHAPAS_MAJORITARIAS.forEach((ch) => {
      getOrCreate(ch.prefeito.titulo_eleitor, ch.prefeito.nome_completo, ch.prefeito.data_nascimento || '');
      getOrCreate(ch.vice.titulo_eleitor, ch.vice.nome_completo, ch.vice.data_nascimento || '');
    });

    // 3. Populate with historical elections (Vereadores)
    Object.keys(dataset.eleicoes).forEach((anoStr) => {
      const ano = parseInt(anoStr, 10);
      const el = dataset.eleicoes[anoStr];
      el.resultados.forEach((res) => {
        if (res.cargo.toLowerCase() === 'vereador') {
          const entry = getOrCreate(res.titulo_eleitor, res.nome_urna);
          entry.eleicoes_count++;
          entry.votos_total += res.votos;
          entry.anos.push(ano);
          entry.cargos.add('Vereador');
          entry.partidos.add(res.partido);
          entry.nomes_urna.add(res.nome_urna);

          const sit = res.situacao.toLowerCase();
          if (sit.includes('eleito') && !sit.includes('não')) {
            entry.mandatos_count++;
          }
        }
      });
    });

    // 4. Populate with Majoritarian Tickets (Prefeito & Vice-Prefeito)
    CHAPAS_MAJORITARIAS.forEach((ch) => {
      const el = dataset.eleicoes[String(ch.ano)];
      const resPrefeito = el?.resultados.find(
        (r) => r.cargo.toLowerCase() === 'prefeito' && (r.numero === ch.numero || r.partido === ch.partido)
      );

      const votos = resPrefeito ? resPrefeito.votos : 0;
      const situacao = resPrefeito ? resPrefeito.situacao : 'Não eleito';
      const isEleito = situacao.toLowerCase().includes('eleito') && !situacao.toLowerCase().includes('não');

      // Prefeito entry
      const prefEntry = getOrCreate(ch.prefeito.titulo_eleitor, ch.prefeito.nome_completo, ch.prefeito.data_nascimento || '');
      prefEntry.eleicoes_count++;
      prefEntry.votos_total += votos;
      prefEntry.anos.push(ch.ano);
      prefEntry.cargos.add('Prefeito');
      prefEntry.partidos.add(ch.partido);
      prefEntry.nomes_urna.add(ch.prefeito.nome_urna);
      if (isEleito) prefEntry.mandatos_count++;

      // Vice-Prefeito entry
      const viceEntry = getOrCreate(ch.vice.titulo_eleitor, ch.vice.nome_completo, ch.vice.data_nascimento || '');
      viceEntry.eleicoes_count++;
      viceEntry.votos_total += votos;
      viceEntry.anos.push(ch.ano);
      viceEntry.cargos.add('Vice-Prefeito');
      viceEntry.partidos.add(ch.vice.sigla_partido);
      viceEntry.nomes_urna.add(ch.vice.nome_urna);
      if (isEleito) viceEntry.mandatos_count++;
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
        return p.cargos.has('Prefeito') || p.cargos.has('Vice-Prefeito');
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
      {/* Header Context Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 mb-1">
              <span className="uppercase tracking-wider">Tabela Mestra: Dados_Candidato</span>
              <span>·</span>
              <span className="text-slate-500">Pessoas Físicas Únicas (TSE)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <span>Dossiê de Candidatos: Trajetórias Políticas (2000–2024)</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Consulte o histórico de qualquer indivíduo pelo <strong>Título de Eleitor único</strong>. Acompanhe a evolução de Prefeitos, Vice-Prefeitos e Vereadores ao longo de 24 anos de eleições em Braúnas/MG.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 font-mono text-xs font-bold">
              {politicos.length} Cidadãos Registrados
            </span>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome civil, nome de urna ou título de eleitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({politicos.length})
            </button>
            <button
              onClick={() => setFilterType('prefeitos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'prefeitos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prefeito / Vice
            </button>
            <button
              onClick={() => setFilterType('multiplos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'multiplos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2+ Mandatos Eleitos
            </button>
            <button
              onClick={() => setFilterType('top_votos')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                filterType === 'top_votos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mais Votados (300+)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Politician Cards */}
      {filteredPoliticos.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-500 shadow-xs">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-sm">Nenhum candidato encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não encontramos registros para o termo "{searchTerm}". Tente buscar por parte do nome civil ou título de eleitor.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('todos');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
          >
            Limpar busca e filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPoliticos.slice(0, 48).map((p) => {
            const nomesUrna = Array.from(p.nomes_urna);
            const partidos = Array.from(p.partidos);

            return (
              <div
                key={p.titulo_eleitor}
                onClick={() => onSelectCandidato(p.titulo_eleitor)}
                className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl p-5 cursor-pointer transition shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block font-medium">
                          TÍTULO: {p.titulo_eleitor}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-700 transition" title={p.nome_completo}>
                          {p.nome_completo}
                        </h3>
                      </div>
                    </div>

                    {p.mandatos_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                        <Award className="w-3 h-3 text-amber-600" />
                        {p.mandatos_count} {p.mandatos_count === 1 ? 'mandato' : 'mandatos'}
                      </span>
                    )}
                  </div>

                  {/* Nomes de Urna & Partidos */}
                  <div className="space-y-1.5 mt-3 text-xs">
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">Urna:</span>
                      <strong className="text-slate-800 truncate font-semibold">
                        {nomesUrna.join(' / ')}
                      </strong>
                    </div>

                    <div className="text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">Partidos:</span>
                      <span className="font-mono text-blue-700 font-semibold truncate">
                        {partidos.join(' ➔ ')}
                      </span>
                    </div>

                    <div className="text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">Cargos:</span>
                      <span className="text-slate-700 font-medium">
                        {Array.from(p.cargos).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Votos Acumulados</div>
                    <div className="font-mono font-extrabold text-slate-900 text-base tabular-nums">
                      {p.votos_total.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-blue-700 font-semibold group-hover:translate-x-1 transition">
                    <span>Ver Dossiê</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
