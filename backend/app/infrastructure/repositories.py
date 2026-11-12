from typing import List, Optional, Tuple
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
)
from ..domain.repositories import (
    IEleicaoRepository,
    ICandidatoRepository,
    IPartidoRepository,
    IColigacaoRepository,
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
    ) -> List[Tuple[CandidatosEleicaoEntity, int, str]]:
        stmt = (
            select(CandidatosEleicao, Eleicao.ano, Partidos.sigla)
            .join(Eleicao, CandidatosEleicao.id_eleicao == Eleicao.id)
            .join(Partidos, CandidatosEleicao.id_partido == Partidos.id)
            .where(
                CandidatosEleicao.titulo_eleitor == titulo_eleitor,
                CandidatosEleicao.is_deleted.is_(False),
                Eleicao.is_deleted.is_(False),
            )
            .order_by(asc(Eleicao.ano))
        )
        rows = self.db.execute(stmt).all()
        result = []
        for cand, ano, sigla in rows:
            entity = CandidatosEleicaoEntity(
                id=cand.id,
                titulo_eleitor=cand.titulo_eleitor,
                id_eleicao=cand.id_eleicao,
                id_partido=cand.id_partido,
                cargo=cand.cargo,
                numero_urna=cand.numero_urna,
                nome_urna=cand.nome_urna,
                votos=cand.votos,
                situacao=cand.situacao,
                posicao=cand.posicao,
                is_active=cand.is_active,
                is_deleted=cand.is_deleted,
            )
            result.append((entity, ano, sigla))
        return result

    def get_resultados_pleito(
        self, id_eleicao: int, cargo: str
    ) -> List[Tuple[CandidatosEleicaoEntity, str, str]]:
        stmt = (
            select(CandidatosEleicao, DadosCandidato.nome_completo, Partidos.sigla)
            .join(DadosCandidato, CandidatosEleicao.titulo_eleitor == DadosCandidato.titulo_eleitor)
            .join(Partidos, CandidatosEleicao.id_partido == Partidos.id)
            .where(
                CandidatosEleicao.id_eleicao == id_eleicao,
                CandidatosEleicao.cargo.ilike(cargo),
                CandidatosEleicao.is_deleted.is_(False),
                DadosCandidato.is_deleted.is_(False),
            )
            .order_by(
                asc(CandidatosEleicao.posicao).nulls_last(),
                desc(CandidatosEleicao.votos),
            )
        )
        rows = self.db.execute(stmt).all()
        result = []
        for cand, nome_completo, sigla in rows:
            entity = CandidatosEleicaoEntity(
                id=cand.id,
                titulo_eleitor=cand.titulo_eleitor,
                id_eleicao=cand.id_eleicao,
                id_partido=cand.id_partido,
                cargo=cand.cargo,
                numero_urna=cand.numero_urna,
                nome_urna=cand.nome_urna,
                votos=cand.votos,
                situacao=cand.situacao,
                posicao=cand.posicao,
                is_active=cand.is_active,
                is_deleted=cand.is_deleted,
            )
            result.append((entity, nome_completo, sigla))
        return result


