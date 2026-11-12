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
    id_partido: Optional[int] = None
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
    historico: Optional[List[dict]] = None


class PartidoUpdateSchema(BaseModel):
    numero: Optional[int] = None
    sigla: Optional[str] = None
    nome: Optional[str] = None
    is_active: Optional[bool] = None
    historico: Optional[List[dict]] = None


class PartidoItemSchema(BaseModel):
    id: int
    numero: int
    sigla: str
    nome: Optional[str] = None
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
    papel: str = "Apoiador"
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
    is_active: bool
    is_deleted: bool
    partidos_membros: List[ColigacaoMembroSchema] = []
    model_config = ConfigDict(from_attributes=True)


class ColigacaoCreateSchema(BaseModel):
    ano: int
    cargo: str = "Prefeito"
    numero_urna: int
    nome_coligacao: str
    sigla_partido_titular: str
    composicao_siglas: Optional[str] = None
    partidos_ids: List[int] = []


class ColigacaoUpdateSchema(BaseModel):
    nome_coligacao: Optional[str] = None
    composicao_siglas: Optional[str] = None
    is_active: Optional[bool] = None
    partidos_ids: Optional[List[int]] = None


