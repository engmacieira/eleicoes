from typing import List, Optional, Union
from ..domain.repositories import (
    IEleicaoRepository,
    ICandidatoRepository,
    IPartidoRepository,
    IColigacaoRepository,
)
from ..domain.entities import ColigacaoEntity
from .dtos import (
    EleicaoResumoDto,
    DetalhesVotacaoDto,
    ResultadoCandidatoDto,
    CandidatoHistoricoDto,
    HistoricoParticipacaoDto,
    PartidosAnoDto,
    DesempenhoPartidoDto,
    ColigacaoDto,
    ColigacaoPartidoDto,
    PartidoTimelineDto,
    PartidoHistoricoSiglaDto,
    PartidoCandidaturaTimelineDto,
)


class ListarEleicoesUseCase:
    def __init__(self, eleicao_repo: IEleicaoRepository):
        self.eleicao_repo = eleicao_repo

    def execute(self, ano: Optional[int] = None, cargo: Optional[str] = None) -> List[EleicaoResumoDto]:
        eleicoes = self.eleicao_repo.list_all(ano=ano)
        resultado: List[EleicaoResumoDto] = []

        for el in eleicoes:
            detalhes_entities = self.eleicao_repo.get_detalhes(el.id, cargo=cargo)
            detalhes_dtos = [
                DetalhesVotacaoDto(
                    id=d.id,
                    cargo=d.cargo,
                    aptos=d.aptos,
                    comparecimento=d.comparecimento,
                    abstencoes=d.abstencoes,
                    validos=d.validos,
                    brancos=d.brancos,
                    nulos=d.nulos,
                    taxa_abstencao_pct=d.taxa_abstencao,
                    taxa_comparecimento_pct=d.taxa_comparecimento,
                )
                for d in detalhes_entities
            ]
            resultado.append(
                EleicaoResumoDto(
                    id=el.id,
                    ano=el.ano,
                    detalhes=detalhes_dtos,
                )
            )

        return resultado


class ObterResultadosUseCase:
    def __init__(self, eleicao_repo: IEleicaoRepository, candidato_repo: ICandidatoRepository):
        self.eleicao_repo = eleicao_repo
        self.candidato_repo = candidato_repo

    def execute(
        self, ano: int, cargo: str, partido: Optional[Union[str, int]] = None
    ) -> List[ResultadoCandidatoDto]:
        eleicao = self.eleicao_repo.get_by_ano(ano)
        if not eleicao:
            raise ValueError(f"Eleição do ano {ano} não encontrada.")

        detalhes = self.eleicao_repo.get_detalhes(eleicao.id, cargo=cargo)
        validos_totais = detalhes[0].validos if detalhes and detalhes[0].validos > 0 else 0

        candidatos_raw = self.candidato_repo.get_resultados_pleito(
            eleicao.id, cargo, partido_termo=partido
        )

        soma_votos = sum(cand.votos for cand, _, _, _ in candidatos_raw) or 1
        divisor = validos_totais if validos_totais > 0 else soma_votos

        resultado = []
        for cand, nome_completo, sigla_epoca, sigla_atual in candidatos_raw:
            pct = round((cand.votos / divisor) * 100, 2)
            resultado.append(
                ResultadoCandidatoDto(
                    posicao=cand.posicao,
                    numero_urna=cand.numero_urna,
                    nome_urna=cand.nome_urna,
                    nome_completo=nome_completo,
                    titulo_eleitor=cand.titulo_eleitor,
                    sigla_partido=sigla_epoca or sigla_atual or "S/P",
                    cargo=cand.cargo,
                    votos=cand.votos,
                    situacao=cand.situacao,
                    partido_numero=cand.partido_numero,
                    sigla_epoca=cand.sigla_epoca or sigla_epoca,
                    sigla_atual=sigla_atual,
                    percentual_validos=pct,
                )
            )

        return resultado


