import math
from typing import List, Optional, Union
from ..domain.repositories import (
    IEleicaoRepository,
    ICandidatoRepository,
    IPartidoRepository,
    IColigacaoRepository,
    IQuocienteEleitoralRepository,
)
from ..domain.entities import ColigacaoEntity, ParametrosQeEntity
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
    ParametrosQeDto,
    ChapaProporcionalPartidoDto,
    ChapaProporcionalDto,
    CandidatoQeDto,
    RodadaSobrasDto,
    ChapaConsolidadaQeDto,
    CalculoQeResponseDto,
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


class ObterParametrosQeUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(self, eleicao_id: int) -> ParametrosQeDto:
        p = self.quociente_repo.get_parametros(eleicao_id)
        if not p:
            return ParametrosQeDto(
                id=0,
                eleicao_id=eleicao_id,
                vagas_vereador=9,
                perc_minimo_candidato_qp=10.0,
                perc_minimo_chapa_sobras=80.0,
                perc_minimo_candidato_sobras=20.0,
                permite_repescagem_sobras=True,
                is_active=True,
                is_deleted=False,
            )
        return ParametrosQeDto(
            id=p.id or 0,
            eleicao_id=p.eleicao_id,
            vagas_vereador=p.vagas_vereador,
            perc_minimo_candidato_qp=p.perc_minimo_candidato_qp,
            perc_minimo_chapa_sobras=p.perc_minimo_chapa_sobras,
            perc_minimo_candidato_sobras=p.perc_minimo_candidato_sobras,
            permite_repescagem_sobras=p.permite_repescagem_sobras,
            is_active=p.is_active,
            is_deleted=p.is_deleted,
        )


class SalvarParametrosQeUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(
        self,
        eleicao_id: int,
        vagas_vereador: int = 9,
        perc_minimo_candidato_qp: float = 10.0,
        perc_minimo_chapa_sobras: float = 80.0,
        perc_minimo_candidato_sobras: float = 20.0,
        permite_repescagem_sobras: bool = True,
    ) -> ParametrosQeDto:
        entity = ParametrosQeEntity(
            eleicao_id=eleicao_id,
            vagas_vereador=vagas_vereador,
            perc_minimo_candidato_qp=perc_minimo_candidato_qp,
            perc_minimo_chapa_sobras=perc_minimo_chapa_sobras,
            perc_minimo_candidato_sobras=perc_minimo_candidato_sobras,
            permite_repescagem_sobras=permite_repescagem_sobras,
            is_active=True,
            is_deleted=False,
        )
        saved = self.quociente_repo.save_parametros(entity)
        return ParametrosQeDto(
            id=saved.id or 0,
            eleicao_id=saved.eleicao_id,
            vagas_vereador=saved.vagas_vereador,
            perc_minimo_candidato_qp=saved.perc_minimo_candidato_qp,
            perc_minimo_chapa_sobras=saved.perc_minimo_chapa_sobras,
            perc_minimo_candidato_sobras=saved.perc_minimo_candidato_sobras,
            permite_repescagem_sobras=saved.permite_repescagem_sobras,
            is_active=saved.is_active,
            is_deleted=saved.is_deleted,
        )


class ListarChapasProporcionaisUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(self, eleicao_id: int) -> List[ChapaProporcionalDto]:
        entities = self.quociente_repo.list_chapas(eleicao_id)
        dtos = []
        for e in entities:
            partidos_dtos = [
                ChapaProporcionalPartidoDto(
                    id=p.id or 0,
                    partido_id=p.partido_id,
                    numero=p.numero or p.partido_id,
                    sigla=p.sigla or str(p.partido_id),
                    nome=p.nome,
                    votos_nominais=p.votos_nominais,
                    votos_legenda=p.votos_legenda,
                    total_votos=p.total_votos,
                )
                for p in (e.partidos or [])
            ]
            dtos.append(
                ChapaProporcionalDto(
                    id=e.id or 0,
                    eleicao_id=e.eleicao_id,
                    nome=e.nome,
                    tipo=e.tipo,
                    partidos=partidos_dtos,
                    is_active=e.is_active,
                    is_deleted=e.is_deleted,
                )
            )
        return dtos


class CriarChapaProporcionalUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(
        self, eleicao_id: int, nome: str, tipo: str, partido_ids: List[int]
    ) -> ChapaProporcionalDto:
        if not nome or not nome.strip():
            raise ValueError("O nome da chapa proporcional é obrigatório.")
        partido_ids_unicos = list(dict.fromkeys(partido_ids or []))
        if not partido_ids_unicos:
            raise ValueError("Ao menos um partido deve ser vinculado à chapa proporcional.")

        e = self.quociente_repo.create_chapa(
            eleicao_id=eleicao_id,
            nome=nome.strip(),
            tipo=tipo.strip().upper(),
            partido_ids=partido_ids_unicos,
        )
        partidos_dtos = [
            ChapaProporcionalPartidoDto(
                id=p.id or 0,
                partido_id=p.partido_id,
                numero=p.numero or p.partido_id,
                sigla=p.sigla or str(p.partido_id),
                nome=p.nome,
                votos_nominais=p.votos_nominais,
                votos_legenda=p.votos_legenda,
                total_votos=p.total_votos,
            )
            for p in (e.partidos or [])
        ]
        return ChapaProporcionalDto(
            id=e.id or 0,
            eleicao_id=e.eleicao_id,
            nome=e.nome,
            tipo=e.tipo,
            partidos=partidos_dtos,
            is_active=e.is_active,
            is_deleted=e.is_deleted,
        )


class AtualizarChapaProporcionalUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(
        self,
        chapa_id: int,
        nome: Optional[str] = None,
        tipo: Optional[str] = None,
        partido_ids: Optional[List[int]] = None,
        is_active: Optional[bool] = None,
    ) -> ChapaProporcionalDto:
        partido_ids_unicos = (
            list(dict.fromkeys(partido_ids)) if partido_ids is not None else None
        )
        e = self.quociente_repo.update_chapa(
            chapa_id=chapa_id,
            nome=nome,
            tipo=tipo,
            partido_ids=partido_ids_unicos,
            is_active=is_active,
        )
        if not e:
            raise ValueError(f"Chapa proporcional de ID {chapa_id} não encontrada.")

        partidos_dtos = [
            ChapaProporcionalPartidoDto(
                id=p.id or 0,
                partido_id=p.partido_id,
                numero=p.numero or p.partido_id,
                sigla=p.sigla or str(p.partido_id),
                nome=p.nome,
                votos_nominais=p.votos_nominais,
                votos_legenda=p.votos_legenda,
                total_votos=p.total_votos,
            )
            for p in (e.partidos or [])
        ]
        return ChapaProporcionalDto(
            id=e.id or 0,
            eleicao_id=e.eleicao_id,
            nome=e.nome,
            tipo=e.tipo,
            partidos=partidos_dtos,
            is_active=e.is_active,
            is_deleted=e.is_deleted,
        )


class DeletarChapaProporcionalUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(self, chapa_id: int) -> bool:
        return self.quociente_repo.soft_delete_chapa(chapa_id)


class GerarChapasIsoladasUseCase:
    def __init__(self, quociente_repo: IQuocienteEleitoralRepository):
        self.quociente_repo = quociente_repo

    def execute(self, eleicao_id: int) -> List[ChapaProporcionalDto]:
        # 1. Carrega chapas existentes
        chapas_existentes = self.quociente_repo.list_chapas(eleicao_id)
        partidos_ja_vinculados = set()
        for ch in chapas_existentes:
            for p in (ch.partidos or []):
                partidos_ja_vinculados.add(p.partido_id)

        # 2. Carrega apuração da eleição
        partidos_eleicao, _ = self.quociente_repo.get_dados_apuracao_vereador(eleicao_id)

        # 3. Cria chapas para os que ainda não foram vinculados
        for pe, sigla, nome in partidos_eleicao:
            if pe.partido_numero not in partidos_ja_vinculados:
                nome_chapa = sigla or f"Partido {pe.partido_numero}"
                self.quociente_repo.create_chapa(
                    eleicao_id=eleicao_id,
                    nome=nome_chapa,
                    tipo="PARTIDO",
                    partido_ids=[pe.partido_numero],
                )
                partidos_ja_vinculados.add(pe.partido_numero)

        return ListarChapasProporcionaisUseCase(self.quociente_repo).execute(eleicao_id)


