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
