from typing import List, Optional
from datetime import date
from pydantic import BaseModel, ConfigDict


# --- Schemas de Detalhes da Votação / Pleitos ---
class DetalhesVotacaoSchema(BaseModel):
    id: int
    cargo: str
    aptos: int
    comparecimento: int
    abstencoes: int
    validos: int
    brancos: int
    nulos: int
    taxa_abstencao_pct: Optional[float] = None
    taxa_comparecimento_pct: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class EleicaoResumoSchema(BaseModel):
    id: int
    ano: int
    detalhes: List[DetalhesVotacaoSchema] = []

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Vice-Candidatura e Chapas Majoritárias ---
class ViceCandidatoSchema(BaseModel):
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str
    sigla_partido: str

    model_config = ConfigDict(from_attributes=True)


class ChapaParceiroSchema(BaseModel):
    papel: str  # 'Prefeito' ou 'Vice-Prefeito'
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Resultados de Candidatos por Pleito ---
class ResultadoCandidatoSchema(BaseModel):
    posicao: Optional[int]
    numero_urna: int
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str
    sigla_partido: str
    cargo: str
    votos: int
    situacao: str
    partido_numero: Optional[int] = None
    sigla_epoca: Optional[str] = None
    sigla_atual: Optional[str] = None
    percentual_validos: Optional[float] = None
    vice: Optional[ViceCandidatoSchema] = None

    model_config = ConfigDict(from_attributes=True)


# --- Schemas do Dossiê Histórico do Candidato ---
class HistoricoParticipacaoSchema(BaseModel):
    ano: int
    cargo: str
    numero_urna: int
    nome_urna: str
    sigla_partido: str
    votos: int
    situacao: str
    posicao: Optional[int]
    partido_numero: Optional[int] = None
    sigla_epoca: Optional[str] = None
    sigla_atual: Optional[str] = None
    chapa_parceiro: Optional[ChapaParceiroSchema] = None

    model_config = ConfigDict(from_attributes=True)


class CandidatoHistoricoResponse(BaseModel):
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date] = None
    total_eleicoes_disputadas: int
    total_mandatos_conquistados: int
    total_votos_acumulados: int
    historico: List[HistoricoParticipacaoSchema]

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Desempenho Partidário ---
class DesempenhoPartidoSchema(BaseModel):
    sigla: str
    votos_nominais: int
    votos_legenda: int
    total_votos: int
    numero: Optional[int] = None
    sigla_atual: Optional[str] = None
    percentual_total: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class PartidosAnoResponse(BaseModel):
    ano: int
    partidos: List[DesempenhoPartidoSchema]
    total_geral_votos: int

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Busca Rápida ---
class CandidatoBuscaSchema(BaseModel):
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Cadastros (CRUD) ---
class CandidatoCreateSchema(BaseModel):
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date] = None


class CandidatoUpdateSchema(BaseModel):
    nome_completo: Optional[str] = None
    data_nascimento: Optional[date] = None
    is_active: Optional[bool] = None


class CandidatoItemSchema(BaseModel):
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date] = None
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class CandidatosPaginadosResponse(BaseModel):
    total: int
    items: List[CandidatoItemSchema]


class PartidoHistoricoSchema(BaseModel):
    id: Optional[int] = None
    partido_numero: Optional[int] = None
    numero: int
    sigla: str
    nome: Optional[str] = None
    ano_inicio: Optional[int] = None
    ano_fim: Optional[int] = None
    is_atual: bool = False
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class PartidoCreateSchema(BaseModel):
    numero: int
    sigla: str
    nome: Optional[str] = None
    sigla_atual: Optional[str] = None
    nome_atual: Optional[str] = None
    historico: Optional[List[dict]] = None


class PartidoUpdateSchema(BaseModel):
    numero: Optional[int] = None
    sigla: Optional[str] = None
    nome: Optional[str] = None
    sigla_atual: Optional[str] = None
    nome_atual: Optional[str] = None
    is_active: Optional[bool] = None
    historico: Optional[List[dict]] = None


class PartidoItemSchema(BaseModel):
    id: int
    numero: int
    sigla: str
    sigla_atual: Optional[str] = None
    nome: Optional[str] = None
    nome_atual: Optional[str] = None
    siglas_anteriores: Optional[List[str]] = None
    historico: Optional[List[PartidoHistoricoSchema]] = None
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class EleicaoCreateSchema(BaseModel):
    ano: int


