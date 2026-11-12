"""
Schemas Pydantic v2 da camada de apresentação VigiMinas.
Reexportados a partir de app.presentation.schemas para compatibilidade com scripts existentes.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.presentation.schemas import (
    DetalhesVotacaoSchema,
    EleicaoResumoSchema,
    ViceCandidatoSchema,
    ChapaParceiroSchema,
    ResultadoCandidatoSchema,
    HistoricoParticipacaoSchema,
    CandidatoHistoricoResponse,
    DesempenhoPartidoSchema,
    PartidosAnoResponse,
    CandidatoBuscaSchema,
)

__all__ = [
    "DetalhesVotacaoSchema",
    "EleicaoResumoSchema",
    "ViceCandidatoSchema",
    "ChapaParceiroSchema",
    "ResultadoCandidatoSchema",
    "HistoricoParticipacaoSchema",
    "CandidatoHistoricoResponse",
    "DesempenhoPartidoSchema",
    "PartidosAnoResponse",
    "CandidatoBuscaSchema",
]
