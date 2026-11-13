from dataclasses import dataclass
from datetime import date
from typing import Optional, List


@dataclass
class DadosCandidatoEntity:
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date] = None
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class EleicaoEntity:
    id: Optional[int]
    ano: int
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class DetalhesVotacaoEntity:
    id: Optional[int]
    id_eleicao: int
    cargo: str
    aptos: int
    comparecimento: int
    abstencoes: int
    validos: int
    brancos: int
    nulos: int
    is_active: bool = True
    is_deleted: bool = False

    @property
    def taxa_abstencao(self) -> float:
        if self.aptos and self.aptos > 0:
            return round((self.abstencoes / self.aptos) * 100, 2)
        return 0.0

    @property
    def taxa_comparecimento(self) -> float:
        if self.aptos and self.aptos > 0:
            return round((self.comparecimento / self.aptos) * 100, 2)
        return 0.0


@dataclass
class PartidoHistoricoEntity:
    id: Optional[int]
    partido_numero: int
    sigla: str
    nome: Optional[str] = None
    ano_inicio: Optional[int] = None
    ano_fim: Optional[int] = None
    is_atual: bool = False
    is_active: bool = True
    is_deleted: bool = False

    @property
    def numero(self) -> int:
        return self.partido_numero

    @property
    def id_partido(self) -> int:
        return self.partido_numero


@dataclass
class PartidosEntity:
    numero: int
    sigla_atual: str
    id: Optional[int] = None
    nome_atual: Optional[str] = None
    siglas_anteriores: Optional[List[str]] = None
    historico: Optional[List[PartidoHistoricoEntity]] = None
    is_active: bool = True
    is_deleted: bool = False

    @property
    def sigla(self) -> str:
        return self.sigla_atual

    @property
    def nome(self) -> Optional[str]:
        return self.nome_atual


@dataclass
class PartidosEleicaoEntity:
    id_eleicao: int
    partido_numero: int
    id: Optional[int] = None
    votos_nominais: int = 0
    votos_legenda: int = 0
    total_votos: int = 0
    is_active: bool = True
    is_deleted: bool = False

    @property
    def id_partido(self) -> int:
        return self.partido_numero


@dataclass
class CandidatosEleicaoEntity:
    titulo_eleitor: str
    id_eleicao: int
    partido_numero: int
    cargo: str
    numero_urna: int
    nome_urna: str
    votos: int
    situacao: str
    id: Optional[int] = None
    sigla_epoca: Optional[str] = None
    posicao: Optional[int] = None
    is_active: bool = True
    is_deleted: bool = False

    @property
    def id_partido(self) -> int:
        return self.partido_numero


@dataclass
class ColigacaoPartidoEntity:
    id_coligacao: int
    partido_numero: int
    id: Optional[int] = None
    papel: str = "Apoiador"
    sigla_epoca: Optional[str] = None
    sigla_atual: Optional[str] = None
    sigla: Optional[str] = None
    nome_formatado: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False

    @property
    def id_partido(self) -> int:
        return self.partido_numero


@dataclass
class ColigacaoEntity:
    id_eleicao: int
    cargo: str
    numero_urna: int
    nome_coligacao: str
    sigla_partido_titular: str
    composicao_siglas: str
    id: Optional[int] = None
    partido_numero_titular: Optional[int] = None
    is_active: bool = True
    is_deleted: bool = False
    partidos_membros: Optional[List[ColigacaoPartidoEntity]] = None
    ano: Optional[int] = None


@dataclass
class ParametrosQeEntity:
    eleicao_id: int
    id: Optional[int] = None
    vagas_vereador: int = 9
    perc_minimo_candidato_qp: float = 10.00
    perc_minimo_chapa_sobras: float = 80.00
    perc_minimo_candidato_sobras: float = 20.00
    permite_repescagem_sobras: bool = True
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class ChapaProporcionalPartidoEntity:
    chapa_proporcional_id: int
    partido_id: int
    id: Optional[int] = None
    numero: Optional[int] = None
    sigla: Optional[str] = None
    nome: Optional[str] = None
    votos_nominais: int = 0
    votos_legenda: int = 0
    total_votos: int = 0
    is_active: bool = True
    is_deleted: bool = False

    @property
    def partido_numero(self) -> int:
        return self.partido_id


@dataclass
class ChapaProporcionalEntity:
    eleicao_id: int
    nome: str
    tipo: str = "PARTIDO"
    id: Optional[int] = None
    partidos: Optional[List[ChapaProporcionalPartidoEntity]] = None
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class CandidatoQeEntity:
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


@dataclass
class RodadaSobrasEntity:
    rodada: int
    chapa_id: int
    chapa_nome: str
    candidato_nome: str
    candidato_votos: int
    media: float
    fase: str  # '80/20' | 'REPESCAGEM'
    vagas_anteriores: int
    vagas_finais: int


@dataclass
class ChapaConsolidadaQeEntity:
    id: int
    nome: str
    tipo: str
    partidos: List[ChapaProporcionalPartidoEntity]
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
    ranking_candidatos: List[CandidatoQeEntity]


@dataclass
class ResultadoCalculoQeEntity:
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
    chapas: List[ChapaConsolidadaQeEntity]
    memoria_sobras: List[RodadaSobrasEntity]