class CalcularQuocienteEleitoralUseCase:
    def __init__(
        self,
        quociente_repo: IQuocienteEleitoralRepository,
        eleicao_repo: IEleicaoRepository,
    ):
        self.quociente_repo = quociente_repo
        self.eleicao_repo = eleicao_repo

    def execute(self, eleicao_id: int) -> CalculoQeResponseDto:
        # Obter dados da eleição
        eleicoes = self.eleicao_repo.list_all()
        eleicao = next((e for e in eleicoes if e.id == eleicao_id), None)
        ano = eleicao.ano if eleicao else 0

        # 1. Carregar parâmetros eleitorais da eleição (ou defaults)
        params_entity = self.quociente_repo.get_parametros(eleicao_id)
        vagas = params_entity.vagas_vereador if params_entity else 9
        perc_cand_qp = params_entity.perc_minimo_candidato_qp if params_entity else 10.0
        perc_chapa_sobras = params_entity.perc_minimo_chapa_sobras if params_entity else 80.0
        perc_cand_sobras = params_entity.perc_minimo_candidato_sobras if params_entity else 20.0
        permite_repescagem = params_entity.permite_repescagem_sobras if params_entity else True

        # 2. Carregar dados de apuração de vereador (banco de dados existente)
        partidos_eleicao, candidatos_eleicao = self.quociente_repo.get_dados_apuracao_vereador(eleicao_id)

        legenda_por_partido = {pe.partido_numero: pe.votos_legenda for pe, _, _ in partidos_eleicao}
        candidatos_por_partido: dict[int, list] = {}
        for cand, nome_completo, sigla in candidatos_eleicao:
            candidatos_por_partido.setdefault(cand.partido_numero, []).append((cand, nome_completo, sigla))

        # 3. Carregar chapas proporcionais cadastradas na eleição
        chapas_entities = self.quociente_repo.list_chapas(eleicao_id)

        if not chapas_entities:
            total_nominais = sum(c[0].votos for c in candidatos_eleicao)
            total_legenda = sum(pe.votos_legenda for pe, _, _ in partidos_eleicao)
            total_validos = total_nominais + total_legenda
            qe_exato = round(total_validos / vagas, 4) if vagas > 0 and total_validos > 0 else 0.0
            if qe_exato > 0:
                frac = round(qe_exato - math.floor(qe_exato), 6)
                qe_arredondado = math.ceil(qe_exato) if frac > 0.5 else math.floor(qe_exato)
            else:
                qe_arredondado = 0

            return CalculoQeResponseDto(
                eleicao_id=eleicao_id,
                ano=ano,
                vagas_vereador=vagas,
                total_votos_nominais=total_nominais,
                total_votos_legenda=total_legenda,
                total_votos_validos=total_validos,
                qe_exato=qe_exato,
                qe_arredondado=qe_arredondado,
                corte_10_qp=round(qe_arredondado * (perc_cand_qp / 100.0), 2),
                corte_80_chapa=round(qe_arredondado * (perc_chapa_sobras / 100.0), 2),
                corte_20_sobras=round(qe_arredondado * (perc_cand_sobras / 100.0), 2),
                total_vagas_qp_distribuidas=0,
                total_vagas_media_distribuidas=0,
                chapas=[],
                memoria_sobras=[],
            )

        # 4. Totalização de Votos Válidos por Chapa
        class ChapaWork:
            def __init__(self, chapa_ent):
                self.entity = chapa_ent
                self.id = chapa_ent.id or 0
                self.nome = chapa_ent.nome
                self.tipo = chapa_ent.tipo
                self.partidos = chapa_ent.partidos or []
                self.partido_ids = [p.partido_id for p in self.partidos]

                self.candidatos_raw = []
                for pid in self.partido_ids:
                    self.candidatos_raw.extend(candidatos_por_partido.get(pid, []))

                self.candidatos_raw.sort(key=lambda x: x[0].votos, reverse=True)

                self.votos_nominais = sum(c[0].votos for c in self.candidatos_raw)
                self.votos_legenda = sum(legenda_por_partido.get(pid, 0) for pid in self.partido_ids)
                self.votos_validos = self.votos_nominais + self.votos_legenda

                self.vagas_qp = 0
                self.eleitos_qp_count = 0
                self.eleitos_media_count = 0
                self.vagas_obtidas = 0

                self.candidato_status = ["SUPLENTE"] * len(self.candidatos_raw)

        chapas_work = [ChapaWork(c) for c in chapas_entities]

        total_nominais = sum(c[0].votos for c in candidatos_eleicao)
        total_legenda = sum(pe.votos_legenda for pe, _, _ in partidos_eleicao)
        total_validos = total_nominais + total_legenda

        # 5. Cálculo do Quociente Eleitoral (QE) e Arredondamento do TSE
        if vagas > 0 and total_validos > 0:
            qe_exato = round(total_validos / vagas, 4)
            frac = round(qe_exato - math.floor(qe_exato), 6)
            if frac > 0.5:
                qe_arredondado = math.ceil(qe_exato)
            else:
                qe_arredondado = math.floor(qe_exato)
        else:
            qe_exato = 0.0
            qe_arredondado = 0

        corte_10_qp = round(qe_arredondado * (perc_cand_qp / 100.0), 2)
        corte_80_chapa = round(qe_arredondado * (perc_chapa_sobras / 100.0), 2)
        corte_20_sobras = round(qe_arredondado * (perc_cand_sobras / 100.0), 2)

        # 6. Cálculo do QP e Preenchimento Direto das Cadeiras
        for ch in chapas_work:
            if qe_arredondado > 0:
                ch.vagas_qp = int(ch.votos_validos // qe_arredondado)
            else:
                ch.vagas_qp = 0

            for idx, (cand, _, _) in enumerate(ch.candidatos_raw):
                if ch.eleitos_qp_count < ch.vagas_qp:
                    if cand.votos >= corte_10_qp:
                        ch.candidato_status[idx] = "ELEITO_QP"
                        ch.eleitos_qp_count += 1

            ch.vagas_obtidas = ch.eleitos_qp_count

        total_vagas_qp = sum(ch.eleitos_qp_count for ch in chapas_work)
        vagas_restantes = max(0, vagas - total_vagas_qp)

        # 7. Distribuição das Sobras (Médias)
        memoria_sobras: List[RodadaSobrasDto] = []

        for rodada_num in range(1, vagas_restantes + 1):
            elegiveis_80_20 = []
            for ch in chapas_work:
                if ch.votos_validos >= corte_80_chapa:
                    tem_cand = any(
                        ch.candidato_status[i] == "SUPLENTE" and ch.candidatos_raw[i][0].votos >= corte_20_sobras
                        for i in range(len(ch.candidatos_raw))
                    )
                    if tem_cand:
                        elegiveis_80_20.append(ch)

            fase_atual = "80/20"
            chapas_disputa = elegiveis_80_20

            if not chapas_disputa and permite_repescagem:
                elegiveis_repescagem = []
                for ch in chapas_work:
                    tem_cand = any(
                        ch.candidato_status[i] == "SUPLENTE"
                        for i in range(len(ch.candidatos_raw))
                    )
                    if tem_cand:
                        elegiveis_repescagem.append(ch)
                chapas_disputa = elegiveis_repescagem
                fase_atual = "REPESCAGEM"

            if not chapas_disputa:
                break

            def get_candidato_da_vez(ch, fase):
                for i in range(len(ch.candidatos_raw)):
                    if ch.candidato_status[i] == "SUPLENTE":
                        if fase == "80/20" and ch.candidatos_raw[i][0].votos < corte_20_sobras:
                            continue
                        return ch.candidatos_raw[i][0].votos, i
                return -1, -1

            melhor_chapa = None
            maior_media = -1.0
            melhor_cand_idx = -1
            melhor_cand_votos = -1

            for ch in chapas_disputa:
                media = ch.votos_validos / (ch.vagas_obtidas + 1)
                cand_votos, cand_idx = get_candidato_da_vez(ch, fase_atual)

                is_melhor = False
                if melhor_chapa is None:
                    is_melhor = True
                elif round(media, 6) > round(maior_media, 6):
                    is_melhor = True
                elif round(media, 6) == round(maior_media, 6):
                    if ch.votos_validos > melhor_chapa.votos_validos:
                        is_melhor = True
                    elif ch.votos_validos == melhor_chapa.votos_validos:
                        if cand_votos > melhor_cand_votos:
                            is_melhor = True

                if is_melhor:
                    melhor_chapa = ch
                    maior_media = media
                    melhor_cand_idx = cand_idx
                    melhor_cand_votos = cand_votos

            if melhor_chapa and melhor_cand_idx >= 0:
                vagas_ant = melhor_chapa.vagas_obtidas
                melhor_chapa.candidato_status[melhor_cand_idx] = "ELEITO_MEDIA"
                melhor_chapa.vagas_obtidas += 1
                melhor_chapa.eleitos_media_count += 1

                cand_obj = melhor_chapa.candidatos_raw[melhor_cand_idx][0]
                memoria_sobras.append(
                    RodadaSobrasDto(
                        rodada=rodada_num,
                        chapa_id=melhor_chapa.id,
                        chapa_nome=melhor_chapa.nome,
                        candidato_nome=cand_obj.nome_urna,
                        candidato_votos=cand_obj.votos,
                        media=round(maior_media, 4),
                        fase=fase_atual,
                        vagas_anteriores=vagas_ant,
                        vagas_finais=melhor_chapa.vagas_obtidas,
                    )
                )

        total_vagas_media = sum(ch.eleitos_media_count for ch in chapas_work)

        # 8. Construção da Resposta Consolidada por Chapa e Ranking
        chapas_consolidadas: List[ChapaConsolidadaQeDto] = []

        for ch in chapas_work:
            ranking_candidatos: List[CandidatoQeDto] = []
            for idx, (cand, nome_comp, sigla_cand) in enumerate(ch.candidatos_raw):
                st_calc = ch.candidato_status[idx]
                pct_qe = round((cand.votos / qe_arredondado) * 100, 2) if qe_arredondado > 0 else 0.0
                at_10 = cand.votos >= corte_10_qp
                at_20 = cand.votos >= corte_20_sobras

                sit_oficial = (cand.situacao or "").upper()
                is_oficial_eleito = "ELEITO" in sit_oficial and "NÃO" not in sit_oficial
                coincide = (is_oficial_eleito and st_calc in ["ELEITO_QP", "ELEITO_MEDIA"]) or (
                    not is_oficial_eleito and st_calc == "SUPLENTE"
                )

                ranking_candidatos.append(
                    CandidatoQeDto(
                        posicao_ranking=idx + 1,
                        titulo_eleitor=cand.titulo_eleitor,
                        nome_urna=cand.nome_urna,
                        nome_completo=nome_comp,
                        numero_urna=cand.numero_urna,
                        partido_numero=cand.partido_numero,
                        sigla_partido=sigla_cand,
                        votos=cand.votos,
                        percentual_qe=pct_qe,
                        atingiu_10_qp=at_10,
                        atingiu_20_sobras=at_20,
                        status_calculado=st_calc,
                        situacao_oficial=cand.situacao,
                        coincide_oficial=coincide,
                    )
                )

            pct_validos = round((ch.votos_validos / total_validos) * 100, 2) if total_validos > 0 else 0.0
            qp_exato = round(ch.votos_validos / qe_arredondado, 2) if qe_arredondado > 0 else 0.0
            media_final = round(ch.votos_validos / (ch.vagas_obtidas + 1), 2)
            tot_eleitos = ch.eleitos_qp_count + ch.eleitos_media_count

            partidos_membros_dto = [
                ChapaProporcionalPartidoDto(
                    id=p.id or 0,
                    partido_id=p.partido_id,
                    numero=p.numero or p.partido_id,
                    sigla=p.sigla or str(p.partido_id),
                    nome=p.nome,
                    votos_nominais=p.votos_nominais,
                    votos_legenda=p.votos_legenda,
                    total_votos=p.total_votos,
                )
                for p in ch.partidos
            ]

            chapas_consolidadas.append(
                ChapaConsolidadaQeDto(
                    id=ch.id,
                    nome=ch.nome,
                    tipo=ch.tipo,
                    partidos=partidos_membros_dto,
                    votos_nominais=ch.votos_nominais,
                    votos_legenda=ch.votos_legenda,
                    votos_validos_total=ch.votos_validos,
                    percentual_votos_validos=pct_validos,
                    qp_exato=qp_exato,
                    vagas_qp=ch.vagas_qp,
                    eleitos_qp=ch.eleitos_qp_count,
                    eleitos_media=ch.eleitos_media_count,
                    total_eleitos=tot_eleitos,
                    atingiu_80_qe=(ch.votos_validos >= corte_80_chapa),
                    media_final=media_final,
                    ranking_candidatos=ranking_candidatos,
                )
            )

        chapas_consolidadas.sort(key=lambda x: (x.total_eleitos, x.votos_validos_total), reverse=True)

        return CalculoQeResponseDto(
            eleicao_id=eleicao_id,
            ano=ano,
            vagas_vereador=vagas,
            total_votos_nominais=total_nominais,
            total_votos_legenda=total_legenda,
            total_votos_validos=total_validos,
            qe_exato=qe_exato,
            qe_arredondado=qe_arredondado,
            corte_10_qp=corte_10_qp,
            corte_80_chapa=corte_80_chapa,
            corte_20_sobras=corte_20_sobras,
            total_vagas_qp_distribuidas=total_vagas_qp,
            total_vagas_media_distribuidas=total_vagas_media,
            chapas=chapas_consolidadas,
            memoria_sobras=memoria_sobras,
        )


