from dataclasses import dataclass
from typing import List, Optional
from datetime import date


@dataclass
class DetalhesVotacaoDto:
    id: int
    cargo: str
    aptos: int
    comparecimento: int
    abstencoes: int
    validos: int
    brancos: int
    nulos: int
    taxa_abstencao_pct: float
    taxa_comparecimento_pct: float


@dataclass
class EleicaoResumoDto:
    id: int
    ano: int
    detalhes: List[DetalhesVotacaoDto]


@dataclass
class ViceCandidatoDto:
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str
    sigla_partido: str


@dataclass
class ResultadoCandidatoDto:
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
    vice: Optional[ViceCandidatoDto] = None


@dataclass
class ChapaParceiroDto:
    papel: str
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str


@dataclass
class HistoricoParticipacaoDto:
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
    chapa_parceiro: Optional[ChapaParceiroDto] = None


@dataclass
class CandidatoHistoricoDto:
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date]
    total_eleicoes_disputadas: int
    total_mandatos_conquistados: int
    total_votos_acumulados: int
    historico: List[HistoricoParticipacaoDto]


@dataclass
class DesempenhoPartidoDto:
    sigla: str
    votos_nominais: int
    votos_legenda: int
    total_votos: int
    numero: Optional[int] = None
    sigla_atual: Optional[str] = None
    percentual_total: Optional[float] = None


@dataclass
class PartidosAnoDto:
    ano: int
    partidos: List[DesempenhoPartidoDto]
    total_geral_votos: int


@dataclass
class ColigacaoPartidoDto:
    id_partido: int
    sigla: str
    papel: str
    partido_numero: Optional[int] = None
    sigla_epoca: Optional[str] = None
    sigla_atual: Optional[str] = None
    nome_formatado: Optional[str] = None

    @property
    def sigla_partido(self) -> str:
        return self.sigla_epoca or self.sigla


@dataclass
class ColigacaoDto:
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
    partidos_membros: List[ColigacaoPartidoDto]
    partido_numero_titular: Optional[int] = None

    @property
    def partidos(self) -> List[ColigacaoPartidoDto]:
        return self.partidos_membros


@dataclass
class PartidoCandidaturaTimelineDto:
    ano: int
    cargo: str
    numero_urna: int
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str
    sigla_usada: str
    votos: int
    situacao: str
    posicao: Optional[int] = None


@dataclass
class PartidoHistoricoSiglaDto:
    sigla: str
    nome: Optional[str]
    ano_inicio: Optional[int]
    ano_fim: Optional[int]
    is_atual: bool


@dataclass
class PartidoTimelineDto:
    numero: int
    sigla_atual: str
    nome_atual: Optional[str]
    siglas_anteriores: List[str]
    historico_siglas: List[PartidoHistoricoSiglaDto]
    total_candidaturas: int
    total_votos: int
    total_eleitos: int
    candidaturas: List[PartidoCandidaturaTimelineDto]
    coligacoes: List[ColigacaoDto]


