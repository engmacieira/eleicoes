from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..schemas import ResultadoCandidatoSchema
from ..dependencies import get_obter_resultados_use_case
from ...application.use_cases import ObterResultadosUseCase

router = APIRouter(prefix="/api/resultados", tags=["Resultados"])


@router.get("", response_model=List[ResultadoCandidatoSchema])
def obter_resultados(
    ano: int = Query(2024, description="Ano da eleição (ex: 2000 a 2024)"),
    cargo: str = Query("Vereador", description="Cargo concorrido (Prefeito ou Vereador)"),
    use_case: ObterResultadosUseCase = Depends(get_obter_resultados_use_case),
):
    """
    Retorna o ranking oficial de candidatos de uma eleição (ano e cargo), trazendo
    nome_urna, nome_completo, titulo_eleitor, numero_urna, sigla do partido, votos,
    posicao e situacao.
    """
    try:
        return use_case.execute(ano=ano, cargo=cargo)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