class ObterHistoricoCandidatoUseCase:
    def __init__(self, candidato_repo: ICandidatoRepository):
        self.candidato_repo = candidato_repo

    def execute(self, titulo_eleitor: str) -> CandidatoHistoricoDto:
        candidato = self.candidato_repo.get_by_titulo(titulo_eleitor)
        if not candidato:
            raise ValueError(f"Candidato com título de eleitor {titulo_eleitor} não encontrado.")

        participacoes = self.candidato_repo.get_historico_participacoes(titulo_eleitor)

        total_votos = 0
        total_mandatos = 0
        historico_list = []

        for cand, ano, sigla_epoca, sigla_atual in participacoes:
            total_votos += cand.votos
            situacao_lower = (cand.situacao or "").lower()
            if "eleito" in situacao_lower and "não" not in situacao_lower:
                total_mandatos += 1

            historico_list.append(
                HistoricoParticipacaoDto(
                    ano=ano,
                    cargo=cand.cargo,
                    numero_urna=cand.numero_urna,
                    nome_urna=cand.nome_urna,
                    sigla_partido=sigla_epoca or sigla_atual or "S/P",
                    votos=cand.votos,
                    situacao=cand.situacao,
                    posicao=cand.posicao,
                    partido_numero=cand.partido_numero,
                    sigla_epoca=cand.sigla_epoca or sigla_epoca,
                    sigla_atual=sigla_atual,
                )
            )

        return CandidatoHistoricoDto(
            titulo_eleitor=candidato.titulo_eleitor,
            nome_completo=candidato.nome_completo,
            data_nascimento=candidato.data_nascimento,
            total_eleicoes_disputadas=len(participacoes),
            total_mandatos_conquistados=total_mandatos,
            total_votos_acumulados=total_votos,
            historico=historico_list,
        )


class ObterDesempenhoPartidarioUseCase:
    def __init__(self, eleicao_repo: IEleicaoRepository, partido_repo: IPartidoRepository):
        self.eleicao_repo = eleicao_repo
        self.partido_repo = partido_repo

    def execute(self, ano: int) -> PartidosAnoDto:
        eleicao = self.eleicao_repo.get_by_ano(ano)
        if not eleicao:
            raise ValueError(f"Eleição do ano {ano} não encontrada.")

        desempenhos = self.partido_repo.get_desempenho_por_eleicao(eleicao.id)
        total_geral = sum(p.total_votos for p, _, _ in desempenhos) or 1

        partidos_dtos = []
        for p, sigla_atual, nome_atual in desempenhos:
            pct = round((p.total_votos / total_geral) * 100, 2)
            partidos_dtos.append(
                DesempenhoPartidoDto(
                    sigla=sigla_atual,
                    numero=p.partido_numero,
                    sigla_atual=sigla_atual,
                    votos_nominais=p.votos_nominais,
                    votos_legenda=p.votos_legenda,
                    total_votos=p.total_votos,
                    percentual_total=pct,
                )
            )

        return PartidosAnoDto(
            ano=ano,
            partidos=partidos_dtos,
            total_geral_votos=total_geral if total_geral > 1 else 0,
        )


class ListarColigacoesUseCase:
    def __init__(self, coligacao_repo: IColigacaoRepository):
        self.coligacao_repo = coligacao_repo

    def execute(
        self, ano: Optional[int] = None, partido: Optional[Union[str, int]] = None
    ) -> List[ColigacaoDto]:
        entities = self.coligacao_repo.list_by_eleicao(ano, partido_termo=partido)
        dtos = []
        for e in entities:
            membros = [
                ColigacaoPartidoDto(
                    id_partido=m.id_partido,
                    sigla=m.sigla or m.sigla_epoca or m.sigla_atual or "",
                    papel=m.papel,
                    partido_numero=m.partido_numero,
                    sigla_epoca=m.sigla_epoca,
                    sigla_atual=m.sigla_atual,
                    nome_formatado=m.nome_formatado,
                )
                for m in (e.partidos_membros or [])
            ]
            dtos.append(
                ColigacaoDto(
                    id=e.id,
                    id_eleicao=e.id_eleicao,
                    ano=e.ano or 0,
                    cargo=e.cargo,
                    numero_urna=e.numero_urna,
                    nome_coligacao=e.nome_coligacao,
                    partido_numero_titular=e.partido_numero_titular,
                    sigla_partido_titular=e.sigla_partido_titular,
                    composicao_siglas=e.composicao_siglas,
                    is_active=e.is_active,
                    is_deleted=e.is_deleted,
                    partidos_membros=membros,
                )
            )
        return dtos


class ObterLinhaDoTempoPartidoUseCase:
    def __init__(self, partido_repo: IPartidoRepository):
        self.partido_repo = partido_repo

    def execute(self, termo: Union[str, int]) -> Optional[dict]:
        return self.partido_repo.get_linha_do_tempo(termo)


