export interface RawMunicipio {
  nome: string;
  uf: string;
  codigo_tse: number;
}

export interface RawDetalhesCargo {
  aptos: number;
  comparecimento: number;
  abstencoes: number;
  validos: number;
  brancos: number;
  nulos: number;
}

export interface RawPartidoVereador {
  partido: string;
  votos_nominais: number;
  votos_legenda: number;
  total_votos: number;
}

export interface RawResultado {
  cargo: string;
  posicao: number;
  nome_urna: string;
  numero: number;
  partido: string;
  votos: number;
  situacao: string;
  titulo_eleitor: string;
}

export interface RawEleicaoAno {
  ano: number;
  detalhes: {
    prefeito: RawDetalhesCargo;
    vereador: RawDetalhesCargo;
  };
  partidos_vereador: RawPartidoVereador[];
  resultados: RawResultado[];
}

export interface RawCandidatoBase {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento: string;
}

export interface RawElectionDataset {
  municipio: RawMunicipio;
  eleicoes: Record<string, RawEleicaoAno>;
  candidatos_base: Record<string, RawCandidatoBase>;
}

export interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  nullable: boolean;
  constraint?: string;
  description: string;
}

export interface TableSchema {
  id: string;
  name: string;
  category: 'dimensao' | 'fato' | 'estatistica';
  description: string;
  columns: TableColumn[];
  indexes: string[];
  constraints: string[];
}

// API DTOs matching FastAPI schemas
export interface DetalhesVotacaoDto {
  id: number;
  cargo: string;
  aptos: number;
  comparecimento: number;
  abstencoes: number;
  validos: number;
  brancos: number;
  nulos: number;
  taxa_abstencao_pct?: number;
  taxa_comparecimento_pct?: number;
}

export interface EleicaoResumoDto {
  id: number;
  ano: number;
  detalhes: DetalhesVotacaoDto[];
}

export interface ResultadoCandidatoDto {
  posicao: number | null;
  numero_urna: number;
  nome_urna: string;
  nome_completo: string;
  titulo_eleitor: string;
  sigla_partido: string;
  cargo: string;
  votos: number;
  situacao: string;
  percentual_validos?: number;
}

export interface HistoricoParticipacaoDto {
  ano: number;
  cargo: string;
  numero_urna: number;
  nome_urna: string;
  sigla_partido: string;
  votos: number;
  situacao: string;
  posicao: number | null;
}

export interface CandidatoHistoricoDto {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento?: string | null;
  total_eleicoes_disputadas: number;
  total_mandatos_conquistados: number;
  total_votos_acumulados: number;
  historico: HistoricoParticipacaoDto[];
}

export interface DesempenhoPartidoDto {
  sigla: string;
  votos_nominais: number;
  votos_legenda: number;
  total_votos: number;
  percentual_total?: number;
}

export interface PartidosAnoDto {
  ano: number;
  partidos: DesempenhoPartidoDto[];
  total_geral_votos: number;
}

export interface CloudSqlHealthDto {
  status: 'healthy' | 'unhealthy' | 'fallback';
  database: string;
  server_ip: string;
  engine: string;
  cloud_project: string;
  latency_ms?: number;
}
