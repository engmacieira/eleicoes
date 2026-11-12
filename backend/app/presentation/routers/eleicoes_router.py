from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..schemas import EleicaoResumoSchema, EleicaoItemSchema, EleicaoCreateSchema
from ..dependencies import get_listar_eleicoes_use_case, get_eleicao_repo
from ...application.use_cases import ListarEleicoesUseCase
from ...domain.repositories import IEleicaoRepository

router = APIRouter(prefix="/api/eleicoes", tags=["Pleitos"])


@router.get("", response_model=List[EleicaoResumoSchema])
def listar_eleicoes(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (ex: 2024)"),
    cargo: Optional[str] = Query(None, description="Filtrar por cargo (Prefeito ou Vereador)"),
    use_case: ListarEleicoesUseCase = Depends(get_listar_eleicoes_use_case),
):
    """
    Retorna os anos disponíveis e o resumo de Detalhes_Votacao (aptos, comparecimento,
    abstenções, válidos, brancos e nulos) com filtros opcionais por ano e cargo.
    """
    dtos = use_case.execute(ano=ano, cargo=cargo)
    return dtos


@router.post("", response_model=EleicaoItemSchema, status_code=status.HTTP_201_CREATED)
def cadastrar_eleicao(
    payload: EleicaoCreateSchema,
    eleicao_repo: IEleicaoRepository = Depends(get_eleicao_repo),
):
    """Cadastra um novo ano de pleito eleitoral."""
    try:
        created = eleicao_repo.create(payload.ano)
        return EleicaoItemSchema(
            id=created.id,
            ano=created.ano,
            is_active=created.is_active,
            is_deleted=created.is_deleted,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_eleicao(
    id: int,
    eleicao_repo: IEleicaoRepository = Depends(get_eleicao_repo),
):
    """Desativa um pleito aplicando Soft Delete universal."""
    success = eleicao_repo.soft_delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Eleição de ID {id} não encontrada.",
        )
    return None
