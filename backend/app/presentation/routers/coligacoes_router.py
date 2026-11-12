from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..schemas import (
    ColigacaoResponseSchema,
    ColigacaoCreateSchema,
    ColigacaoUpdateSchema,
)
from ..dependencies import (
    get_listar_coligacoes_use_case,
    get_criar_coligacao_use_case,
    get_atualizar_coligacao_use_case,
    get_deletar_coligacao_use_case,
)
from ...application.use_cases import (
    ListarColigacoesUseCase,
    CriarColigacaoUseCase,
    AtualizarColigacaoUseCase,
    DeletarColigacaoUseCase,
)

router = APIRouter(prefix="/api/coligacoes", tags=["Coligações Partidárias"])


@router.get("", response_model=List[ColigacaoResponseSchema])
def listar_coligacoes(
    ano: Optional[int] = Query(None, description="Filtrar por ano eleitoral (ex: 2024, 2020)"),
    use_case: ListarColigacoesUseCase = Depends(get_listar_coligacoes_use_case),
):
    """
    Retorna as coligações eleitorais formadas em cada pleito municipal,
    incluindo quais partidos estavam coligados e apoiando determinada chapa majoritária.
    """
    return use_case.execute(ano=ano)


@router.post("", response_model=ColigacaoResponseSchema, status_code=status.HTTP_201_CREATED)
def criar_coligacao(
    payload: ColigacaoCreateSchema,
    use_case: CriarColigacaoUseCase = Depends(get_criar_coligacao_use_case),
):
    """
    Cadastra uma nova coligação partidária vinculada a um pleito e chapa majoritária,
    definindo as legendas de apoio.
    """
    try:
        papeis = [(p_id, "Apoiador") for p_id in payload.partidos_ids]
        comp_siglas = payload.composicao_siglas or payload.sigla_partido_titular
        return use_case.execute(
            ano=payload.ano,
            cargo=payload.cargo,
            numero_urna=payload.numero_urna,
            nome_coligacao=payload.nome_coligacao,
            sigla_partido_titular=payload.sigla_partido_titular,
            composicao_siglas=comp_siglas,
            partido_ids_papeis=papeis,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}", response_model=ColigacaoResponseSchema)
def atualizar_coligacao(
    id: int,
    payload: ColigacaoUpdateSchema,
    use_case: AtualizarColigacaoUseCase = Depends(get_atualizar_coligacao_use_case),
):
    """
    Atualiza dados de uma coligação partidária existente (nome, partidos aliados ou ativação).
    """
    papeis = None
    if payload.partidos_ids is not None:
        papeis = [(p_id, "Apoiador") for p_id in payload.partidos_ids]

    try:
        return use_case.execute(
            id=id,
            nome_coligacao=payload.nome_coligacao,
            composicao_siglas=payload.composicao_siglas,
            is_active=payload.is_active,
            partido_ids_papeis=papeis,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_coligacao(
    id: int,
    use_case: DeletarColigacaoUseCase = Depends(get_deletar_coligacao_use_case),
):
    """
    Desativa uma coligação partidária via Soft Delete Universal (is_deleted=True, is_active=False).
    """
    success = use_case.execute(id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coligação não encontrada.")
    return None
