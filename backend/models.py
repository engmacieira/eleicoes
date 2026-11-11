from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class DadosCandidato(Base):
    """Representa a pessoa física única no TSE."""
    __tablename__ = "dados_candidato"

    titulo_eleitor = Column(String(15), primary_key=True, index=True)
    nome_completo = Column(String(255), nullable=False)
    data_nascimento = Column(Date, nullable=True)

    candidaturas = relationship("CandidatosEleicao", back_populates="candidato")


class Eleicao(Base):
    """Pleito municipal (ano da eleição)."""
    __tablename__ = "eleicao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, unique=True, nullable=False, index=True)

    detalhes = relationship("DetalhesVotacao", back_populates="eleicao", cascade="all, delete-orphan")
    partidos_desempenho = relationship("PartidosEleicao", back_populates="eleicao", cascade="all, delete-orphan")
    candidatos = relationship("CandidatosEleicao", back_populates="eleicao", cascade="all, delete-orphan")


class DetalhesVotacao(Base):
    """Estatísticas consolidadas de urna por pleito e por cargo."""
    __tablename__ = "detalhes_votacao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_eleicao = Column(Integer, ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True)
    cargo = Column(String(50), nullable=False)
    aptos = Column(Integer, default=0)
    comparecimento = Column(Integer, default=0)
    abstencoes = Column(Integer, default=0)
    validos = Column(Integer, default=0)
    brancos = Column(Integer, default=0)
    nulos = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("id_eleicao", "cargo", name="uq_detalhes_eleicao_cargo"),
    )

    eleicao = relationship("Eleicao", back_populates="detalhes")


class Partidos(Base):
    """Cadastro único de siglas partidárias."""
    __tablename__ = "partidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sigla = Column(String(20), unique=True, nullable=False, index=True)

    partidos_eleicao = relationship("PartidosEleicao", back_populates="partido")
    candidatos = relationship("CandidatosEleicao", back_populates="partido")


class PartidosEleicao(Base):
    """Desempenho partidário consolidado para vereador em cada eleição."""
    __tablename__ = "partidos_eleicao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_eleicao = Column(Integer, ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True)
    id_partido = Column(Integer, ForeignKey("partidos.id", ondelete="CASCADE"), nullable=False, index=True)
    votos_nominais = Column(Integer, default=0)
    votos_legenda = Column(Integer, default=0)
    total_votos = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("id_eleicao", "id_partido", name="uq_partidos_eleicao"),
    )

    eleicao = relationship("Eleicao", back_populates="partidos_desempenho")
    partido = relationship("Partidos", back_populates="partidos_eleicao")


class CandidatosEleicao(Base):
    """Histórico de participação de um indivíduo em um pleito determinado."""
    __tablename__ = "candidatos_eleicao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo_eleitor = Column(String(15), ForeignKey("dados_candidato.titulo_eleitor", ondelete="RESTRICT"), nullable=False, index=True)
    id_eleicao = Column(Integer, ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True)
    id_partido = Column(Integer, ForeignKey("partidos.id", ondelete="RESTRICT"), nullable=False, index=True)
    cargo = Column(String(50), nullable=False, index=True)
    numero_urna = Column(Integer, nullable=False)
    nome_urna = Column(String(150), nullable=False)
    votos = Column(Integer, nullable=False, default=0)
    situacao = Column(String(50), nullable=False)
    posicao = Column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint("titulo_eleitor", "id_eleicao", "cargo", name="uq_candidato_eleicao_cargo"),
    )

    candidato = relationship("DadosCandidato", back_populates="candidaturas")
    eleicao = relationship("Eleicao", back_populates="candidatos")
    partido = relationship("Partidos", back_populates="candidatos")
