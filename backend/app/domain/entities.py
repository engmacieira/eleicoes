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
class PartidosEntity:
    id: Optional[int]
    sigla: str
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class PartidosEleicaoEntity:
    id: Optional[int]
    id_eleicao: int
    id_partido: int
    votos_nominais: int
    votos_legenda: int
    total_votos: int
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class CandidatosEleicaoEntity:
    id: Optional[int]
    titulo_eleitor: str
    id_eleicao: int
    id_partido: int
    cargo: str
    numero_urna: int
    nome_urna: str
    votos: int
    situacao: str
    posicao: Optional[int] = None
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class ColigacaoPartidoEntity:
    id: Optional[int]
    id_coligacao: int
    id_partido: int
    papel: str = "Apoiador"
    sigla: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False


@dataclass
class ColigacaoEntity:
    id: Optional[int]
    id_eleicao: int
    cargo: str
    numero_urna: int
    nome_coligacao: str
    sigla_partido_titular: str
    composicao_siglas: str
    is_active: bool = True
    is_deleted: bool = False
    partidos_membros: Optional[List[ColigacaoPartidoEntity]] = None
    ano: Optional[int] = None

