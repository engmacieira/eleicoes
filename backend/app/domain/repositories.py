from abc import ABC, abstractmethod
from typing import List, Optional, Tuple, Union
from datetime import date
from .entities import (
    DadosCandidatoEntity,
    EleicaoEntity,
    DetalhesVotacaoEntity,
    PartidosEntity,
    PartidosEleicaoEntity,
    CandidatosEleicaoEntity,
    ColigacaoEntity,
    ColigacaoPartidoEntity,
)


class IEleicaoRepository(ABC):
    @abstractmethod
    def list_all(self, ano: Optional[int] = None) -> List[EleicaoEntity]:
        pass

    @abstractmethod
    def get_by_ano(self, ano: int) -> Optional[EleicaoEntity]:
        pass

    @abstractmethod
    def get_detalhes(self, id_eleicao: int, cargo: Optional[str] = None) -> List[DetalhesVotacaoEntity]:
        pass

    @abstractmethod
    def create(self, ano: int) -> EleicaoEntity:
        pass

    @abstractmethod
    def soft_delete(self, id: int) -> bool:
        pass


class ICandidatoRepository(ABC):
    @abstractmethod
    def get_by_titulo(self, titulo_eleitor: str) -> Optional[DadosCandidatoEntity]:
        pass

    @abstractmethod
    def search(self, query: str, limit: int = 15) -> List[DadosCandidatoEntity]:
        pass

    @abstractmethod
    def list_paginated(
        self, search: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> Tuple[int, List[DadosCandidatoEntity]]:
        pass

    @abstractmethod
    def create(self, entity: DadosCandidatoEntity) -> DadosCandidatoEntity:
        pass

    @abstractmethod
    def update(
        self,
        titulo_eleitor: str,
        nome_completo: Optional[str] = None,
        data_nascimento: Optional[date] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[DadosCandidatoEntity]:
        pass

    @abstractmethod
    def soft_delete(self, titulo_eleitor: str) -> bool:
        pass

    @abstractmethod
    def get_historico_participacoes(
        self, titulo_eleitor: str
    ) -> List[Tuple[CandidatosEleicaoEntity, int, str, Optional[str]]]:
        pass

    @abstractmethod
    def get_resultados_pleito(
        self, id_eleicao: int, cargo: str, partido_termo: Optional[Union[str, int]] = None
    ) -> List[Tuple[CandidatosEleicaoEntity, str, str, Optional[str]]]:
        pass


class IPartidoRepository(ABC):
    @abstractmethod
    def list_all(self, q: Optional[str] = None) -> List[PartidosEntity]:
        pass

    @abstractmethod
    def get_by_id(self, id: int) -> Optional[PartidosEntity]:
        pass

    @abstractmethod
    def get_by_numero(self, numero: int) -> Optional[PartidosEntity]:
        pass

    @abstractmethod
    def resolve_partido(self, termo: Union[str, int]) -> Optional[PartidosEntity]:
        """Resolve indistintamente número TSE (70), sigla atual (AVANTE) ou sigla histórica (PT do B)."""
        pass

    @abstractmethod
    def get_linha_do_tempo(self, termo: Union[str, int]) -> Optional[dict]:
        """Retorna a linha do tempo consolidada de 2000 a 2024 para o partido resolvido."""
        pass

    @abstractmethod
    def create(
        self,
        numero: int,
        sigla: str,
        nome: Optional[str] = None,
        sigla_atual: Optional[str] = None,
        nome_atual: Optional[str] = None,
        historico: Optional[List[dict]] = None,
    ) -> PartidosEntity:
        pass

    @abstractmethod
    def update(
        self,
        id: int,
        numero: Optional[int] = None,
        sigla: Optional[str] = None,
        nome: Optional[str] = None,
        sigla_atual: Optional[str] = None,
        nome_atual: Optional[str] = None,
        is_active: Optional[bool] = None,
        historico: Optional[List[dict]] = None,
    ) -> Optional[PartidosEntity]:
        pass

    @abstractmethod
    def soft_delete(self, id: int) -> bool:
        pass

    @abstractmethod
    def get_desempenho_por_eleicao(
        self, id_eleicao: int
    ) -> List[Tuple[PartidosEleicaoEntity, str, Optional[str]]]:
        pass


class IColigacaoRepository(ABC):
    @abstractmethod
    def list_by_eleicao(
        self, ano: Optional[int] = None, partido_termo: Optional[Union[str, int]] = None
    ) -> List[ColigacaoEntity]:
        pass

    @abstractmethod
    def get_by_id(self, id: int) -> Optional[ColigacaoEntity]:
        pass

    @abstractmethod
    def create(
        self,
        entity: ColigacaoEntity,
        partido_numeros_papeis: Optional[List[Tuple[int, str, Optional[str]]]] = None,
    ) -> ColigacaoEntity:
        pass

    @abstractmethod
    def update(
        self,
        id: int,
        nome_coligacao: Optional[str] = None,
        composicao_siglas: Optional[str] = None,
        partido_numero_titular: Optional[int] = None,
        is_active: Optional[bool] = None,
        partido_numeros_papeis: Optional[List[Tuple[int, str, Optional[str]]]] = None,
    ) -> Optional[ColigacaoEntity]:
        pass

    @abstractmethod
    def soft_delete(self, id: int) -> bool:
        pass


