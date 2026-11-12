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