class SqlAlchemyPartidoRepository(IPartidoRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, p: Partidos) -> PartidosEntity:
        historico_entities = [
            PartidoHistoricoEntity(
                id=h.id,
                id_partido=h.id_partido,
                numero=h.numero,
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
        return PartidosEntity(
            id=p.id,
            numero=p.numero,
            sigla=p.sigla,
            nome=p.nome,
            historico=historico_entities,
            is_active=p.is_active,
            is_deleted=p.is_deleted,
        )

    def list_all(self) -> List[PartidosEntity]:
        stmt = (
            select(Partidos)
            .where(Partidos.is_deleted.is_(False))
            .order_by(asc(Partidos.numero))
        )
        results = self.db.scalars(stmt).all()
        return [self._to_entity(p) for p in results]

    def get_by_id(self, id: int) -> Optional[PartidosEntity]:
        p = self.db.scalar(select(Partidos).where(Partidos.id == id, Partidos.is_deleted.is_(False)))
        return self._to_entity(p) if p else None

    def get_by_numero(self, numero: int) -> Optional[PartidosEntity]:
        p = self.db.scalar(select(Partidos).where(Partidos.numero == numero, Partidos.is_deleted.is_(False)))
        return self._to_entity(p) if p else None

    def create(
        self,
        numero: int,
        sigla: str,
        nome: Optional[str] = None,
        historico: Optional[List[dict]] = None,
    ) -> PartidosEntity:
        sigla_clean = sigla.strip().upper()
        nome_clean = nome.strip() if nome else None

        existing_num = self.db.scalar(select(Partidos).where(Partidos.numero == numero))
        if existing_num:
            if existing_num.is_deleted:
                existing_num.is_deleted = False
                existing_num.is_active = True
                existing_num.sigla = sigla_clean
                existing_num.nome = nome_clean
                self.db.commit()
                self.db.refresh(existing_num)
                return self._to_entity(existing_num)
            raise ValueError(f"Partido com o número eleitoral {numero} já está cadastrado.")

        obj = Partidos(
            numero=numero,
            sigla=sigla_clean,
            nome=nome_clean,
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

        if sigla is not None:
            obj.sigla = sigla.strip().upper()

        if nome is not None:
            obj.nome = nome.strip() if nome else None

        if is_active is not None:
            obj.is_active = is_active

        if historico is not None:
            # Replace historical names
            for existing_h in obj.historico_nomes:
                existing_h.is_deleted = True
                existing_h.is_active = False

            for h in historico:
                h_obj = PartidoHistorico(
                    id_partido=obj.id,
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
    ) -> List[Tuple[PartidosEleicaoEntity, str]]:
        stmt = (
            select(PartidosEleicao, Partidos.sigla)
            .join(Partidos, PartidosEleicao.id_partido == Partidos.id)
            .where(
                PartidosEleicao.id_eleicao == id_eleicao,
                PartidosEleicao.is_deleted.is_(False),
                Partidos.is_deleted.is_(False),
            )
            .order_by(desc(PartidosEleicao.total_votos))
        )
        rows = self.db.execute(stmt).all()
        result = []
        for p, sigla in rows:
            entity = PartidosEleicaoEntity(
                id=p.id,
                id_eleicao=p.id_eleicao,
                id_partido=p.id_partido,
                votos_nominais=p.votos_nominais,
                votos_legenda=p.votos_legenda,
                total_votos=p.total_votos,
                is_active=p.is_active,
                is_deleted=p.is_deleted,
            )
            result.append((entity, sigla))
        return result


class SqlAlchemyColigacaoRepository(IColigacaoRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_by_eleicao(self, ano: Optional[int] = None) -> List[ColigacaoEntity]:
        stmt = (
            select(Coligacao, Eleicao.ano)
            .join(Eleicao, Coligacao.id_eleicao == Eleicao.id)
            .where(Coligacao.is_deleted.is_(False))
            .order_by(desc(Eleicao.ano), asc(Coligacao.numero_urna))
        )
        if ano:
            stmt = stmt.where(Eleicao.ano == ano)

        results = self.db.execute(stmt).all()
        coligacoes = []

        for c, ano_val in results:
            # Load members
            membros_stmt = (
                select(ColigacaoPartidos, Partidos.sigla)
                .join(Partidos, ColigacaoPartidos.id_partido == Partidos.id)
                .where(
                    ColigacaoPartidos.id_coligacao == c.id,
                    ColigacaoPartidos.is_deleted.is_(False),
                )
                .order_by(asc(Partidos.sigla))
            )
            membros_rows = self.db.execute(membros_stmt).all()
            membros_entities = [
                ColigacaoPartidoEntity(
                    id=m.id,
                    id_coligacao=m.id_coligacao,
                    id_partido=m.id_partido,
                    papel=m.papel,
                    sigla=sigla,
                    is_active=m.is_active,
                    is_deleted=m.is_deleted,
                )
                for m, sigla in membros_rows
            ]

            coligacoes.append(
                ColigacaoEntity(
                    id=c.id,
                    id_eleicao=c.id_eleicao,
                    cargo=c.cargo,
                    numero_urna=c.numero_urna,
                    nome_coligacao=c.nome_coligacao,
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
            select(ColigacaoPartidos, Partidos.sigla)
            .join(Partidos, ColigacaoPartidos.id_partido == Partidos.id)
            .where(
                ColigacaoPartidos.id_coligacao == c.id,
                ColigacaoPartidos.is_deleted.is_(False),
            )
        )
        membros_rows = self.db.execute(membros_stmt).all()
        membros = [
            ColigacaoPartidoEntity(
                id=m.id,
                id_coligacao=m.id_coligacao,
                id_partido=m.id_partido,
                papel=m.papel,
                sigla=sigla,
                is_active=m.is_active,
                is_deleted=m.is_deleted,
            )
            for m, sigla in membros_rows
        ]

        return ColigacaoEntity(
            id=c.id,
            id_eleicao=c.id_eleicao,
            cargo=c.cargo,
            numero_urna=c.numero_urna,
            nome_coligacao=c.nome_coligacao,
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
        partido_ids_papeis: Optional[List[Tuple[int, str]]] = None,
    ) -> ColigacaoEntity:
        colig = Coligacao(
            id_eleicao=entity.id_eleicao,
            cargo=entity.cargo,
            numero_urna=entity.numero_urna,
            nome_coligacao=entity.nome_coligacao.strip().upper(),
            sigla_partido_titular=entity.sigla_partido_titular.strip().upper(),
            composicao_siglas=entity.composicao_siglas.strip().upper(),
            is_active=entity.is_active,
            is_deleted=False,
        )
        self.db.add(colig)
        self.db.flush()

        if partido_ids_papeis:
            for p_id, papel in partido_ids_papeis:
                cp = ColigacaoPartidos(
                    id_coligacao=colig.id,
                    id_partido=p_id,
                    papel=papel,
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
        is_active: Optional[bool] = None,
        partido_ids_papeis: Optional[List[Tuple[int, str]]] = None,
    ) -> Optional[ColigacaoEntity]:
        colig = self.db.scalar(select(Coligacao).where(Coligacao.id == id, Coligacao.is_deleted.is_(False)))
        if not colig:
            return None

        if nome_coligacao is not None:
            colig.nome_coligacao = nome_coligacao.strip().upper()
        if composicao_siglas is not None:
            colig.composicao_siglas = composicao_siglas.strip().upper()
        if is_active is not None:
            colig.is_active = is_active

        if partido_ids_papeis is not None:
            # Soft delete old members and add/reactivate
            old_members = self.db.scalars(
                select(ColigacaoPartidos).where(ColigacaoPartidos.id_coligacao == id)
            ).all()
            for m in old_members:
                self.db.delete(m)
            self.db.flush()

            for p_id, papel in partido_ids_papeis:
                cp = ColigacaoPartidos(
                    id_coligacao=id,
                    id_partido=p_id,
                    papel=papel,
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

        # Soft delete members
        members = self.db.scalars(
            select(ColigacaoPartidos).where(ColigacaoPartidos.id_coligacao == id)
        ).all()
        for m in members:
            m.is_deleted = True
            m.is_active = False

        self.db.commit()
        return True

