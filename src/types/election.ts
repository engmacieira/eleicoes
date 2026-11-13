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

export interface ViceCandidatoDto {
  nome_urna: string;
  nome_completo: string;
  titulo_eleitor: string;
  sigla_partido?: string;
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
  partido_numero?: number;
  sigla_epoca?: string;
  sigla_atual?: string;
  percentual_validos?: number;
  vice?: ViceCandidatoDto | null;
}

export interface ChapaParceiroDto {
  papel: 'Prefeito' | 'Vice-Prefeito';
  nome_urna: string;
  nome_completo: string;
  titulo_eleitor: string;
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
  partido_numero?: number;
  sigla_epoca?: string;
  sigla_atual?: string;
  chapa_parceiro?: ChapaParceiroDto | null;
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
  numero?: number;
  sigla_atual?: string;
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

// --- Interfaces para a Gestão de Cadastros ---
export interface CandidatoCadastroDto {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface PartidoHistoricoDto {
  id?: number;
  id_partido?: number;
  partido_numero?: number;
  numero: number;
  sigla: string;
  nome?: string;
  ano_inicio?: number;
  ano_fim?: number;
  is_atual: boolean;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface PartidoCadastroDto {
  id: number;
  numero: number;
  sigla: string;
  sigla_atual?: string;
  nome?: string;
  nome_atual?: string;
  siglas_anteriores?: string[];
  historico?: PartidoHistoricoDto[];
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface CreatePartidoPayload {
  numero: number;
  sigla: string;
  nome?: string;
  sigla_atual?: string;
  nome_atual?: string;
  historico?: Array<{
    sigla: string;
    nome?: string;
    ano_inicio?: number;
    ano_fim?: number;
    is_atual?: boolean;
  }>;
}

export interface UpdatePartidoPayload {
  numero?: number;
  sigla?: string;
  nome?: string;
  sigla_atual?: string;
  nome_atual?: string;
  is_active?: boolean;
  historico?: Array<{
    id?: number;
    sigla: string;
    nome?: string;
    ano_inicio?: number;
    ano_fim?: number;
    is_atual?: boolean;
  }>;
}

export interface EleicaoCadastroDto {
  id: number;
  ano: number;
  is_active?: boolean;
  is_deleted?: boolean;
}

// --- Interfaces para Coligações Partidárias ---
export interface ColigacaoMembroDto {
  id: number;
  id_partido: number;
  sigla_partido: string;
  papel: 'Cabeça de Chapa' | 'Vice-Prefeito' | 'Partido Apoiador' | string;
  partido_numero?: number;
  sigla_epoca?: string;
  sigla_atual?: string;
  nome_formatado?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface ColigacaoDto {
  id: number;
  id_eleicao: number;
  ano_eleicao: number;
  cargo: string;
  numero_urna: number;
  nome_coligacao: string;
  sigla_partido_titular: string;
  composicao_siglas: string;
  partido_numero_titular?: number;
  is_active: boolean;
  is_deleted: boolean;
  partidos: ColigacaoMembroDto[];
  // Campos enriquecidos para exibição analítica
  candidato_nome?: string;
  vice_nome?: string;
  situacao?: string;
  votos?: number;
  percentual_validos?: number;
}

export interface CreateColigacaoPayload {
  ano_eleicao: number;
  cargo: string;
  numero_urna: number;
  nome_coligacao: string;
  sigla_partido_titular: string;
  partido_numero_titular?: number;
  composicao_siglas?: string;
  partidos?: Array<{
    id_partido: number;
    sigla_partido: string;
    papel: string;
  }>;
}

export interface UpdateColigacaoPayload {
  cargo?: string;
  numero_urna?: number;
  nome_coligacao?: string;
  sigla_partido_titular?: string;
  partido_numero_titular?: number;
  composicao_siglas?: string;
  is_active?: boolean;
  partidos?: Array<{
    id_partido: number;
    sigla_partido: string;
    papel: string;
  }>;
}

// --- Interfaces para Linha do Tempo e Resolução Partidária ---
export interface CandidatoNaLinhaTempoDto {
  id?: number;
  titulo_eleitor: string;
  nome_completo: string;
  nome_urna: string;
  numero_urna: number;
  cargo: string;
  votos: number;
  situacao: string;
  posicao?: number | null;
  sigla_epoca?: string;
}

export interface EleicaoLinhaTempoDto {
  ano: number;
  id_eleicao: number;
  sigla_vigente: string;
  is_rebranded: boolean;
  nome_coligacao?: string | null;
  composicao_coligacao?: string | null;
  votos_nominais: number;
  votos_legenda: number;
  total_votos: number;
  total_candidatos: number;
  candidatos: CandidatoNaLinhaTempoDto[];
}

export interface EstatisticasGeraisPartidoDto {
  total_votos_historico: number;
  total_eleicoes_disputadas: number;
  total_candidatos_historico: number;
  total_eleitos_historico: number;
  eleitos_prefeito: number;
  eleitos_vereador: number;
}

export interface PartidoTimelineResponse {
  partido: PartidoCadastroDto;
  estatisticas_gerais: EstatisticasGeraisPartidoDto;
  eleicoes: EleicaoLinhaTempoDto[];
  numero?: number;
  sigla_atual?: string;
  nome_atual?: string;
  siglas_anteriores?: string[];
}

// --- Interfaces para Quociente Eleitoral (Vereador) ---
export interface ParametrosQeDto {
  id: number;
  eleicao_id: number;
  vagas_vereador: number;
  perc_minimo_candidato_qp: number;
  perc_minimo_chapa_sobras: number;
  perc_minimo_candidato_sobras: number;
  permite_repescagem_sobras: boolean;
  is_active: boolean;
  is_deleted: boolean;
}

export interface UpdateParametrosQePayload {
  vagas_vereador?: number;
  perc_minimo_candidato_qp?: number;
  perc_minimo_chapa_sobras?: number;
  perc_minimo_candidato_sobras?: number;
  permite_repescagem_sobras?: boolean;
}

export interface ChapaProporcionalPartidoDto {
  id?: number;
  partido_id: number;
  numero: number;
  sigla: string;
  nome?: string | null;
  votos_nominais: number;
  votos_legenda: number;
  total_votos: number;
}

export interface ChapaProporcionalDto {
  id: number;
  eleicao_id: number;
  nome: string;
  tipo: 'PARTIDO' | 'COLIGACAO' | 'FEDERACAO' | string;
  partidos: ChapaProporcionalPartidoDto[];
  is_active: boolean;
  is_deleted: boolean;
}

export interface CreateChapaProporcionalPayload {
  nome: string;
  tipo: 'PARTIDO' | 'COLIGACAO' | 'FEDERACAO' | string;
  partido_ids: number[];
}

export interface UpdateChapaProporcionalPayload {
  nome?: string;
  tipo?: 'PARTIDO' | 'COLIGACAO' | 'FEDERACAO' | string;
  partido_ids?: number[];
  is_active?: boolean;
}

export interface CandidatoQeDto {
  posicao_ranking: number;
  titulo_eleitor: string;
  nome_urna: string;
  nome_completo: string;
  numero_urna: number;
  partido_numero: number;
  sigla_partido: string;
  votos: number;
  percentual_qe: number;
  atingiu_10_qp: boolean;
  atingiu_20_sobras: boolean;
  status_calculado: 'ELEITO_QP' | 'ELEITO_MEDIA' | 'SUPLENTE';
  situacao_oficial: string;
  coincide_oficial: boolean;
}

export interface RodadaSobrasDto {
  rodada: number;
  chapa_id: number;
  chapa_nome: string;
  candidato_nome: string;
  candidato_votos: number;
  media: number;
  fase: string;
  vagas_anteriores: number;
  vagas_finais: number;
}

export interface ChapaConsolidadaQeDto {
  id: number;
  nome: string;
  tipo: string;
  partidos: ChapaProporcionalPartidoDto[];
  votos_nominais: number;
  votos_legenda: number;
  votos_validos_total: number;
  percentual_votos_validos: number;
  qp_exato: number;
  vagas_qp: number;
  eleitos_qp: number;
  eleitos_media: number;
  total_eleitos: number;
  atingiu_80_qe: boolean;
  media_final: number;
  ranking_candidatos: CandidatoQeDto[];
}

export interface CalculoQeResponseDto {
  eleicao_id: number;
  ano: number;
  vagas_vereador: number;
  total_votos_nominais: number;
  total_votos_legenda: number;
  total_votos_validos: number;
  qe_exato: number;
  qe_arredondado: number;
  corte_10_qp: number;
  corte_80_chapa: number;
  corte_20_sobras: number;
  total_vagas_qp_distribuidas: number;
  total_vagas_media_distribuidas: number;
  chapas: ChapaConsolidadaQeDto[];
  memoria_sobras: RodadaSobrasDto[];
}



