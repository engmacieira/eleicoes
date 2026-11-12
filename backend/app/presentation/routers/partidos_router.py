from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from ..schemas import (
    PartidosAnoResponse,
    PartidoItemSchema,
    PartidoCreateSchema,
    PartidoUpdateSchema,
    PartidoTimelineResponse,
)
from ..dependencies import (
    get_obter_desempenho_use_case,
    get_partido_repo,
    get_obter_linha_do_tempo_use_case,
)
from ...application.use_cases import (
    ObterDesempenhoPartidarioUseCase,
    ObterLinhaDoTempoPartidoUseCase,
)
from ...domain.repositories import IPartidoRepository

router = APIRouter(prefix="/api/partidos", tags=["Partidos"])


@router.get("", response_model=List[PartidoItemSchema])
def listar_partidos(
    q: Optional[str] = Query(None, description="Filtro por número, sigla atual ou denominação histórica"),
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Lista todos os partidos ativos cadastrados na base de dados ordenados pelo número TSE."""
    entities = partido_repo.list_all(q=q)
    return [
        PartidoItemSchema(
            id=p.id,
            numero=p.numero,
            sigla=p.sigla,
            sigla_atual=p.sigla_atual,
            nome=p.nome,
            nome_atual=p.nome_atual,
            siglas_anteriores=p.siglas_anteriores,
            historico=p.historico,
            is_active=p.is_active,
            is_deleted=p.is_deleted,
        )
        for p in entities
    ]


@router.get("/resolver/{termo}", response_model=PartidoItemSchema)
def resolver_partido(
    termo: str,
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """
    Resolve polimorficamente um partido aceitando indistintamente:
    - Número TSE (ex: 70 ou '70')
    - Sigla atual (ex: 'AVANTE')
    - Sigla histórica (ex: 'PT do B', 'PTdoB')
    """
    p = partido_repo.resolve_partido(termo)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Partido não encontrado para o termo '{termo}'.",
        )
    return PartidoItemSchema(
        id=p.id,
        numero=p.numero,
        sigla=p.sigla,
        sigla_atual=p.sigla_atual,
        nome=p.nome,
        nome_atual=p.nome_atual,
        siglas_anteriores=p.siglas_anteriores,
        historico=p.historico,
        is_active=p.is_active,
        is_deleted=p.is_deleted,
    )


@router.get("/timeline/{termo}", response_model=PartidoTimelineResponse)
@router.get("/{termo}/timeline", response_model=PartidoTimelineResponse)
def obter_linha_do_tempo_partido(
    termo: str,
    use_case: ObterLinhaDoTempoPartidoUseCase = Depends(get_obter_linha_do_tempo_use_case),
):
    """
    Retorna a linha do tempo histórica unificada de 2000 a 2024 para o partido resolvido
    (todas as candidaturas, desempenhos e coligações históricas sob o mesmo número TSE).
    """
    timeline = use_case.execute(termo)
    if not timeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum registro histórico localizado para o partido '{termo}'.",
        )
    # preencher atalhos flat
    timeline["numero"] = timeline["partido"]["numero"]
    timeline["sigla_atual"] = timeline["partido"]["sigla_atual"]
    timeline["nome_atual"] = timeline["partido"]["nome_atual"]
    timeline["siglas_anteriores"] = timeline["partido"].get("siglas_anteriores", [])
    return timeline


@router.post("", response_model=PartidoItemSchema, status_code=status.HTTP_201_CREATED)
def cadastrar_partido(
    payload: PartidoCreateSchema,
    partido_repo: IPartidoRepository = Depends(get_partido_repo),
):
    """Cadastra uma nova agremiação partidária com número TSE como indicador perene."""
    try:
        created = partido_repo.create(
            numero=payload.numero,
            sigla=payload.sigla,
            nome=payload.nome,
            sigla_atual=payload.sigla_atual,
            nome_atual=payload.nome_atual,
            historico=payload.historico,
        )
        return PartidoItemSchema(
            id=created.id,
            numero=created.numero,
            sigla=created.sigla,
            sigla_atual=created.sigla_atual,
            nome=created.nome,
            nome_atual=created.nome_atual,
            siglas_anteriores=created.siglas_anteriores,
            historico=created.historico,
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
    """Atualiza as informações de uma agremiação partidária (número, sigla, nome e histórico)."""
    try:
        updated = partido_repo.update(
            id=id,
            numero=payload.numero,
            sigla=payload.sigla,
            nome=payload.nome,
            sigla_atual=payload.sigla_atual,
            nome_atual=payload.nome_atual,
            is_active=payload.is_active,
            historico=payload.historico,
        )
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Partido de ID {id} não encontrado.",
            )
        return PartidoItemSchema(
            id=updated.id,
            numero=updated.numero,
            sigla=updated.sigla,
            sigla_atual=updated.sigla_atual,
            nome=updated.nome,
            nome_atual=updated.nome_atual,
            siglas_anteriores=updated.siglas_anteriores,
            historico=updated.historico,
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


@router.get("/{ano:int}", response_model=PartidosAnoResponse)
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

