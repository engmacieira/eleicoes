from datetime import date
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    Date,
    Boolean,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class DadosCandidato(Base):
    """Representa a pessoa física única no TSE."""
    __tablename__ = "dados_candidato"

    titulo_eleitor: Mapped[str] = mapped_column(String(15), primary_key=True, index=True)
    nome_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    data_nascimento: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    candidaturas: Mapped[List["CandidatosEleicao"]] = relationship(
        "CandidatosEleicao", back_populates="candidato"
    )


class Eleicao(Base):
    """Pleito municipal (ano da eleição)."""
    __tablename__ = "eleicao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    detalhes: Mapped[List["DetalhesVotacao"]] = relationship(
        "DetalhesVotacao", back_populates="eleicao", cascade="all, delete-orphan"
    )
    partidos_desempenho: Mapped[List["PartidosEleicao"]] = relationship(
        "PartidosEleicao", back_populates="eleicao", cascade="all, delete-orphan"
    )
    candidatos: Mapped[List["CandidatosEleicao"]] = relationship(
        "CandidatosEleicao", back_populates="eleicao", cascade="all, delete-orphan"
    )
    coligacoes: Mapped[List["Coligacao"]] = relationship(
        "Coligacao", back_populates="eleicao", cascade="all, delete-orphan"
    )


class DetalhesVotacao(Base):
    """Estatísticas consolidadas de urna por pleito e por cargo."""
    __tablename__ = "detalhes_votacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_eleicao: Mapped[int] = mapped_column(
        ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cargo: Mapped[str] = mapped_column(String(50), nullable=False)
    aptos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comparecimento: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    abstencoes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    brancos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    nulos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("id_eleicao", "cargo", name="uq_detalhes_eleicao_cargo"),
    )

    eleicao: Mapped["Eleicao"] = relationship("Eleicao", back_populates="detalhes")


class Partidos(Base):
    """Cadastro perene de legendas partidárias indexado pelo número oficial do TSE."""
    __tablename__ = "partidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    sigla: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    nome: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    partidos_eleicao: Mapped[List["PartidosEleicao"]] = relationship(
        "PartidosEleicao", back_populates="partido"
    )
    candidatos: Mapped[List["CandidatosEleicao"]] = relationship(
        "CandidatosEleicao", back_populates="partido"
    )
    historico_nomes: Mapped[List["PartidoHistorico"]] = relationship(
        "PartidoHistorico", back_populates="partido", cascade="all, delete-orphan"
    )


class PartidoHistorico(Base):
    """Tabela auxiliar de denominações anteriores, siglas e rebrandings partidários."""
    __tablename__ = "partido_historico"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partidos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    sigla: Mapped[str] = mapped_column(String(20), nullable=False)
    nome: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    ano_inicio: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ano_fim: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_atual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    partido: Mapped["Partidos"] = relationship("Partidos", back_populates="historico_nomes")


class PartidosEleicao(Base):
    """Desempenho partidário consolidado para vereador em cada eleição."""
    __tablename__ = "partidos_eleicao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_eleicao: Mapped[int] = mapped_column(
        ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True
    )
    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partidos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    votos_nominais: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    votos_legenda: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_votos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("id_eleicao", "id_partido", name="uq_partidos_eleicao"),
    )

    eleicao: Mapped["Eleicao"] = relationship("Eleicao", back_populates="partidos_desempenho")
    partido: Mapped["Partidos"] = relationship("Partidos", back_populates="partidos_eleicao")


class CandidatosEleicao(Base):
    """Histórico de participação de um indivíduo em um pleito determinado."""
    __tablename__ = "candidatos_eleicao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titulo_eleitor: Mapped[str] = mapped_column(
        ForeignKey("dados_candidato.titulo_eleitor", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    id_eleicao: Mapped[int] = mapped_column(
        ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True
    )
    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partidos.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cargo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    numero_urna: Mapped[int] = mapped_column(Integer, nullable=False)
    nome_urna: Mapped[str] = mapped_column(String(150), nullable=False)
    votos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    situacao: Mapped[str] = mapped_column(String(50), nullable=False)
    posicao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("titulo_eleitor", "id_eleicao", "cargo", name="uq_candidato_eleicao_cargo"),
    )

    candidato: Mapped["DadosCandidato"] = relationship("DadosCandidato", back_populates="candidaturas")
    eleicao: Mapped["Eleicao"] = relationship("Eleicao", back_populates="candidatos")
    partido: Mapped["Partidos"] = relationship("Partidos", back_populates="candidatos")


class Coligacao(Base):
    """Representa a coligação eleitoral formada para o pleito majoritário."""
    __tablename__ = "coligacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_eleicao: Mapped[int] = mapped_column(
        ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cargo: Mapped[str] = mapped_column(String(50), nullable=False, default="Prefeito")
    numero_urna: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    nome_coligacao: Mapped[str] = mapped_column(String(150), nullable=False)
    sigla_partido_titular: Mapped[str] = mapped_column(String(20), nullable=False)
    composicao_siglas: Mapped[str] = mapped_column(String(255), nullable=False)

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("id_eleicao", "cargo", "numero_urna", name="uq_coligacao_eleicao_numero"),
    )

    eleicao: Mapped["Eleicao"] = relationship("Eleicao", back_populates="coligacoes")
    partidos_membros: Mapped[List["ColigacaoPartidos"]] = relationship(
        "ColigacaoPartidos", back_populates="coligacao", cascade="all, delete-orphan"
    )


class ColigacaoPartidos(Base):
    """Partidos que integram a coligação partidária e o papel desempenhado na aliança."""
    __tablename__ = "coligacao_partidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_coligacao: Mapped[int] = mapped_column(
        ForeignKey("coligacoes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partidos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    papel: Mapped[str] = mapped_column(String(50), nullable=False, default="Apoiador")

    # Soft Delete Universal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("id_coligacao", "id_partido", name="uq_coligacao_partido"),
    )

    coligacao: Mapped["Coligacao"] = relationship("Coligacao", back_populates="partidos_membros")
    partido: Mapped["Partidos"] = relationship("Partidos")

