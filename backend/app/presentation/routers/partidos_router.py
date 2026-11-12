from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import (
    PartidosAnoResponse,
    PartidoItemSchema,
    PartidoCreateSchema,
    PartidoUpdateSchema,
)
from ..dependencies import get_obter_desempenho_use_case, get_partido_repo
from ...application.use_cases import ObterDesempenhoPartidarioUseCase
from ...domain.repositories import IPartidoRepository

router = APIRouter(prefix="/api/partidos", tags=["Partidos"])


@router.get("", response_model=List[PartidoItemSchema])
def listar_partidos(
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Lista todos os partidos ativos cadastrados na base de dados."""
    entities = partido_repo.list_all()
    return [
        PartidoItemSchema(
            id=p.id,
            sigla=p.sigla,
            is_active=p.is_active,
            is_deleted=p.is_deleted,
        )
        for p in entities
    ]


@router.post("", response_model=PartidoItemSchema, status_code=status.HTTP_201_CREATED)
def cadastrar_partido(
    payload: PartidoCreateSchema,
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Cadastra uma nova agremiação partidária."""
    try:
        created = partido_repo.create(payload.sigla)
        return PartidoItemSchema(
            id=created.id,
            sigla=created.sigla,
            is_active=created.is_active,
            is_deleted=created.is_deleted,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}", response_model=PartidoItemSchema)
def atualizar_partido(
    id: int,
    payload: PartidoUpdateSchema,
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Atualiza as informações de uma agremiação partidária."""
    try:
        updated = partido_repo.update(id=id, sigla=payload.sigla, is_active=payload.is_active)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Partido de ID {id} não encontrado.",
            )
        return PartidoItemSchema(
            id=updated.id,
            sigla=updated.sigla,
            is_active=updated.is_active,
            is_deleted=updated.is_deleted,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_partido(
    id: int,
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Desativa um partido aplicando Soft Delete universal."""
    success = partido_repo.soft_delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Partido de ID {id} não encontrado.",
        )
    return None


@router.get("/{ano}", response_model=PartidosAnoResponse)
def obter_partidos_ano(
    ano: int,
    use_case: ObterDesempenhoPartidarioUseCase = Depends(get_obter_desempenho_use_case),
):
    """
    Retorna o desempenho partidário consolidado (Partidos_Eleicao) para vereador no ano
    selecionado (votos nominais, de legenda e total por agremiação).
    """
    try:
        return use_case.execute(ano)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