class EleicaoItemSchema(BaseModel):
    id: int
    ano: int
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Coligações Partidárias ---
class ColigacaoMembroSchema(BaseModel):
    id_partido: int
    sigla: str
    sigla_partido: Optional[str] = None
    papel: str = "Apoiador"
    partido_numero: Optional[int] = None
    sigla_epoca: Optional[str] = None
    sigla_atual: Optional[str] = None
    nome_formatado: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ColigacaoResponseSchema(BaseModel):
    id: int
    id_eleicao: int
    ano: int
    cargo: str
    numero_urna: int
    nome_coligacao: str
    sigla_partido_titular: str
    composicao_siglas: str
    partido_numero_titular: Optional[int] = None
    is_active: bool
    is_deleted: bool
    partidos_membros: List[ColigacaoMembroSchema] = []
    partidos: List[ColigacaoMembroSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ColigacaoCreateSchema(BaseModel):
    ano: int
    cargo: str = "Prefeito"
    numero_urna: int
    nome_coligacao: str
    sigla_partido_titular: str
    partido_numero_titular: Optional[int] = None
    composicao_siglas: Optional[str] = None
    partidos_ids: List[int] = []


class ColigacaoUpdateSchema(BaseModel):
    nome_coligacao: Optional[str] = None
    composicao_siglas: Optional[str] = None
    partido_numero_titular: Optional[int] = None
    is_active: Optional[bool] = None
    partidos_ids: Optional[List[int]] = None


# --- Schemas da Linha do Tempo Unificada de Partido ---
class CandidatoNaLinhaTempoSchema(BaseModel):
    id: Optional[int] = None
    titulo_eleitor: str
    nome_completo: str
    nome_urna: str
    numero_urna: int
    cargo: str
    votos: int
    situacao: str
    posicao: Optional[int] = None
    sigla_epoca: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EleicaoLinhaTempoSchema(BaseModel):
    ano: int
    id_eleicao: int
    sigla_vigente: str
    is_rebranded: bool = False
    nome_coligacao: Optional[str] = None
    composicao_coligacao: Optional[str] = None
    votos_nominais: int = 0
    votos_legenda: int = 0
    total_votos: int = 0
    total_candidatos: int = 0
    candidatos: List[CandidatoNaLinhaTempoSchema] = []

    model_config = ConfigDict(from_attributes=True)


class EstatisticasGeraisPartidoSchema(BaseModel):
    total_votos_historico: int = 0
    total_eleicoes_disputadas: int = 0
    total_candidatos_historico: int = 0
    total_eleitos_historico: int = 0
    eleitos_prefeito: int = 0
    eleitos_vereador: int = 0

    model_config = ConfigDict(from_attributes=True)


class PartidoHistoricoSiglaSchema(BaseModel):
    sigla: str
    nome: Optional[str] = None
    ano_inicio: Optional[int] = None
    ano_fim: Optional[int] = None
    is_atual: bool = False

    model_config = ConfigDict(from_attributes=True)


class PartidoTimelineResponse(BaseModel):
    partido: PartidoItemSchema
    estatisticas_gerais: EstatisticasGeraisPartidoSchema
    eleicoes: List[EleicaoLinhaTempoSchema] = []
    numero: Optional[int] = None
    sigla_atual: Optional[str] = None
    nome_atual: Optional[str] = None
    siglas_anteriores: List[str] = []

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Quociente Eleitoral e Chapas Proporcionais ---
class ParametrosQeSchema(BaseModel):
    id: int
    eleicao_id: int
    vagas_vereador: int = 9
    perc_minimo_candidato_qp: float = 10.00
    perc_minimo_chapa_sobras: float = 80.00
    perc_minimo_candidato_sobras: float = 20.00
    permite_repescagem_sobras: bool = True
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class ParametrosQeUpdateSchema(BaseModel):
    vagas_vereador: Optional[int] = 9
    perc_minimo_candidato_qp: Optional[float] = 10.00
    perc_minimo_chapa_sobras: Optional[float] = 80.00
    perc_minimo_candidato_sobras: Optional[float] = 20.00
    permite_repescagem_sobras: Optional[bool] = True


class ChapaProporcionalPartidoSchema(BaseModel):
    id: Optional[int] = None
    partido_id: int
    numero: int
    sigla: str
    nome: Optional[str] = None
    votos_nominais: int = 0
    votos_legenda: int = 0
    total_votos: int = 0

    model_config = ConfigDict(from_attributes=True)


class ChapaProporcionalCreateSchema(BaseModel):
    nome: str
    tipo: str = "PARTIDO"
    partido_ids: List[int]


class ChapaProporcionalUpdateSchema(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    partido_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None


class ChapaProporcionalResponseSchema(BaseModel):
    id: int
    eleicao_id: int
    nome: str
    tipo: str
    partidos: List[ChapaProporcionalPartidoSchema] = []
    is_active: bool = True
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class CandidatoQeSchema(BaseModel):
    posicao_ranking: int
    titulo_eleitor: str
    nome_urna: str
    nome_completo: str
    numero_urna: int
    partido_numero: int
    sigla_partido: str
    votos: int
    percentual_qe: float
    atingiu_10_qp: bool
    atingiu_20_sobras: bool
    status_calculado: str  # 'ELEITO_QP' | 'ELEITO_MEDIA' | 'SUPLENTE'
    situacao_oficial: str
    coincide_oficial: bool

    model_config = ConfigDict(from_attributes=True)


class RodadaSobrasSchema(BaseModel):
    rodada: int
    chapa_id: int
    chapa_nome: str
    candidato_nome: str
    candidato_votos: int
    media: float
    fase: str  # '80/20' | 'REPESCAGEM'
    vagas_anteriores: int
    vagas_finais: int

    model_config = ConfigDict(from_attributes=True)


class ChapaConsolidadaQeSchema(BaseModel):
    id: int
    nome: str
    tipo: str
    partidos: List[ChapaProporcionalPartidoSchema] = []
    votos_nominais: int
    votos_legenda: int
    votos_validos_total: int
    percentual_votos_validos: float
    qp_exato: float
    vagas_qp: int
    eleitos_qp: int
    eleitos_media: int
    total_eleitos: int
    atingiu_80_qe: bool
    media_final: float
    ranking_candidatos: List[CandidatoQeSchema] = []

    model_config = ConfigDict(from_attributes=True)


class CalculoQeResponseSchema(BaseModel):
    eleicao_id: int
    ano: int
    vagas_vereador: int
    total_votos_nominais: int
    total_votos_legenda: int
    total_votos_validos: int
    qe_exato: float
    qe_arredondado: int
    corte_10_qp: float
    corte_80_chapa: float
    corte_20_sobras: float
    total_vagas_qp_distribuidas: int
    total_vagas_media_distribuidas: int
    chapas: List[ChapaConsolidadaQeSchema] = []
    memoria_sobras: List[RodadaSobrasSchema] = []

    model_config = ConfigDict(from_attributes=True)




