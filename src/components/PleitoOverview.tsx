import React, { useState, useMemo } from 'react';
import {
  DetalhesVotacaoDto,
  ResultadoCandidatoDto,
} from '../types/election';
import {
  Users,
  Vote,
  Percent,
  FileCheck2,
  FileX2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Award,
  ChevronDown,
  Building2,
} from 'lucide-react';

interface PleitoOverviewProps {
  ano: number;
  setAno: (ano: number) => void;
  cargo: 'Prefeito' | 'Vereador';
  setCargo: (cargo: 'Prefeito' | 'Vereador') => void;
  detalhes: DetalhesVotacaoDto | null;
  resultados: ResultadoCandidatoDto[];
  loading: boolean;
  onSelectCandidato: (tituloEleitor: string) => void;
}

export const PleitoOverview: React.FC<PleitoOverviewProps> = ({
  ano,
  setAno,
  cargo,
  setCargo,
  detalhes,
  resultados,
  loading,
  onSelectCandidato,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<'todos' | 'eleitos' | 'suplentes' | 'nao_eleitos'>('todos');

  const anosDisponiveis = [2024, 2020, 2016, 2012, 2008, 2004, 2000];

  const filteredResultados = useMemo(() => {
    return resultados.filter((c) => {
      const matchSearch =
        c.nome_urna.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sigla_partido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.numero_urna).includes(searchTerm) ||
        c.titulo_eleitor.includes(searchTerm);

      if (!matchSearch) return false;

      const sit = c.situacao.toLowerCase();
      if (situacaoFilter === 'eleitos') {
        return sit.includes('eleito') && !sit.includes('não');
      }
      if (situacaoFilter === 'suplentes') {
        return sit.includes('suplente');
      }
      if (situacaoFilter === 'nao_eleitos') {
        return sit.includes('não') || sit.includes('nao');
      }

      return true;
    });
  }, [resultados, searchTerm, situacaoFilter]);

  const totalVotosCargo = useMemo(() => {
    return resultados.reduce((acc, c) => acc + c.votos, 0);
  }, [resultados]);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Ano e Cargo Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor de Pleito */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Pleito Eleitoral:
            </span>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {anosDisponiveis.map((a) => (
                <button
                  key={a}
                  onClick={() => setAno(a)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    ano === a
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Cargo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Cargo:
            </span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCargo('Prefeito')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  cargo === 'Prefeito'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Prefeito</span>
              </button>
              <button
                onClick={() => setCargo('Vereador')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  cargo === 'Vereador'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Vereador</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Balanço da Urna (Detalhes_Votacao) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Eleitorado Apto */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Eleitorado Apto</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-2">
            {detalhes ? detalhes.aptos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% circunscrição</div>
        </div>

        {/* Comparecimento */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Comparecimento</span>
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
            {detalhes ? detalhes.comparecimento.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_comparecimento_pct}% das urnas` : '—'}
          </div>
        </div>

        {/* Abstenções */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Abstenções</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
            {detalhes ? detalhes.abstencoes.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-amber-400/80 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_abstencao_pct}% não votaram` : '—'}
          </div>
        </div>

        {/* Votos Válidos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Votos Válidos</span>
            <FileCheck2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 mt-2">
            {detalhes && detalhes.validos > 0
              ? detalhes.validos.toLocaleString('pt-BR')
              : totalVotosCargo.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nominais + Legenda</div>
        </div>

        {/* Votos Brancos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Votos Brancos</span>
            <FileX2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-300 mt-2">
            {detalhes ? detalhes.brancos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Opção em branco</div>
        </div>

        {/* Votos Nulos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Votos Nulos</span>
            <FileX2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-400 mt-2">
            {detalhes ? detalhes.nulos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Urnas invalidadas</div>
        </div>
      </div>

      {/* Resultados Oficiais Table Header & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>
                Apuração Oficial - {cargo} em {ano}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 ml-1">
                {filteredResultados.length} candidatos
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer candidato para abrir o seu <strong>Dossiê Histórico Completo</strong>.
            </p>
          </div>

          {/* Search Input & Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, partido, número ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64 transition"
              />
            </div>

            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSituacaoFilter('todos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  situacaoFilter === 'todos' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSituacaoFilter('eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  situacaoFilter === 'eleitos' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Eleitos
              </button>
              <button
                onClick={() => setSituacaoFilter('suplentes')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  situacaoFilter === 'suplentes' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Suplentes
              </button>
              <button
                onClick={() => setSituacaoFilter('nao_eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  situacaoFilter === 'nao_eleitos' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Não Eleitos
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Carregando dados da apuração...
            </div>
          ) : filteredResultados.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nenhum candidato encontrado com os filtros aplicados.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">Candidato</th>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4 text-right">Votos Nominais</th>
                  <th className="py-3 px-4 text-right">% Votos</th>
                  <th className="py-3 px-4 text-center">Situação TSE</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredResultados.map((c) => {
                  const isEleito = c.situacao.toLowerCase().includes('eleito') && !c.situacao.toLowerCase().includes('não');
                  const isSuplente = c.situacao.toLowerCase().includes('suplente');

                  return (
                    <tr
                      key={`${c.titulo_eleitor}-${c.posicao}`}
                      onClick={() => onSelectCandidato(c.titulo_eleitor)}
                      className="hover:bg-blue-600/10 cursor-pointer transition-colors group"
                    >
                      {/* Posição */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                        {c.posicao ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            c.posicao <= 3 && isEleito
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {c.posicao}º
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Nome Urna & Nome Civil */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white group-hover:text-blue-300 text-sm flex items-center gap-1.5">
                          <span>{c.nome_urna}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition" />
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-xs" title={c.nome_completo}>
                          {c.nome_completo}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          TÍTULO: {c.titulo_eleitor}
                        </div>
                      </td>

                      {/* Número da Urna */}
                      <td className="py-3 px-4 font-mono font-black text-amber-400 text-sm">
                        {c.numero_urna}
                      </td>

                      {/* Partido */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                          {c.sigla_partido}
                        </span>
                      </td>

                      {/* Votos */}
                      <td className="py-3 px-4 text-right font-mono font-black text-white text-sm">
                        {c.votos.toLocaleString('pt-BR')}
                      </td>

                      {/* Percentual */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">{c.percentual_validos}%</span>
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 hidden sm:block overflow-hidden">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(c.percentual_validos || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isEleito
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isSuplente
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isEleito ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : isSuplente ? (
                            <Clock className="w-3 h-3 text-amber-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{c.situacao}</span>
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidato(c.titulo_eleitor);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-medium transition cursor-pointer"
                        >
                          Ver Dossiê
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
