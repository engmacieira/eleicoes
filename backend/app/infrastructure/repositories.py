from typing import List, Optional, Tuple, Union, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, asc, func
from ..domain.entities import (
    DadosCandidatoEntity,
    EleicaoEntity,
    DetalhesVotacaoEntity,
    PartidosEntity,
    PartidoHistoricoEntity,
    PartidosEleicaoEntity,
    CandidatosEleicaoEntity,
    ColigacaoEntity,
    ColigacaoPartidoEntity,
    ParametrosQeEntity,
    ChapaProporcionalEntity,
    ChapaProporcionalPartidoEntity,
)
from ..domain.repositories import (
    IEleicaoRepository,
    ICandidatoRepository,
    IPartidoRepository,
    IColigacaoRepository,
    IQuocienteEleitoralRepository,
)
from .models import (
    DadosCandidato,
    Eleicao,
    DetalhesVotacao,
    Partidos,
    PartidoHistorico,
    PartidosEleicao,
    CandidatosEleicao,
    Coligacao,
    ColigacaoPartidos,
    ParametrosQeEleicao,
    ChapaProporcional,
    ChapaProporcionalPartidos,
)


class SqlAlchemyEleicaoRepository(IEleicaoRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_all(self, ano: Optional[int] = None) -> List[EleicaoEntity]:
        stmt = select(Eleicao).where(Eleicao.is_deleted.is_(False)).order_by(desc(Eleicao.ano))
        if ano:
            stmt = stmt.where(Eleicao.ano == ano)

        results = self.db.scalars(stmt).all()
        return [
            EleicaoEntity(
                id=e.id,
                ano=e.ano,
                is_active=e.is_active,
                is_deleted=e.is_deleted,
            )
            for e in results
        ]

    def get_by_ano(self, ano: int) -> Optional[EleicaoEntity]:
        stmt = select(Eleicao).where(Eleicao.ano == ano, Eleicao.is_deleted.is_(False))
        e = self.db.scalars(stmt).first()
        if not e:
            return None
        return EleicaoEntity(
            id=e.id,
            ano=e.ano,
            is_active=e.is_active,
            is_deleted=e.is_deleted,
        )

    def get_detalhes(self, id_eleicao: int, cargo: Optional[str] = None) -> List[DetalhesVotacaoEntity]:
        stmt = (
            select(DetalhesVotacao)
            .where(DetalhesVotacao.id_eleicao == id_eleicao, DetalhesVotacao.is_deleted.is_(False))
        )
        if cargo:
            stmt = stmt.where(DetalhesVotacao.cargo.ilike(cargo))

        results = self.db.scalars(stmt).all()
        return [
            DetalhesVotacaoEntity(
                id=d.id,
                id_eleicao=d.id_eleicao,
                cargo=d.cargo,
                aptos=d.aptos,
                comparecimento=d.comparecimento,
                abstencoes=d.abstencoes,
                validos=d.validos,
                brancos=d.brancos,
                nulos=d.nulos,
                is_active=d.is_active,
                is_deleted=d.is_deleted,
            )
            for d in results
        ]

    def create(self, ano: int) -> EleicaoEntity:
        existing = self.db.scalar(select(Eleicao).where(Eleicao.ano == ano))
        if existing:
            if existing.is_deleted:
                existing.is_deleted = False
                existing.is_active = True
                self.db.commit()
                self.db.refresh(existing)
                return EleicaoEntity(id=existing.id, ano=existing.ano, is_active=existing.is_active, is_deleted=existing.is_deleted)
            raise ValueError(f"Eleição do ano {ano} já está cadastrada.")

        obj = Eleicao(ano=ano, is_active=True, is_deleted=False)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return EleicaoEntity(id=obj.id, ano=obj.ano, is_active=obj.is_active, is_deleted=obj.is_deleted)

    def soft_delete(self, id: int) -> bool:
        obj = self.db.scalar(select(Eleicao).where(Eleicao.id == id, Eleicao.is_deleted.is_(False)))
        if not obj:
            return False
        obj.is_deleted = True
        obj.is_active = False
        self.db.commit()
        return True


class SqlAlchemyCandidatoRepository(ICandidatoRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_titulo(self, titulo_eleitor: str) -> Optional[DadosCandidatoEntity]:
        stmt = select(DadosCandidato).where(
            DadosCandidato.titulo_eleitor == titulo_eleitor,
            DadosCandidato.is_deleted.is_(False),
        )
        c = self.db.scalars(stmt).first()
        if not c:
            return None
        return DadosCandidatoEntity(
            titulo_eleitor=c.titulo_eleitor,
            nome_completo=c.nome_completo,
            data_nascimento=c.data_nascimento,
            is_active=c.is_active,
            is_deleted=c.is_deleted,
        )

    def search(self, query: str, limit: int = 15) -> List[DadosCandidatoEntity]:
        termo = f"%{query.strip()}%"
        stmt = (
            select(DadosCandidato)
            .where(
                DadosCandidato.is_deleted.is_(False),
                (DadosCandidato.nome_completo.ilike(termo))
                | (DadosCandidato.titulo_eleitor.ilike(termo)),
            )
            .limit(limit)
        )
        results = self.db.scalars(stmt).all()
        return [
            DadosCandidatoEntity(
                titulo_eleitor=c.titulo_eleitor,
                nome_completo=c.nome_completo,
                data_nascimento=c.data_nascimento,
                is_active=c.is_active,
                is_deleted=c.is_deleted,
            )
            for c in results
        ]

    def list_paginated(
        self, search: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> Tuple[int, List[DadosCandidatoEntity]]:
        base_stmt = select(DadosCandidato).where(DadosCandidato.is_deleted.is_(False))
        if search:
            termo = f"%{search.strip()}%"
            base_stmt = base_stmt.where(
                (DadosCandidato.nome_completo.ilike(termo))
                | (DadosCandidato.titulo_eleitor.ilike(termo))
            )

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = self.db.scalar(count_stmt) or 0

        query_stmt = base_stmt.order_by(asc(DadosCandidato.nome_completo)).offset(skip).limit(limit)
        results = self.db.scalars(query_stmt).all()

        entities = [
            DadosCandidatoEntity(
                titulo_eleitor=c.titulo_eleitor,
                nome_completo=c.nome_completo,
                data_nascimento=c.data_nascimento,
                is_active=c.is_active,
                is_deleted=c.is_deleted,
            )
            for c in results
        ]
        return total, entities

    def create(self, entity: DadosCandidatoEntity) -> DadosCandidatoEntity:
        existing = self.db.scalar(
            select(DadosCandidato).where(DadosCandidato.titulo_eleitor == entity.titulo_eleitor)
        )
        if existing:
            if existing.is_deleted:
                existing.nome_completo = entity.nome_completo
                existing.data_nascimento = entity.data_nascimento
                existing.is_deleted = False
                existing.is_active = True
                self.db.commit()
                self.db.refresh(existing)
                return DadosCandidatoEntity(
                    titulo_eleitor=existing.titulo_eleitor,
                    nome_completo=existing.nome_completo,
                    data_nascimento=existing.data_nascimento,
                    is_active=existing.is_active,
                    is_deleted=existing.is_deleted,
                )
            raise ValueError(f"Candidato com título {entity.titulo_eleitor} já existe.")

        obj = DadosCandidato(
            titulo_eleitor=entity.titulo_eleitor,
            nome_completo=entity.nome_completo,
            data_nascimento=entity.data_nascimento,
            is_active=entity.is_active,
            is_deleted=False,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return DadosCandidatoEntity(
            titulo_eleitor=obj.titulo_eleitor,
            nome_completo=obj.nome_completo,
            data_nascimento=obj.data_nascimento,
            is_active=obj.is_active,
            is_deleted=obj.is_deleted,
        )

    def update(
        self,
        titulo_eleitor: str,
        nome_completo: Optional[str] = None,
        data_nascimento: Optional[date] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[DadosCandidatoEntity]:
        obj = self.db.scalar(
            select(DadosCandidato).where(
                DadosCandidato.titulo_eleitor == titulo_eleitor,
                DadosCandidato.is_deleted.is_(False),
            )
        )
        if not obj:
            return None

        if nome_completo is not None:
            obj.nome_completo = nome_completo
        if data_nascimento is not None:
            obj.data_nascimento = data_nascimento
        if is_active is not None:
            obj.is_active = is_active

        self.db.commit()
        self.db.refresh(obj)
        return DadosCandidatoEntity(
            titulo_eleitor=obj.titulo_eleitor,
            nome_completo=obj.nome_completo,
            data_nascimento=obj.data_nascimento,
            is_active=obj.is_active,
            is_deleted=obj.is_deleted,
        )

    def soft_delete(self, titulo_eleitor: str) -> bool:
        obj = self.db.scalar(
            select(DadosCandidato).where(
                DadosCandidato.titulo_eleitor == titulo_eleitor,
                DadosCandidato.is_deleted.is_(False),
            )
        )
        if not obj:
            return False
        obj.is_deleted = True
        obj.is_active = False
        self.db.commit()
        return True

    def get_historico_participacoes(
        self, titulo_eleitor: str
    ) -> List[Tuple[CandidatosEleicaoEntity, int, str, Optional[str]]]:
        stmt = (
            select(CandidatosEleicao, Eleicao.ano, Partidos.sigla_atual, Partidos.nome_atual)
            .join(Eleicao, CandidatosEleicao.id_eleicao == Eleicao.id)
            .outerjoin(
                Partidos,
                CandidatosEleicao.partido_numero == Partidos.numero,
            )
            .where(
                CandidatosEleicao.titulo_eleitor == titulo_eleitor,
                CandidatosEleicao.is_deleted.is_(False),
                Eleicao.is_deleted.is_(False),
            )
            .order_by(asc(Eleicao.ano))
        )
        rows = self.db.execute(stmt).all()
        result = []
        for cand, ano, sigla_atual, _ in rows:
            entity = CandidatosEleicaoEntity(
                id=cand.id,
                titulo_eleitor=cand.titulo_eleitor,
                id_eleicao=cand.id_eleicao,
                partido_numero=cand.partido_numero,
                cargo=cand.cargo,
                numero_urna=cand.numero_urna,
                nome_urna=cand.nome_urna,
                votos=cand.votos,
                situacao=cand.situacao,
                posicao=cand.posicao,
                sigla_epoca=cand.sigla_epoca,
                is_active=cand.is_active,
                is_deleted=cand.is_deleted,
            )
            sigla_exibicao = cand.sigla_epoca or sigla_atual or "S/P"
            result.append((entity, ano, sigla_exibicao, sigla_atual))
        return result

    def get_resultados_pleito(
        self, id_eleicao: int, cargo: str, partido_termo: Optional[Union[str, int]] = None
    ) -> List[Tuple[CandidatosEleicaoEntity, str, str, Optional[str]]]:
        stmt = (
            select(
                CandidatosEleicao,
                DadosCandidato.nome_completo,
                Partidos.sigla_atual,
                Partidos.nome_atual,
            )
            .join(DadosCandidato, CandidatosEleicao.titulo_eleitor == DadosCandidato.titulo_eleitor)
            .outerjoin(
                Partidos,
                CandidatosEleicao.partido_numero == Partidos.numero,
            )
            .where(
                CandidatosEleicao.id_eleicao == id_eleicao,
                CandidatosEleicao.cargo.ilike(cargo),
                CandidatosEleicao.is_deleted.is_(False),
                DadosCandidato.is_deleted.is_(False),
            )
        )

        if partido_termo is not None:
            termo_str = str(partido_termo).strip()
            if termo_str.isdigit():
                num = int(termo_str)
                stmt = stmt.where(
                    (CandidatosEleicao.partido_numero == num)
                    | (Partidos.numero == num)
                )
            else:
                termo_upper = termo_str.upper()
                termo_clean = termo_upper.replace(" ", "")
                # Find matching partido numeros
                p_nums = self.db.scalars(
                    select(Partidos.numero).where(
                        (func.upper(Partidos.sigla_atual) == termo_upper)
                        | (func.replace(func.upper(Partidos.sigla_atual), ' ', '') == termo_clean)
                        | (func.upper(Partidos.nome_atual).contains(termo_upper)),
                        Partidos.is_deleted.is_(False),
                    )
                ).all()
                h_nums = self.db.scalars(
                    select(PartidoHistorico.partido_numero).where(
                        (func.upper(PartidoHistorico.sigla) == termo_upper)
                        | (func.replace(func.upper(PartidoHistorico.sigla), ' ', '') == termo_clean)
                        | (func.upper(PartidoHistorico.nome).contains(termo_upper)),
                        PartidoHistorico.is_deleted.is_(False),
                    )
                ).all()
                all_nums = list(set([n for n in (list(p_nums) + list(h_nums)) if n is not None]))
                if all_nums:
                    stmt = stmt.where(
                        (CandidatosEleicao.partido_numero.in_(all_nums))
                        | (CandidatosEleicao.sigla_epoca.ilike(f"%{termo_str}%"))
                    )
                else:
                    stmt = stmt.where(CandidatosEleicao.sigla_epoca.ilike(f"%{termo_str}%"))

        stmt = stmt.order_by(
            asc(CandidatosEleicao.posicao).nulls_last(),
            desc(CandidatosEleicao.votos),
        )
        rows = self.db.execute(stmt).all()
        result = []
        for cand, nome_completo, sigla_atual, _ in rows:
            entity = CandidatosEleicaoEntity(
                id=cand.id,
                titulo_eleitor=cand.titulo_eleitor,
                id_eleicao=cand.id_eleicao,
                partido_numero=cand.partido_numero,
                cargo=cand.cargo,
                numero_urna=cand.numero_urna,
                nome_urna=cand.nome_urna,
                votos=cand.votos,
                situacao=cand.situacao,
                posicao=cand.posicao,
                sigla_epoca=cand.sigla_epoca,
                is_active=cand.is_active,
                is_deleted=cand.is_deleted,
            )
            sigla_exibicao = cand.sigla_epoca or sigla_atual or "S/P"
            result.append((entity, nome_completo, sigla_exibicao, sigla_atual))
        return result


class SqlAlchemyPartidoRepository(IPartidoRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, p: Partidos) -> PartidosEntity:
        historico_entities = [
            PartidoHistoricoEntity(
                id=h.id,
                partido_numero=h.partido_numero or p.numero,
                sigla=h.sigla,
                nome=h.nome,
                ano_inicio=h.ano_inicio,
                ano_fim=h.ano_fim,
                is_atual=h.is_atual,
                is_active=h.is_active,
                is_deleted=h.is_deleted,
            )
            for h in (p.historico_nomes or [])
            if not h.is_deleted
        ]
        siglas_anteriores = [
            h.sigla for h in historico_entities
            if h.sigla and h.sigla.strip().upper() != (p.sigla_atual or "").strip().upper()
        ]
        return PartidosEntity(
            id=p.id,
            numero=p.numero,
            sigla_atual=p.sigla_atual,
            nome_atual=p.nome_atual,
            siglas_anteriores=list(dict.fromkeys(siglas_anteriores)),
            historico=historico_entities,
            is_active=p.is_active,
            is_deleted=p.is_deleted,
        )

    def list_all(self, q: Optional[str] = None) -> List[PartidosEntity]:
        stmt = (
            select(Partidos)
            .where(Partidos.is_deleted.is_(False))
            .order_by(asc(Partidos.numero))
        )
        if q:
            termo = q.strip()
            if termo.isdigit():
                stmt = stmt.where(Partidos.numero == int(termo))
            else:
                termo_clean = termo.upper().replace(" ", "")
                # subquery for partidos with matching history
                matching_hist_nums = select(PartidoHistorico.partido_numero).where(
                    (func.upper(PartidoHistorico.sigla).contains(termo.upper()))
                    | (func.replace(func.upper(PartidoHistorico.sigla), ' ', '').contains(termo_clean))
                    | (func.upper(PartidoHistorico.nome).contains(termo.upper())),
                    PartidoHistorico.is_deleted.is_(False),
                )
                stmt = stmt.where(
                    (Partidos.sigla_atual.ilike(f"%{termo}%"))
                    | (func.replace(func.upper(Partidos.sigla_atual), ' ', '').contains(termo_clean))
                    | (Partidos.nome_atual.ilike(f"%{termo}%"))
                    | (Partidos.numero.in_(matching_hist_nums))
                )

        results = self.db.scalars(stmt).all()
        return [self._to_entity(p) for p in results]

    def get_by_id(self, id: int) -> Optional[PartidosEntity]:
        p = self.db.scalar(select(Partidos).where(Partidos.id == id, Partidos.is_deleted.is_(False)))
        return self._to_entity(p) if p else None

    def get_by_numero(self, numero: int) -> Optional[PartidosEntity]:
        p = self.db.scalar(select(Partidos).where(Partidos.numero == numero, Partidos.is_deleted.is_(False)))
        return self._to_entity(p) if p else None

    def resolve_partido(self, termo: Union[str, int]) -> Optional[PartidosEntity]:
        """Resolve indistintamente número TSE (70), sigla atual (AVANTE) ou sigla histórica (PT do B)."""
        termo_str = str(termo).strip()
        if not termo_str:
            return None

        # 1. Se for numérico, buscar por número exato
        if termo_str.isdigit():
            p = self.get_by_numero(int(termo_str))
            if p:
                return p

        termo_upper = termo_str.upper()
        termo_clean = termo_upper.replace(" ", "")

        # 2. Buscar exato por sigla_atual
        p = self.db.scalar(
            select(Partidos).where(
                func.upper(Partidos.sigla_atual) == termo_upper,
                Partidos.is_deleted.is_(False),
            )
        )
        if p:
            return self._to_entity(p)

        # 3. Buscar com espaços normalizados por sigla_atual
        p = self.db.scalar(
            select(Partidos).where(
                func.replace(func.upper(Partidos.sigla_atual), ' ', '') == termo_clean,
                Partidos.is_deleted.is_(False),
            )
        )
        if p:
            return self._to_entity(p)

        # 4. Buscar exato em PartidoHistorico (sigla)
        h = self.db.scalar(
            select(PartidoHistorico).where(
                (func.upper(PartidoHistorico.sigla) == termo_upper)
                | (func.replace(func.upper(PartidoHistorico.sigla), ' ', '') == termo_clean),
                PartidoHistorico.is_deleted.is_(False),
            )
        )
        if h:
            num = h.partido_numero or h.numero
            if num:
                p = self.get_by_numero(num)
                if p:
                    return p
            if h.id_partido:
                p = self.get_by_id(h.id_partido)
                if p:
                    return p

        # 5. Buscar por nome_atual exato ou histórico
        p = self.db.scalar(
            select(Partidos).where(
                func.upper(Partidos.nome_atual) == termo_upper,
                Partidos.is_deleted.is_(False),
            )
        )
        if p:
            return self._to_entity(p)

        h_nome = self.db.scalar(
            select(PartidoHistorico).where(
                func.upper(PartidoHistorico.nome) == termo_upper,
                PartidoHistorico.is_deleted.is_(False),
            )
        )
        if h_nome:
            num = h_nome.partido_numero or h_nome.numero
            if num:
                p = self.get_by_numero(num)
                if p:
                    return p

        # 6. Fallback com ilike
        p = self.db.scalar(
            select(Partidos).where(
                (Partidos.sigla_atual.ilike(f"%{termo_str}%"))
                | (Partidos.nome_atual.ilike(f"%{termo_str}%")),
                Partidos.is_deleted.is_(False),
            )
        )
        if p:
            return self._to_entity(p)

        return None

    def get_linha_do_tempo(self, termo: Union[str, int]) -> Optional[dict]:
        partido = self.resolve_partido(termo)
        if not partido:
            return None

        # Carregar todas as eleições
        eleicoes = self.db.scalars(
            select(Eleicao).where(Eleicao.is_deleted.is_(False)).order_by(asc(Eleicao.ano))
        ).all()

        linha_do_tempo_eleicoes = []
        total_votos_historico = 0
        total_candidatos_historico = 0
        total_eleitos_historico = 0
        eleitos_prefeito_historico = 0
        eleitos_vereador_historico = 0

        for eleicao in eleicoes:
            # 1. Candidatos do partido nesta eleição
            cand_rows = self.db.execute(
                select(CandidatosEleicao, DadosCandidato.nome_completo)
                .join(DadosCandidato, CandidatosEleicao.titulo_eleitor == DadosCandidato.titulo_eleitor)
                .where(
                    CandidatosEleicao.id_eleicao == eleicao.id,
                    CandidatosEleicao.partido_numero == partido.numero,
                    CandidatosEleicao.is_deleted.is_(False),
                )
                .order_by(asc(CandidatosEleicao.cargo), desc(CandidatosEleicao.votos))
            ).all()

            # 2. Desempenho do partido nesta eleição
            desemp = self.db.scalar(
                select(PartidosEleicao).where(
                    PartidosEleicao.id_eleicao == eleicao.id,
                    PartidosEleicao.partido_numero == partido.numero,
                    PartidosEleicao.is_deleted.is_(False),
                )
            )

            # 3. Coligação em que o partido participou nesta eleição
            colig_membro = self.db.scalar(
                select(Coligacao)
                .join(ColigacaoPartidos, ColigacaoPartidos.id_coligacao == Coligacao.id)
                .where(
                    Coligacao.id_eleicao == eleicao.id,
                    (ColigacaoPartidos.partido_numero == partido.numero)
                    | (Coligacao.partido_numero_titular == partido.numero),
                    Coligacao.is_deleted.is_(False),
                )
            )

            if not cand_rows and not desemp and not colig_membro:
                continue

            candidatos_list = []
            siglas_usadas = set()
            for cand, nome_completo in cand_rows:
                sigla_c = cand.sigla_epoca or partido.sigla_atual
                siglas_usadas.add(sigla_c)
                total_candidatos_historico += 1
                is_eleito = "ELEITO" in (cand.situacao or "").upper()
                if is_eleito:
                    total_eleitos_historico += 1
                    if "PREFEITO" in (cand.cargo or "").upper():
                        eleitos_prefeito_historico += 1
                    elif "VEREADOR" in (cand.cargo or "").upper():
                        eleitos_vereador_historico += 1

                candidatos_list.append({
                    "id": cand.id,
                    "titulo_eleitor": cand.titulo_eleitor,
                    "nome_completo": nome_completo,
                    "nome_urna": cand.nome_urna,
                    "numero_urna": cand.numero_urna,
                    "cargo": cand.cargo,
                    "votos": cand.votos,
                    "situacao": cand.situacao,
                    "posicao": cand.posicao,
                    "sigla_epoca": cand.sigla_epoca,
                })

            votos_nom = desemp.votos_nominais if desemp else sum(c["votos"] for c in candidatos_list)
            votos_leg = desemp.votos_legenda if desemp else 0
            tot_votos = desemp.total_votos if desemp else (votos_nom + votos_leg)
            total_votos_historico += tot_votos

            sigla_vigente = next(iter(siglas_usadas)) if siglas_usadas else partido.sigla_atual

            linha_do_tempo_eleicoes.append({
                "ano": eleicao.ano,
                "id_eleicao": eleicao.id,
                "sigla_vigente": sigla_vigente,
                "is_rebranded": sigla_vigente.upper() != (partido.sigla_atual or "").upper(),
                "nome_coligacao": colig_membro.nome_coligacao if colig_membro else None,
                "composicao_coligacao": colig_membro.composicao_siglas if colig_membro else None,
                "votos_nominais": votos_nom,
                "votos_legenda": votos_leg,
                "total_votos": tot_votos,
                "total_candidatos": len(candidatos_list),
                "candidatos": candidatos_list,
            })

        return {
            "partido": {
                "id": partido.id,
                "numero": partido.numero,
                "sigla": partido.sigla,
                "sigla_atual": partido.sigla_atual,
                "nome": partido.nome,
                "nome_atual": partido.nome_atual,
                "siglas_anteriores": partido.siglas_anteriores,
                "historico": [
                    {
                        "id": h.id,
                        "partido_numero": partido.numero,
                        "numero": partido.numero,
                        "sigla": h.sigla,
                        "nome": h.nome,
                        "ano_inicio": h.ano_inicio,
                        "ano_fim": h.ano_fim,
                        "is_atual": h.is_atual,
                        "is_active": h.is_active,
                        "is_deleted": h.is_deleted,
                    }
                    for h in (partido.historico or [])
                ],
            },
            "estatisticas_gerais": {
                "total_votos_historico": total_votos_historico,
                "total_eleicoes_disputadas": len(linha_do_tempo_eleicoes),
                "total_candidatos_historico": total_candidatos_historico,
                "total_eleitos_historico": total_eleitos_historico,
                "eleitos_prefeito": eleitos_prefeito_historico,
                "eleitos_vereador": eleitos_vereador_historico,
            },
            "eleicoes": linha_do_tempo_eleicoes,
        }

    def create(
        self,
        numero: int,
        sigla: str,
        nome: Optional[str] = None,
        sigla_atual: Optional[str] = None,
        nome_atual: Optional[str] = None,
        historico: Optional[List[dict]] = None,
    ) -> PartidosEntity:
        sigla_clean = (sigla_atual or sigla).strip().upper()
        nome_clean = (nome_atual or nome).strip() if (nome_atual or nome) else None

        existing_num = self.db.scalar(select(Partidos).where(Partidos.numero == numero))
        if existing_num:
            if existing_num.is_deleted:
                existing_num.is_deleted = False
                existing_num.is_active = True
                existing_num.sigla_atual = sigla_clean
                existing_num.nome_atual = nome_clean
                self.db.commit()
                self.db.refresh(existing_num)
                return self._to_entity(existing_num)
            raise ValueError(f"Partido com o número eleitoral {numero} já está cadastrado.")

        obj = Partidos(
            numero=numero,
            sigla_atual=sigla_clean,
            nome_atual=nome_clean,
            is_active=True,
            is_deleted=False,
        )
        self.db.add(obj)
        self.db.flush()

        # Add historical names if provided
        if historico:
            for h in historico:
                h_obj = PartidoHistorico(
                    id_partido=obj.id,
                    partido_numero=numero,
                    numero=numero,
                    sigla=h.get("sigla", "").strip().upper(),
                    nome=h.get("nome"),
                    ano_inicio=h.get("ano_inicio"),
                    ano_fim=h.get("ano_fim"),
                    is_atual=h.get("is_atual", False),
                    is_active=True,
                    is_deleted=False,
                )
                self.db.add(h_obj)

        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def update(
        self,
        id: int,
        numero: Optional[int] = None,
        sigla: Optional[str] = None,
        nome: Optional[str] = None,
        sigla_atual: Optional[str] = None,
        nome_atual: Optional[str] = None,
        is_active: Optional[bool] = None,
        historico: Optional[List[dict]] = None,
    ) -> Optional[PartidosEntity]:
        obj = self.db.scalar(select(Partidos).where(Partidos.id == id, Partidos.is_deleted.is_(False)))
        if not obj:
            return None

        if numero is not None and numero != obj.numero:
            existing_num = self.db.scalar(
                select(Partidos).where(Partidos.numero == numero, Partidos.id != id, Partidos.is_deleted.is_(False))
            )
            if existing_num:
                raise ValueError(f"Já existe outro partido com o número {numero}.")
            obj.numero = numero

        s_val = sigla_atual if sigla_atual is not None else sigla
        if s_val is not None:
            obj.sigla_atual = s_val.strip().upper()

        n_val = nome_atual if nome_atual is not None else nome
        if n_val is not None:
            obj.nome_atual = n_val.strip() if n_val else None

        if is_active is not None:
            obj.is_active = is_active

        if historico is not None:
            for existing_h in obj.historico_nomes:
                existing_h.is_deleted = True
                existing_h.is_active = False

            for h in historico:
                h_obj = PartidoHistorico(
                    id_partido=obj.id,
                    partido_numero=obj.numero,
                    numero=obj.numero,
                    sigla=h.get("sigla", "").strip().upper(),
                    nome=h.get("nome"),
                    ano_inicio=h.get("ano_inicio"),
                    ano_fim=h.get("ano_fim"),
                    is_atual=h.get("is_atual", False),
                    is_active=True,
                    is_deleted=False,
                )
                self.db.add(h_obj)

        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def soft_delete(self, id: int) -> bool:
        obj = self.db.scalar(select(Partidos).where(Partidos.id == id, Partidos.is_deleted.is_(False)))
        if not obj:
            return False
        obj.is_deleted = True
        obj.is_active = False
        for h in obj.historico_nomes:
            h.is_deleted = True
            h.is_active = False
        self.db.commit()
        return True

    def get_desempenho_por_eleicao(
        self, id_eleicao: int
    ) -> List[Tuple[PartidosEleicaoEntity, str, Optional[str]]]:
        stmt = (
            select(PartidosEleicao, Partidos.sigla_atual, Partidos.nome_atual)
            .join(
                Partidos,
                PartidosEleicao.partido_numero == Partidos.numero,
            )
            .where(
                PartidosEleicao.id_eleicao == id_eleicao,
                PartidosEleicao.is_deleted.is_(False),
                Partidos.is_deleted.is_(False),
            )
            .order_by(desc(PartidosEleicao.total_votos))
        )
        rows = self.db.execute(stmt).all()
        result = []
        for p, sigla, nome in rows:
            entity = PartidosEleicaoEntity(
                id=p.id,
                id_eleicao=p.id_eleicao,
                partido_numero=p.partido_numero,
                votos_nominais=p.votos_nominais,
                votos_legenda=p.votos_legenda,
                total_votos=p.total_votos,
                is_active=p.is_active,
                is_deleted=p.is_deleted,
            )
            result.append((entity, sigla, nome))
        return result


class SqlAlchemyColigacaoRepository(IColigacaoRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_by_eleicao(
        self, ano: Optional[int] = None, partido_termo: Optional[Union[str, int]] = None
    ) -> List[ColigacaoEntity]:
        stmt = (
            select(Coligacao, Eleicao.ano)
            .join(Eleicao, Coligacao.id_eleicao == Eleicao.id)
            .where(Coligacao.is_deleted.is_(False))
            .order_by(desc(Eleicao.ano), asc(Coligacao.numero_urna))
        )
        if ano:
            stmt = stmt.where(Eleicao.ano == ano)

        if partido_termo is not None:
            termo_str = str(partido_termo).strip()
            if termo_str.isdigit():
                num = int(termo_str)
                stmt = stmt.where(
                    (Coligacao.partido_numero_titular == num)
                    | (
                        Coligacao.id.in_(
                            select(ColigacaoPartidos.id_coligacao).where(
                                ColigacaoPartidos.partido_numero == num,
                                ColigacaoPartidos.is_deleted.is_(False),
                            )
                        )
                    )
                )
            else:
                termo_upper = termo_str.upper()
                termo_clean = termo_upper.replace(" ", "")
                matching_nums = list(self.db.scalars(
                    select(Partidos.numero).where(
                        (func.upper(Partidos.sigla_atual) == termo_upper)
                        | (func.replace(func.upper(Partidos.sigla_atual), ' ', '') == termo_clean)
                        | (func.upper(Partidos.nome_atual).contains(termo_upper)),
                        Partidos.is_deleted.is_(False),
                    )
                ).all())
                hist_nums = list(self.db.scalars(
                    select(PartidoHistorico.partido_numero).where(
                        (func.upper(PartidoHistorico.sigla) == termo_upper)
                        | (func.replace(func.upper(PartidoHistorico.sigla), ' ', '') == termo_clean)
                        | (func.upper(PartidoHistorico.nome).contains(termo_upper)),
                        PartidoHistorico.is_deleted.is_(False),
                    )
                ).all())
                all_nums = list(set([n for n in (matching_nums + hist_nums) if n is not None]))
                if all_nums:
                    stmt = stmt.where(
                        (Coligacao.partido_numero_titular.in_(all_nums))
                        | (Coligacao.sigla_partido_titular.ilike(f"%{termo_str}%"))
                        | (
                            Coligacao.id.in_(
                                select(ColigacaoPartidos.id_coligacao).where(
                                    ColigacaoPartidos.partido_numero.in_(all_nums),
                                    ColigacaoPartidos.is_deleted.is_(False),
                                )
                            )
                        )
                    )
                else:
                    stmt = stmt.where(
                        (Coligacao.sigla_partido_titular.ilike(f"%{termo_str}%"))
                        | (Coligacao.composicao_siglas.ilike(f"%{termo_str}%"))
                    )

        results = self.db.execute(stmt).all()
        coligacoes = []

        for c, ano_val in results:
            # Carregar membros com partido_numero, sigla_epoca e dados canônicos de Partidos
            membros_stmt = (
                select(
                    ColigacaoPartidos,
                    Partidos.numero,
                    Partidos.sigla_atual,
                )
                .outerjoin(
                    Partidos,
                    ColigacaoPartidos.partido_numero == Partidos.numero,
                )
                .where(
                    ColigacaoPartidos.id_coligacao == c.id,
                    ColigacaoPartidos.is_deleted.is_(False),
                )
                .order_by(asc(Partidos.numero), asc(ColigacaoPartidos.sigla_epoca))
            )
            membros_rows = self.db.execute(membros_stmt).all()
            membros_entities = []
            for m, p_numero, sigla_atual in membros_rows:
                num_final = m.partido_numero or p_numero
                sigla_epoca_final = m.sigla_epoca or sigla_atual or ""
                sigla_atual_final = sigla_atual or sigla_epoca_final

                # Formatação inteligente do nome:
                # Se a sigla da época for diferente da atual: "PT do B (atual AVANTE - 70)"
                # Se for igual ou sem rebranding: "AVANTE (70)"
                if sigla_epoca_final and sigla_atual_final and sigla_epoca_final.upper() != sigla_atual_final.upper():
                    nome_formatado = f"{sigla_epoca_final} (atual {sigla_atual_final} - {num_final})"
                elif num_final:
                    nome_formatado = f"{sigla_atual_final} ({num_final})"
                else:
                    nome_formatado = sigla_epoca_final or "S/P"

                membros_entities.append(
                    ColigacaoPartidoEntity(
                        id=m.id,
                        id_coligacao=m.id_coligacao,
                        partido_numero=num_final,
                        papel=m.papel,
                        sigla_epoca=sigla_epoca_final,
                        sigla_atual=sigla_atual_final,
                        nome_formatado=nome_formatado,
                        sigla=sigla_epoca_final or sigla_atual_final,
                        is_active=m.is_active,
                        is_deleted=m.is_deleted,
                    )
                )

            coligacoes.append(
                ColigacaoEntity(
                    id=c.id,
                    id_eleicao=c.id_eleicao,
                    cargo=c.cargo,
                    numero_urna=c.numero_urna,
                    nome_coligacao=c.nome_coligacao,
                    partido_numero_titular=c.partido_numero_titular,
                    sigla_partido_titular=c.sigla_partido_titular,
                    composicao_siglas=c.composicao_siglas,
                    is_active=c.is_active,
                    is_deleted=c.is_deleted,
                    partidos_membros=membros_entities,
                    ano=ano_val,
                )
            )

        return coligacoes

    def get_by_id(self, id: int) -> Optional[ColigacaoEntity]:
        stmt = (
            select(Coligacao, Eleicao.ano)
            .join(Eleicao, Coligacao.id_eleicao == Eleicao.id)
            .where(Coligacao.id == id, Coligacao.is_deleted.is_(False))
        )
        row = self.db.execute(stmt).first()
        if not row:
            return None
        c, ano_val = row

        membros_stmt = (
            select(
                ColigacaoPartidos,
                Partidos.numero,
                Partidos.sigla_atual,
            )
            .outerjoin(
                Partidos,
                ColigacaoPartidos.partido_numero == Partidos.numero,
            )
            .where(
                ColigacaoPartidos.id_coligacao == c.id,
                ColigacaoPartidos.is_deleted.is_(False),
            )
        )
        membros_rows = self.db.execute(membros_stmt).all()
        membros = []
        for m, p_numero, sigla_atual in membros_rows:
            num_final = m.partido_numero or p_numero
            sigla_epoca_final = m.sigla_epoca or sigla_atual or ""
            sigla_atual_final = sigla_atual or sigla_epoca_final
            if sigla_epoca_final and sigla_atual_final and sigla_epoca_final.upper() != sigla_atual_final.upper():
                nome_formatado = f"{sigla_epoca_final} (atual {sigla_atual_final} - {num_final})"
            elif num_final:
                nome_formatado = f"{sigla_atual_final} ({num_final})"
            else:
                nome_formatado = sigla_epoca_final or "S/P"

            membros.append(
                ColigacaoPartidoEntity(
                    id=m.id,
                    id_coligacao=m.id_coligacao,
                    partido_numero=num_final,
                    papel=m.papel,
                    sigla_epoca=sigla_epoca_final,
                    sigla_atual=sigla_atual_final,
                    nome_formatado=nome_formatado,
                    sigla=sigla_epoca_final or sigla_atual_final,
                    is_active=m.is_active,
                    is_deleted=m.is_deleted,
                )
            )

        return ColigacaoEntity(
            id=c.id,
            id_eleicao=c.id_eleicao,
            cargo=c.cargo,
            numero_urna=c.numero_urna,
            nome_coligacao=c.nome_coligacao,
            partido_numero_titular=c.partido_numero_titular,
            sigla_partido_titular=c.sigla_partido_titular,
            composicao_siglas=c.composicao_siglas,
            is_active=c.is_active,
            is_deleted=c.is_deleted,
            partidos_membros=membros,
            ano=ano_val,
        )

    def create(
        self,
        entity: ColigacaoEntity,
        partido_numeros_papeis: Optional[List[Tuple[int, str, Optional[str]]]] = None,
    ) -> ColigacaoEntity:
        colig = Coligacao(
            id_eleicao=entity.id_eleicao,
            cargo=entity.cargo,
            numero_urna=entity.numero_urna,
            nome_coligacao=entity.nome_coligacao.strip().upper(),
            partido_numero_titular=entity.partido_numero_titular,
            sigla_partido_titular=entity.sigla_partido_titular.strip().upper(),
            composicao_siglas=entity.composicao_siglas.strip().upper(),
            is_active=entity.is_active,
            is_deleted=False,
        )
        self.db.add(colig)
        self.db.flush()

        if partido_numeros_papeis:
            for item in partido_numeros_papeis:
                if len(item) == 3:
                    p_num, papel, sigla_epoca = item
                else:
                    p_num, papel = item[0], item[1]
                    sigla_epoca = None

                cp = ColigacaoPartidos(
                    id_coligacao=colig.id,
                    partido_numero=p_num,
                    papel=papel,
                    sigla_epoca=sigla_epoca,
                    is_active=True,
                    is_deleted=False,
                )
                self.db.add(cp)

        self.db.commit()
        self.db.refresh(colig)
        return self.get_by_id(colig.id)

    def update(
        self,
        id: int,
        nome_coligacao: Optional[str] = None,
        composicao_siglas: Optional[str] = None,
        partido_numero_titular: Optional[int] = None,
        is_active: Optional[bool] = None,
        partido_numeros_papeis: Optional[List[Tuple[int, str, Optional[str]]]] = None,
    ) -> Optional[ColigacaoEntity]:
        colig = self.db.scalar(select(Coligacao).where(Coligacao.id == id, Coligacao.is_deleted.is_(False)))
        if not colig:
            return None

        if nome_coligacao is not None:
            colig.nome_coligacao = nome_coligacao.strip().upper()
        if composicao_siglas is not None:
            colig.composicao_siglas = composicao_siglas.strip().upper()
        if partido_numero_titular is not None:
            colig.partido_numero_titular = partido_numero_titular
        if is_active is not None:
            colig.is_active = is_active

        if partido_numeros_papeis is not None:
            old_members = self.db.scalars(
                select(ColigacaoPartidos).where(ColigacaoPartidos.id_coligacao == id)
            ).all()
            for m in old_members:
                self.db.delete(m)
            self.db.flush()

            for item in partido_numeros_papeis:
                if len(item) == 3:
                    p_num, papel, sigla_epoca = item
                else:
                    p_num, papel = item[0], item[1]
                    sigla_epoca = None

                cp = ColigacaoPartidos(
                    id_coligacao=id,
                    partido_numero=p_num,
                    papel=papel,
                    sigla_epoca=sigla_epoca,
                    is_active=True,
                    is_deleted=False,
                )
                self.db.add(cp)

        self.db.commit()
        return self.get_by_id(id)

    def soft_delete(self, id: int) -> bool:
        colig = self.db.scalar(select(Coligacao).where(Coligacao.id == id, Coligacao.is_deleted.is_(False)))
        if not colig:
            return False
        colig.is_deleted = True
        colig.is_active = False

        members = self.db.scalars(
            select(ColigacaoPartidos).where(ColigacaoPartidos.id_coligacao == id)
        ).all()
        for m in members:
            m.is_deleted = True
            m.is_active = False

        self.db.commit()
        return True


class SqlAlchemyQuocienteRepository(IQuocienteEleitoralRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_parametros(self, eleicao_id: int) -> Optional[ParametrosQeEntity]:
        stmt = select(ParametrosQeEleicao).where(
            ParametrosQeEleicao.eleicao_id == eleicao_id,
            ParametrosQeEleicao.is_deleted.is_(False),
        )
        row = self.db.scalars(stmt).first()
        if not row:
            return None
        return ParametrosQeEntity(
            id=row.id,
            eleicao_id=row.eleicao_id,
            vagas_vereador=row.vagas_vereador,
            perc_minimo_candidato_qp=float(row.perc_minimo_candidato_qp),
            perc_minimo_chapa_sobras=float(row.perc_minimo_chapa_sobras),
            perc_minimo_candidato_sobras=float(row.perc_minimo_candidato_sobras),
            permite_repescagem_sobras=row.permite_repescagem_sobras,
            is_active=row.is_active,
            is_deleted=row.is_deleted,
        )

    def save_parametros(self, entity: ParametrosQeEntity) -> ParametrosQeEntity:
        stmt = select(ParametrosQeEleicao).where(
            ParametrosQeEleicao.eleicao_id == entity.eleicao_id,
        )
        row = self.db.scalars(stmt).first()
        if row:
            row.vagas_vereador = entity.vagas_vereador
            row.perc_minimo_candidato_qp = entity.perc_minimo_candidato_qp
            row.perc_minimo_chapa_sobras = entity.perc_minimo_chapa_sobras
            row.perc_minimo_candidato_sobras = entity.perc_minimo_candidato_sobras
            row.permite_repescagem_sobras = entity.permite_repescagem_sobras
            row.is_active = True
            row.is_deleted = False
        else:
            row = ParametrosQeEleicao(
                eleicao_id=entity.eleicao_id,
                vagas_vereador=entity.vagas_vereador,
                perc_minimo_candidato_qp=entity.perc_minimo_candidato_qp,
                perc_minimo_chapa_sobras=entity.perc_minimo_chapa_sobras,
                perc_minimo_candidato_sobras=entity.perc_minimo_candidato_sobras,
                permite_repescagem_sobras=entity.permite_repescagem_sobras,
                is_active=True,
                is_deleted=False,
            )
            self.db.add(row)

        self.db.commit()
        self.db.refresh(row)
        return ParametrosQeEntity(
            id=row.id,
            eleicao_id=row.eleicao_id,
            vagas_vereador=row.vagas_vereador,
            perc_minimo_candidato_qp=float(row.perc_minimo_candidato_qp),
            perc_minimo_chapa_sobras=float(row.perc_minimo_chapa_sobras),
            perc_minimo_candidato_sobras=float(row.perc_minimo_candidato_sobras),
            permite_repescagem_sobras=row.permite_repescagem_sobras,
            is_active=row.is_active,
            is_deleted=row.is_deleted,
        )

    def _to_chapa_entity(self, chapa: ChapaProporcional) -> ChapaProporcionalEntity:
        membros_stmt = (
            select(
                ChapaProporcionalPartidos,
                Partidos.sigla_atual,
                Partidos.nome_atual,
                PartidosEleicao.votos_nominais,
                PartidosEleicao.votos_legenda,
                PartidosEleicao.total_votos,
            )
            .join(Partidos, ChapaProporcionalPartidos.partido_id == Partidos.numero)
            .outerjoin(
                PartidosEleicao,
                (PartidosEleicao.partido_numero == Partidos.numero)
                & (PartidosEleicao.id_eleicao == chapa.eleicao_id)
                & (PartidosEleicao.is_deleted.is_(False)),
            )
            .where(
                ChapaProporcionalPartidos.chapa_proporcional_id == chapa.id,
                ChapaProporcionalPartidos.is_deleted.is_(False),
            )
            .order_by(asc(Partidos.numero))
        )
        membros_rows = self.db.execute(membros_stmt).all()
        membros_entities = []
        for m, sigla, nome, v_nom, v_leg, v_tot in membros_rows:
            membros_entities.append(
                ChapaProporcionalPartidoEntity(
                    id=m.id,
                    chapa_proporcional_id=m.chapa_proporcional_id,
                    partido_id=m.partido_id,
                    numero=m.partido_id,
                    sigla=sigla,
                    nome=nome,
                    votos_nominais=v_nom or 0,
                    votos_legenda=v_leg or 0,
                    total_votos=v_tot or 0,
                    is_active=m.is_active,
                    is_deleted=m.is_deleted,
                )
            )

        return ChapaProporcionalEntity(
            id=chapa.id,
            eleicao_id=chapa.eleicao_id,
            nome=chapa.nome,
            tipo=chapa.tipo,
            partidos=membros_entities,
            is_active=chapa.is_active,
            is_deleted=chapa.is_deleted,
        )

    def list_chapas(self, eleicao_id: int) -> List[ChapaProporcionalEntity]:
        stmt = (
            select(ChapaProporcional)
            .where(
                ChapaProporcional.eleicao_id == eleicao_id,
                ChapaProporcional.is_deleted.is_(False),
            )
            .order_by(asc(ChapaProporcional.nome))
        )
        chapas = self.db.scalars(stmt).all()
        return [self._to_chapa_entity(c) for c in chapas]

    def get_chapa_by_id(self, chapa_id: int) -> Optional[ChapaProporcionalEntity]:
        chapa = self.db.scalar(
            select(ChapaProporcional).where(
                ChapaProporcional.id == chapa_id,
                ChapaProporcional.is_deleted.is_(False),
            )
        )
        if not chapa:
            return None
        return self._to_chapa_entity(chapa)

    def verificar_partido_em_outra_chapa(
        self, eleicao_id: int, partido_id: int, ignore_chapa_id: Optional[int] = None
    ) -> bool:
        stmt = (
            select(ChapaProporcionalPartidos.id)
            .join(ChapaProporcional, ChapaProporcionalPartidos.chapa_proporcional_id == ChapaProporcional.id)
            .where(
                ChapaProporcional.eleicao_id == eleicao_id,
                ChapaProporcionalPartidos.partido_id == partido_id,
                ChapaProporcional.is_deleted.is_(False),
                ChapaProporcionalPartidos.is_deleted.is_(False),
            )
        )
        if ignore_chapa_id is not None:
            stmt = stmt.where(ChapaProporcional.id != ignore_chapa_id)

        res = self.db.scalar(stmt)
        return res is not None

    def create_chapa(
        self, eleicao_id: int, nome: str, tipo: str, partido_ids: List[int]
    ) -> ChapaProporcionalEntity:
        for p_id in partido_ids:
            if self.verificar_partido_em_outra_chapa(eleicao_id, p_id):
                partido = self.db.scalar(select(Partidos).where(Partidos.numero == p_id))
                sigla = partido.sigla_atual if partido else str(p_id)
                raise ValueError(f"O partido {sigla} (número {p_id}) já está vinculado a outra chapa proporcional nesta eleição.")

        chapa = ChapaProporcional(
            eleicao_id=eleicao_id,
            nome=nome.strip(),
            tipo=tipo.strip().upper(),
            is_active=True,
            is_deleted=False,
        )
        self.db.add(chapa)
        self.db.flush()

        for p_id in partido_ids:
            membro = ChapaProporcionalPartidos(
                chapa_proporcional_id=chapa.id,
                partido_id=p_id,
                is_active=True,
                is_deleted=False,
            )
            self.db.add(membro)

        self.db.commit()
        self.db.refresh(chapa)
        return self._to_chapa_entity(chapa)

    def update_chapa(
        self,
        chapa_id: int,
        nome: Optional[str] = None,
        tipo: Optional[str] = None,
        partido_ids: Optional[List[int]] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[ChapaProporcionalEntity]:
        chapa = self.db.scalar(
            select(ChapaProporcional).where(
                ChapaProporcional.id == chapa_id,
                ChapaProporcional.is_deleted.is_(False),
            )
        )
        if not chapa:
            return None

        if nome is not None:
            chapa.nome = nome.strip()
        if tipo is not None:
            chapa.tipo = tipo.strip().upper()
        if is_active is not None:
            chapa.is_active = is_active

        if partido_ids is not None:
            for p_id in partido_ids:
                if self.verificar_partido_em_outra_chapa(chapa.eleicao_id, p_id, ignore_chapa_id=chapa.id):
                    partido = self.db.scalar(select(Partidos).where(Partidos.numero == p_id))
                    sigla = partido.sigla_atual if partido else str(p_id)
                    raise ValueError(f"O partido {sigla} (número {p_id}) já está vinculado a outra chapa proporcional nesta eleição.")

            # Deletar membros anteriores
            antigos = self.db.scalars(
                select(ChapaProporcionalPartidos).where(
                    ChapaProporcionalPartidos.chapa_proporcional_id == chapa.id
                )
            ).all()
            for a in antigos:
                self.db.delete(a)
            self.db.flush()

            for p_id in partido_ids:
                membro = ChapaProporcionalPartidos(
                    chapa_proporcional_id=chapa.id,
                    partido_id=p_id,
                    is_active=True,
                    is_deleted=False,
                )
                self.db.add(membro)

        self.db.commit()
        self.db.refresh(chapa)
        return self._to_chapa_entity(chapa)

    def soft_delete_chapa(self, chapa_id: int) -> bool:
        chapa = self.db.scalar(
            select(ChapaProporcional).where(
                ChapaProporcional.id == chapa_id,
                ChapaProporcional.is_deleted.is_(False),
            )
        )
        if not chapa:
            return False

        chapa.is_deleted = True
        chapa.is_active = False

        membros = self.db.scalars(
            select(ChapaProporcionalPartidos).where(
                ChapaProporcionalPartidos.chapa_proporcional_id == chapa.id
            )
        ).all()
        for m in membros:
            m.is_deleted = True
            m.is_active = False

        self.db.commit()
        return True

    def get_dados_apuracao_vereador(
        self, eleicao_id: int
    ) -> Tuple[List[Tuple[PartidosEleicaoEntity, str, Optional[str]]], List[Tuple[CandidatosEleicaoEntity, str, str]]]:
        # 1. Desempenho dos partidos na eleição
        partidos_stmt = (
            select(PartidosEleicao, Partidos.sigla_atual, Partidos.nome_atual)
            .join(Partidos, PartidosEleicao.partido_numero == Partidos.numero)
            .where(
                PartidosEleicao.id_eleicao == eleicao_id,
                PartidosEleicao.is_deleted.is_(False),
                Partidos.is_deleted.is_(False),
            )
            .order_by(desc(PartidosEleicao.total_votos))
        )
        p_rows = self.db.execute(partidos_stmt).all()
        partidos_list = []
        for pe, sigla, nome in p_rows:
            p_entity = PartidosEleicaoEntity(
                id=pe.id,
                id_eleicao=pe.id_eleicao,
                partido_numero=pe.partido_numero,
                votos_nominais=pe.votos_nominais,
                votos_legenda=pe.votos_legenda,
                total_votos=pe.total_votos,
                is_active=pe.is_active,
                is_deleted=pe.is_deleted,
            )
            partidos_list.append((p_entity, sigla, nome))

        # 2. Candidatos a vereador na eleição
        cand_stmt = (
            select(CandidatosEleicao, DadosCandidato.nome_completo, Partidos.sigla_atual)
            .join(DadosCandidato, CandidatosEleicao.titulo_eleitor == DadosCandidato.titulo_eleitor)
            .outerjoin(Partidos, CandidatosEleicao.partido_numero == Partidos.numero)
            .where(
                CandidatosEleicao.id_eleicao == eleicao_id,
                CandidatosEleicao.cargo.ilike("Vereador"),
                CandidatosEleicao.is_deleted.is_(False),
                DadosCandidato.is_deleted.is_(False),
            )
            .order_by(desc(CandidatosEleicao.votos))
        )
        c_rows = self.db.execute(cand_stmt).all()
        cand_list = []
        for ce, nome_comp, sigla_at in c_rows:
            c_entity = CandidatosEleicaoEntity(
                id=ce.id,
                titulo_eleitor=ce.titulo_eleitor,
                id_eleicao=ce.id_eleicao,
                partido_numero=ce.partido_numero,
                cargo=ce.cargo,
                numero_urna=ce.numero_urna,
                nome_urna=ce.nome_urna,
                votos=ce.votos,
                situacao=ce.situacao,
                posicao=ce.posicao,
                sigla_epoca=ce.sigla_epoca,
                is_active=ce.is_active,
                is_deleted=ce.is_deleted,
            )
            sigla_exibicao = ce.sigla_epoca or sigla_at or str(ce.partido_numero)
            cand_list.append((c_entity, nome_comp, sigla_exibicao))

        return partidos_list, cand_list



