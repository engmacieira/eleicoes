from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import (
    ParametrosQeSchema,
    ParametrosQeUpdateSchema,
    ChapaProporcionalResponseSchema,
    ChapaProporcionalCreateSchema,
    ChapaProporcionalUpdateSchema,
    CalculoQeResponseSchema,
)
from ..dependencies import (
    get_obter_parametros_qe_use_case,
    get_salvar_parametros_qe_use_case,
    get_listar_chapas_use_case,
    get_criar_chapa_use_case,
    get_atualizar_chapa_use_case,
    get_deletar_chapa_use_case,
    get_gerar_chapas_isoladas_use_case,
    get_calcular_quociente_eleitoral_use_case,
)
from ...application.use_cases import (
    ObterParametrosQeUseCase,
    SalvarParametrosQeUseCase,
    ListarChapasProporcionaisUseCase,
    CriarChapaProporcionalUseCase,
    AtualizarChapaProporcionalUseCase,
    DeletarChapaProporcionalUseCase,
    GerarChapasIsoladasUseCase,
    CalcularQuocienteEleitoralUseCase,
)

router = APIRouter(tags=["Quociente Eleitoral & Chapas Proporcionais"])


@router.get("/api/eleicoes/{eleicao_id}/parametros-qe", response_model=ParametrosQeSchema)
def obter_parametros_qe(
    eleicao_id: int,
    use_case: ObterParametrosQeUseCase = Depends(get_obter_parametros_qe_use_case),
):
    """
    Retorna os parâmetros de corte e regras eleitorais para cálculo de Vereador
    (Quociente Eleitoral, Quociente Partidário e Sobras) do pleito especificado.
    """
    return use_case.execute(eleicao_id)


@router.put("/api/eleicoes/{eleicao_id}/parametros-qe", response_model=ParametrosQeSchema)
def atualizar_parametros_qe(
    eleicao_id: int,
    payload: ParametrosQeUpdateSchema,
    use_case: SalvarParametrosQeUseCase = Depends(get_salvar_parametros_qe_use_case),
):
    """
    Cria ou atualiza as configurações da regra proporcional para o pleito
    (vagas_vereador, cláusulas 10%, 80%, 20% e repescagem universal).
    """
    vagas = payload.vagas_vereador if payload.vagas_vereador is not None else 9
    p_qp = payload.perc_minimo_candidato_qp if payload.perc_minimo_candidato_qp is not None else 10.00
    p_chapa = payload.perc_minimo_chapa_sobras if payload.perc_minimo_chapa_sobras is not None else 80.00
    p_cand = payload.perc_minimo_candidato_sobras if payload.perc_minimo_candidato_sobras is not None else 20.00
    repescagem = payload.permite_repescagem_sobras if payload.permite_repescagem_sobras is not None else True

    return use_case.execute(
        eleicao_id=eleicao_id,
        vagas_vereador=vagas,
        perc_minimo_candidato_qp=p_qp,
        perc_minimo_chapa_sobras=p_chapa,
        perc_minimo_candidato_sobras=p_cand,
        permite_repescagem_sobras=repescagem,
    )


@router.get("/api/eleicoes/{eleicao_id}/chapas-proporcionais", response_model=List[ChapaProporcionalResponseSchema])
def listar_chapas_proporcionais(
    eleicao_id: int,
    use_case: ListarChapasProporcionaisUseCase = Depends(get_listar_chapas_use_case),
):
    """
    Lista as unidades de disputa proporcional (Partido, Coligação ou Federação)
    cadastradas na eleição com as siglas e votos de seus partidos membros.
    """
    return use_case.execute(eleicao_id)


@router.post(
    "/api/eleicoes/{eleicao_id}/chapas-proporcionais",
    response_model=ChapaProporcionalResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_chapa_proporcional(
    eleicao_id: int,
    payload: ChapaProporcionalCreateSchema,
    use_case: CriarChapaProporcionalUseCase = Depends(get_criar_chapa_use_case),
):
    """
    Cadastra uma nova unidade proporcional (Partido/Coligação/Federação) no pleito,
    vinculando os partidos integrantes.
    """
    try:
        return use_case.execute(
            eleicao_id=eleicao_id,
            nome=payload.nome,
            tipo=payload.tipo,
            partido_ids=payload.partido_ids,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/api/eleicoes/{eleicao_id}/chapas-proporcionais/gerar-isoladas",
    response_model=List[ChapaProporcionalResponseSchema],
)
def gerar_chapas_isoladas_automaticamente(
    eleicao_id: int,
    use_case: GerarChapasIsoladasUseCase = Depends(get_gerar_chapas_isoladas_use_case),
):
    """
    Ação rápida que cria automaticamente uma chapa de tipo 'PARTIDO' para cada
    legenda que teve votos/candidatos a vereador no pleito e ainda não está vinculada.
    """
    return use_case.execute(eleicao_id)


@router.put("/api/chapas-proporcionais/{chapa_id}", response_model=ChapaProporcionalResponseSchema)
def atualizar_chapa_proporcional(
    chapa_id: int,
    payload: ChapaProporcionalUpdateSchema,
    use_case: AtualizarChapaProporcionalUseCase = Depends(get_atualizar_chapa_use_case),
):
    """
    Atualiza o nome, tipo, ativação ou lista de partidos vinculados à chapa proporcional.
    """
    try:
        return use_case.execute(
            chapa_id=chapa_id,
            nome=payload.nome,
            tipo=payload.tipo,
            partido_ids=payload.partido_ids,
            is_active=payload.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/api/chapas-proporcionais/{chapa_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_chapa_proporcional(
    chapa_id: int,
    use_case: DeletarChapaProporcionalUseCase = Depends(get_deletar_chapa_use_case),
):
    """
    Desativa uma chapa proporcional via Soft Delete Universal.
    """
    success = use_case.execute(chapa_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapa proporcional de ID {chapa_id} não encontrada.",
        )
    return None


@router.get("/api/eleicoes/{eleicao_id}/calculo-qe", response_model=CalculoQeResponseSchema)
def calcular_quociente_eleitoral(
    eleicao_id: int,
    use_case: CalcularQuocienteEleitoralUseCase = Depends(get_calcular_quociente_eleitoral_use_case),
):
    """
    Executa o motor de cálculo oficial do Quociente Eleitoral (QE), Quociente Partidário (QP)
    e Distribuição de Sobras (Médias) para o cargo de Vereador no pleito selecionado.
    """
    return use_case.execute(eleicao_id)
