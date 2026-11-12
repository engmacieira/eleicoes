from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..schemas import (
    CandidatoHistoricoResponse,
    CandidatoBuscaSchema,
    CandidatoCreateSchema,
    CandidatoUpdateSchema,
    CandidatoItemSchema,
    CandidatosPaginadosResponse,
)
from ..dependencies import get_obter_historico_use_case, get_candidato_repo
from ...application.use_cases import ObterHistoricoCandidatoUseCase
from ...domain.repositories import ICandidatoRepository
from ...domain.entities import DadosCandidatoEntity

router = APIRouter(prefix="/api/candidatos", tags=["Candidatos (Pessoas Físicas)"])


@router.get("", response_model=CandidatosPaginadosResponse)
def listar_candidatos(
    search: Optional[str] = Query(None, description="Termo para busca por nome ou título"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    candidato_repo: ICandidatoRepository = Depends(get_candidato_repo),
):
    """Lista todos os candidatos cadastrados com suporte a busca e paginação."""
    total, entities = candidato_repo.list_paginated(search=search, skip=skip, limit=limit)
    items = [
        CandidatoItemSchema(
            titulo_eleitor=c.titulo_eleitor,
            nome_completo=c.nome_completo,
            data_nascimento=c.data_nascimento,
            is_active=c.is_active,
            is_deleted=c.is_deleted,
        )
        for c in entities
    ]
    return CandidatosPaginadosResponse(total=total, items=items)


@router.post("", response_model=CandidatoItemSchema, status_code=status.HTTP_201_CREATED)
def cadastrar_candidato(
    payload: CandidatoCreateSchema,
    candidato_repo: ICandidatoRepository = Depends(get_candidato_repo),
):
    """Cadastra uma nova pessoa física no cadastro eleitoral."""
    try:
        entity = DadosCandidatoEntity(
            titulo_eleitor=payload.titulo_eleitor.strip(),
            nome_completo=payload.nome_completo.strip().upper(),
            data_nascimento=payload.data_nascimento,
            is_active=True,
            is_deleted=False,
        )
        created = candidato_repo.create(entity)
        return CandidatoItemSchema(
            titulo_eleitor=created.titulo_eleitor,
            nome_completo=created.nome_completo,
            data_nascimento=created.data_nascimento,
            is_active=created.is_active,
            is_deleted=created.is_deleted,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{titulo_eleitor}", response_model=CandidatoItemSchema)
def atualizar_candidato(
    titulo_eleitor: str,
    payload: CandidatoUpdateSchema,
    candidato_repo: ICandidatoRepository = Depends(get_candidato_repo),
):
    """Atualiza informações cadastrais de um candidato existente."""
    nome_up = payload.nome_completo.strip().upper() if payload.nome_completo else None
    updated = candidato_repo.update(
        titulo_eleitor=titulo_eleitor,
        nome_completo=nome_up,
        data_nascimento=payload.data_nascimento,
        is_active=payload.is_active,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidato com título {titulo_eleitor} não encontrado.",
        )
    return CandidatoItemSchema(
        titulo_eleitor=updated.titulo_eleitor,
        nome_completo=updated.nome_completo,
        data_nascimento=updated.data_nascimento,
        is_active=updated.is_active,
        is_deleted=updated.is_deleted,
    )


@router.delete("/{titulo_eleitor}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_candidato(
    titulo_eleitor: str,
    candidato_repo: ICandidatoRepository = Depends(get_candidato_repo),
):
    """Desativa o candidato aplicando Soft Delete universal (is_deleted = True, is_active = False)."""
    success = candidato_repo.soft_delete(titulo_eleitor)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidato com título {titulo_eleitor} não encontrado.",
        )
    return None


@router.get("/busca", response_model=List[CandidatoBuscaSchema])
def buscar_candidatos(
    q: str = Query(..., min_length=2, description="Nome civil, nome de urna ou título"),
    candidato_repo: ICandidatoRepository = Depends(get_candidato_repo),
):
    """Endpoint utilitário de busca rápida para autocomplete e pesquisa global."""
    entities = candidato_repo.search(q, limit=15)
    return [
        CandidatoBuscaSchema(
            titulo_eleitor=c.titulo_eleitor,
            nome_completo=c.nome_completo,
            data_nascimento=str(c.data_nascimento) if c.data_nascimento else None,
        )
        for c in entities
    ]


@router.get("/{titulo_eleitor}/historico", response_model=CandidatoHistoricoResponse)
def obter_historico_candidato(
    titulo_eleitor: str,
    use_case: ObterHistoricoCandidatoUseCase = Depends(get_obter_historico_use_case),
):
    """
    Busca a pessoa física na tabela Dados_Candidato e lista TODAS as eleições que ela
    disputou entre 2000 e 2024, destacando evolução de votos, trocas de partido e mandatos.
    """
    try:
        return use_case.execute(titulo_eleitor)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