class CriarColigacaoUseCase:
    def __init__(self, coligacao_repo: IColigacaoRepository, eleicao_repo: IEleicaoRepository):
        self.coligacao_repo = coligacao_repo
        self.eleicao_repo = eleicao_repo

    def execute(
        self,
        ano: int,
        cargo: str,
        numero_urna: int,
        nome_coligacao: str,
        sigla_partido_titular: str,
        composicao_siglas: str,
        partido_numero_titular: Optional[int] = None,
        partido_numeros_papeis: Optional[List[tuple]] = None,
    ) -> ColigacaoDto:
        eleicao = self.eleicao_repo.get_by_ano(ano)
        if not eleicao:
            raise ValueError(f"Pleito eleitoral de {ano} não encontrado.")

        entity = ColigacaoEntity(
            id=None,
            id_eleicao=eleicao.id,
            cargo=cargo,
            numero_urna=numero_urna,
            nome_coligacao=nome_coligacao,
            partido_numero_titular=partido_numero_titular,
            sigla_partido_titular=sigla_partido_titular,
            composicao_siglas=composicao_siglas,
            is_active=True,
            is_deleted=False,
        )

        created = self.coligacao_repo.create(entity, partido_numeros_papeis)
        membros = [
            ColigacaoPartidoDto(
                id_partido=m.id_partido,
                sigla=m.sigla or m.sigla_epoca or m.sigla_atual or "",
                papel=m.papel,
                partido_numero=m.partido_numero,
                sigla_epoca=m.sigla_epoca,
                sigla_atual=m.sigla_atual,
                nome_formatado=m.nome_formatado,
            )
            for m in (created.partidos_membros or [])
        ]
        return ColigacaoDto(
            id=created.id,
            id_eleicao=created.id_eleicao,
            ano=ano,
            cargo=created.cargo,
            numero_urna=created.numero_urna,
            nome_coligacao=created.nome_coligacao,
            partido_numero_titular=created.partido_numero_titular,
            sigla_partido_titular=created.sigla_partido_titular,
            composicao_siglas=created.composicao_siglas,
            is_active=created.is_active,
            is_deleted=created.is_deleted,
            partidos_membros=membros,
        )


class AtualizarColigacaoUseCase:
    def __init__(self, coligacao_repo: IColigacaoRepository):
        self.coligacao_repo = coligacao_repo

    def execute(
        self,
        id: int,
        nome_coligacao: Optional[str] = None,
        composicao_siglas: Optional[str] = None,
        partido_numero_titular: Optional[int] = None,
        is_active: Optional[bool] = None,
        partido_numeros_papeis: Optional[List[tuple]] = None,
    ) -> ColigacaoDto:
        updated = self.coligacao_repo.update(
            id=id,
            nome_coligacao=nome_coligacao,
            composicao_siglas=composicao_siglas,
            partido_numero_titular=partido_numero_titular,
            is_active=is_active,
            partido_numeros_papeis=partido_numeros_papeis,
        )
        if not updated:
            raise ValueError(f"Coligação com ID {id} não encontrada.")

        membros = [
            ColigacaoPartidoDto(
                id_partido=m.id_partido,
                sigla=m.sigla or m.sigla_epoca or m.sigla_atual or "",
                papel=m.papel,
                partido_numero=m.partido_numero,
                sigla_epoca=m.sigla_epoca,
                sigla_atual=m.sigla_atual,
                nome_formatado=m.nome_formatado,
            )
            for m in (updated.partidos_membros or [])
        ]
        return ColigacaoDto(
            id=updated.id,
            id_eleicao=updated.id_eleicao,
            ano=updated.ano or 0,
            cargo=updated.cargo,
            numero_urna=updated.numero_urna,
            nome_coligacao=updated.nome_coligacao,
            partido_numero_titular=updated.partido_numero_titular,
            sigla_partido_titular=updated.sigla_partido_titular,
            composicao_siglas=updated.composicao_siglas,
            is_active=updated.is_active,
            is_deleted=updated.is_deleted,
            partidos_membros=membros,
        )


class DeletarColigacaoUseCase:
    def __init__(self, coligacao_repo: IColigacaoRepository):
        self.coligacao_repo = coligacao_repo

    def execute(self, id: int) -> bool:
        return self.coligacao_repo.soft_delete(id)

