from fastapi import Depends
from sqlalchemy.orm import Session
from ..infrastructure.database import get_db
from ..infrastructure.repositories import (
    SqlAlchemyEleicaoRepository,
    SqlAlchemyCandidatoRepository,
    SqlAlchemyPartidoRepository,
    SqlAlchemyColigacaoRepository,
)
from ..application.use_cases import (
    ListarEleicoesUseCase,
    ObterResultadosUseCase,
    ObterHistoricoCandidatoUseCase,
    ObterDesempenhoPartidarioUseCase,
    ListarColigacoesUseCase,
    CriarColigacaoUseCase,
    AtualizarColigacaoUseCase,
    DeletarColigacaoUseCase,
)


def get_eleicao_repo(db: Session = Depends(get_db)) -> SqlAlchemyEleicaoRepository:
    return SqlAlchemyEleicaoRepository(db)


def get_candidato_repo(db: Session = Depends(get_db)) -> SqlAlchemyCandidatoRepository:
    return SqlAlchemyCandidatoRepository(db)


def get_partido_repo(db: Session = Depends(get_db)) -> SqlAlchemyPartidoRepository:
    return SqlAlchemyPartidoRepository(db)


def get_coligacao_repo(db: Session = Depends(get_db)) -> SqlAlchemyColigacaoRepository:
    return SqlAlchemyColigacaoRepository(db)


def get_listar_eleicoes_use_case(
    repo: SqlAlchemyEleicaoRepository = Depends(get_eleicao_repo),
) -> ListarEleicoesUseCase:
    return ListarEleicoesUseCase(repo)


def get_obter_resultados_use_case(
    eleicao_repo: SqlAlchemyEleicaoRepository = Depends(get_eleicao_repo),
    candidato_repo: SqlAlchemyCandidatoRepository = Depends(get_candidato_repo),
) -> ObterResultadosUseCase:
    return ObterResultadosUseCase(eleicao_repo, candidato_repo)


def get_obter_historico_use_case(
    candidato_repo: SqlAlchemyCandidatoRepository = Depends(get_candidato_repo),
) -> ObterHistoricoCandidatoUseCase:
    return ObterHistoricoCandidatoUseCase(candidato_repo)


def get_obter_desempenho_use_case(
    eleicao_repo: SqlAlchemyEleicaoRepository = Depends(get_eleicao_repo),
    partido_repo: SqlAlchemyPartidoRepository = Depends(get_partido_repo),
) -> ObterDesempenhoPartidarioUseCase:
    return ObterDesempenhoPartidarioUseCase(eleicao_repo, partido_repo)


def get_listar_coligacoes_use_case(
    coligacao_repo: SqlAlchemyColigacaoRepository = Depends(get_coligacao_repo),
) -> ListarColigacoesUseCase:
    return ListarColigacoesUseCase(coligacao_repo)


def get_criar_coligacao_use_case(
    coligacao_repo: SqlAlchemyColigacaoRepository = Depends(get_coligacao_repo),
    eleicao_repo: SqlAlchemyEleicaoRepository = Depends(get_eleicao_repo),
) -> CriarColigacaoUseCase:
    return CriarColigacaoUseCase(coligacao_repo, eleicao_repo)


def get_atualizar_coligacao_use_case(
    coligacao_repo: SqlAlchemyColigacaoRepository = Depends(get_coligacao_repo),
) -> AtualizarColigacaoUseCase:
    return AtualizarColigacaoUseCase(coligacao_repo)


def get_deletar_coligacao_use_case(
    coligacao_repo: SqlAlchemyColigacaoRepository = Depends(get_coligacao_repo),
) -> DeletarColigacaoUseCase:
    return DeletarColigacaoUseCase(coligacao_repo)

