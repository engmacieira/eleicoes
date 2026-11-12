"""
Modelos SQLAlchemy 2.0 com Mapped[] e mapped_column() e Soft Delete Universal.
Reexportados a partir de app.infrastructure.models para compatibilidade com scripts existentes.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.models import (
    Base,
    DadosCandidato,
    Eleicao,
    DetalhesVotacao,
    Partidos,
    PartidosEleicao,
    CandidatosEleicao,
    Coligacao,
    ColigacaoPartidos,
)

__all__ = [
    "Base",
    "DadosCandidato",
    "Eleicao",
    "DetalhesVotacao",
    "Partidos",
    "PartidosEleicao",
    "CandidatosEleicao",
    "Coligacao",
    "ColigacaoPartidos",
]
