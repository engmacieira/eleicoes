import React, { useState, useEffect } from 'react';
import { CloudSqlHealthDto } from '../types/election';
import { checkBackendHealth } from '../services/api';
import {
  Server,
  Database,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code,
  FileCode,
  Download,
  Lock,
} from 'lucide-react';

export const CloudSqlStatus: React.FC = () => {
  const [health, setHealth] = useState<CloudSqlHealthDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<'main' | 'models' | 'schemas' | 'database' | 'env' | 'req'>('main');

  const refreshHealth = () => {
    setLoading(true);
    checkBackendHealth()
      .then((res) => {
        setHealth(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const fileContents = {
    main: `# backend/main.py
import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, text

from database import engine, get_db, Base
import models
import schemas

app = FastAPI(
    title="Eleições Braúnas/MG - API Cloud SQL",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT version(), current_database(), inet_server_addr();")).fetchone()
    return {
        "status": "healthy",
        "database": result[1] if result else "eleicoes_db",
        "server_ip": str(result[2]) if result and result[2] else os.getenv("DB_HOST", "34.95.135.110"),
        "engine": "PostgreSQL 15 (Cloud SQL)",
        "cloud_project": "eleicoes-braunas"
    }

@app.get("/api/eleicoes", response_model=List[schemas.EleicaoResumoSchema])
def listar_eleicoes(ano: Optional[int] = None, cargo: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Eleicao).order_by(desc(models.Eleicao.ano))
    if ano:
        query = query.filter(models.Eleicao.ano == ano)
    eleicoes = query.all()
    resultado = []
    for el in eleicoes:
        det_query = db.query(models.DetalhesVotacao).filter(models.DetalhesVotacao.id_eleicao == el.id)
        if cargo:
            det_query = det_query.filter(models.DetalhesVotacao.cargo.ilike(cargo))
        detalhes_list = []
        for d in det_query.all():
            detalhes_list.append(schemas.DetalhesVotacaoSchema(
                id=d.id, cargo=d.cargo, aptos=d.aptos or 0,
                comparecimento=d.comparecimento or 0, abstencoes=d.abstencoes or 0,
                validos=d.validos or 0, brancos=d.brancos or 0, nulos=d.nulos or 0,
                taxa_abstencao_pct=round((d.abstencoes / d.aptos * 100), 2) if d.aptos else 0,
                taxa_comparecimento_pct=round((d.comparecimento / d.aptos * 100), 2) if d.aptos else 0
            ))
        resultado.append(schemas.EleicaoResumoSchema(id=el.id, ano=el.ano, detalhes=detalhes_list))
    return resultado

@app.get("/api/resultados", response_model=List[schemas.ResultadoCandidatoSchema])
def obter_resultados(ano: int = 2024, cargo: str = "Vereador", db: Session = Depends(get_db)):
    eleicao = db.query(models.Eleicao).filter(models.Eleicao.ano == ano).first()
    if not eleicao:
        raise HTTPException(status_code=404, detail="Eleição não encontrada")
    candidatos_raw = (
        db.query(models.CandidatosEleicao, models.DadosCandidato.nome_completo, models.Partidos.sigla)
        .join(models.DadosCandidato, models.CandidatosEleicao.titulo_eleitor == models.DadosCandidato.titulo_eleitor)
        .join(models.Partidos, models.CandidatosEleicao.id_partido == models.Partidos.id)
        .filter(models.CandidatosEleicao.id_eleicao == eleicao.id, models.CandidatosEleicao.cargo.ilike(cargo))
        .order_by(asc(models.CandidatosEleicao.posicao).nulls_last(), desc(models.CandidatosEleicao.votos))
        .all()
    )
    soma_votos = sum(cand.votos for cand, _, _ in candidatos_raw) or 1
    return [
        schemas.ResultadoCandidatoSchema(
            posicao=cand.posicao, numero_urna=cand.numero_urna, nome_urna=cand.nome_urna,
            nome_completo=nome_completo, titulo_eleitor=cand.titulo_eleitor,
            sigla_partido=sigla, cargo=cand.cargo, votos=cand.votos, situacao=cand.situacao,
            percentual_validos=round((cand.votos / soma_votos) * 100, 2)
        )
        for cand, nome_completo, sigla in candidatos_raw
    ]

@app.get("/api/candidatos/{titulo_eleitor}/historico", response_model=schemas.CandidatoHistoricoResponse)
def obter_historico_candidato(titulo_eleitor: str, db: Session = Depends(get_db)):
    candidato = db.query(models.DadosCandidato).filter(models.DadosCandidato.titulo_eleitor == titulo_eleitor).first()
    if not candidato:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")
    disputas = (
        db.query(models.CandidatosEleicao, models.Eleicao.ano, models.Partidos.sigla)
        .join(models.Eleicao, models.CandidatosEleicao.id_eleicao == models.Eleicao.id)
        .join(models.Partidos, models.CandidatosEleicao.id_partido == models.Partidos.id)
        .filter(models.CandidatosEleicao.titulo_eleitor == titulo_eleitor)
        .order_by(asc(models.Eleicao.ano)).all()
    )
    total_votos = sum(cand.votos for cand, _, _ in disputas)
    total_mandatos = sum(1 for cand, _, _ in disputas if "eleito" in cand.situacao.lower() and "não" not in cand.situacao.lower())
    return schemas.CandidatoHistoricoResponse(
        titulo_eleitor=candidato.titulo_eleitor, nome_completo=candidato.nome_completo,
        data_nascimento=candidato.data_nascimento, total_eleicoes_disputadas=len(disputas),
        total_mandatos_conquistados=total_mandatos, total_votos_acumulados=total_votos,
        historico=[
            schemas.HistoricoParticipacaoSchema(
                ano=ano, cargo=cand.cargo, numero_urna=cand.numero_urna,
                nome_urna=cand.nome_urna, sigla_partido=sigla, votos=cand.votos,
                situacao=cand.situacao, posicao=cand.posicao
            )
            for cand, ano, sigla in disputas
        ]
    )

@app.get("/api/partidos/{ano}", response_model=schemas.PartidosAnoResponse)
def obter_partidos_ano(ano: int, db: Session = Depends(get_db)):
    eleicao = db.query(models.Eleicao).filter(models.Eleicao.ano == ano).first()
    if not eleicao:
        raise HTTPException(status_code=404, detail="Eleição não encontrada")
    desempenhos = (
        db.query(models.PartidosEleicao, models.Partidos.sigla)
        .join(models.Partidos, models.PartidosEleicao.id_partido == models.Partidos.id)
        .filter(models.PartidosEleicao.id_eleicao == eleicao.id)
        .order_by(desc(models.PartidosEleicao.total_votos)).all()
    )
    total_geral = sum(p.total_votos for p, _ in desempenhos) or 1
    return schemas.PartidosAnoResponse(
        ano=ano, total_geral_votos=total_geral,
        partidos=[
            schemas.DesempenhoPartidoSchema(
                sigla=sigla, votos_nominais=p.votos_nominais or 0,
                votos_legenda=p.votos_legenda or 0, total_votos=p.total_votos or 0,
                percentual_total=round((p.total_votos / total_geral) * 100, 2)
            )
            for p, sigla in desempenhos
        ]
    )`,
    models: `# backend/models.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class DadosCandidato(Base):
    __tablename__ = "dados_candidato"
    titulo_eleitor = Column(String(15), primary_key=True, index=True)
    nome_completo = Column(String(255), nullable=False)
    data_nascimento = Column(Date, nullable=True)
    candidaturas = relationship("CandidatosEleicao", back_populates="candidato")

class Eleicao(Base):
    __tablename__ = "eleicao"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, unique=True, nullable=False, index=True)
    detalhes = relationship("DetalhesVotacao", back_populates="eleicao", cascade="all, delete-orphan")
    partidos_desempenho = relationship("PartidosEleicao", back_populates="eleicao", cascade="all, delete-orphan")
    candidatos = relationship("CandidatosEleicao", back_populates="eleicao", cascade="all, delete-orphan")

class DetalhesVotacao(Base):
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
    __table_args__ = (UniqueConstraint("id_eleicao", "cargo", name="uq_detalhes_eleicao_cargo"),)
    eleicao = relationship("Eleicao", back_populates="detalhes")

class Partidos(Base):
    __tablename__ = "partidos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sigla = Column(String(20), unique=True, nullable=False, index=True)
    partidos_eleicao = relationship("PartidosEleicao", back_populates="partido")
    candidatos = relationship("CandidatosEleicao", back_populates="partido")

class PartidosEleicao(Base):
    __tablename__ = "partidos_eleicao"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_eleicao = Column(Integer, ForeignKey("eleicao.id", ondelete="CASCADE"), nullable=False, index=True)
    id_partido = Column(Integer, ForeignKey("partidos.id", ondelete="CASCADE"), nullable=False, index=True)
    votos_nominais = Column(Integer, default=0)
    votos_legenda = Column(Integer, default=0)
    total_votos = Column(Integer, default=0)
    __table_args__ = (UniqueConstraint("id_eleicao", "id_partido", name="uq_partidos_eleicao"),)
    eleicao = relationship("Eleicao", back_populates="partidos_desempenho")
    partido = relationship("Partidos", back_populates="partidos_eleicao")

class CandidatosEleicao(Base):
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
    __table_args__ = (UniqueConstraint("titulo_eleitor", "id_eleicao", "cargo", name="uq_candidato_eleicao_cargo"),)
    candidato = relationship("DadosCandidato", back_populates="candidaturas")
    eleicao = relationship("Eleicao", back_populates="candidatos")
    partido = relationship("Partidos", back_populates="candidatos")`,
    schemas: `# backend/schemas.py
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, ConfigDict

class DetalhesVotacaoSchema(BaseModel):
    id: int
    cargo: str
    aptos: int
    comparecimento: int
    abstencoes: int
    validos: int
    brancos: int
    nulos: int
    taxa_abstencao_pct: Optional[float] = None
    taxa_comparecimento_pct: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class EleicaoResumoSchema(BaseModel):
    id: int
    ano: int
    detalhes: List[DetalhesVotacaoSchema] = []
    model_config = ConfigDict(from_attributes=True)

class ResultadoCandidatoSchema(BaseModel):
    posicao: Optional[int]
    numero_urna: int
    nome_urna: str
    nome_completo: str
    titulo_eleitor: str
    sigla_partido: str
    cargo: str
    votos: int
    situacao: str
    percentual_validos: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class HistoricoParticipacaoSchema(BaseModel):
    ano: int
    cargo: str
    numero_urna: int
    nome_urna: str
    sigla_partido: str
    votos: int
    situacao: str
    posicao: Optional[int]
    model_config = ConfigDict(from_attributes=True)

class CandidatoHistoricoResponse(BaseModel):
    titulo_eleitor: str
    nome_completo: str
    data_nascimento: Optional[date] = None
    total_eleicoes_disputadas: int
    total_mandatos_conquistados: int
    total_votos_acumulados: int
    historico: List[HistoricoParticipacaoSchema]
    model_config = ConfigDict(from_attributes=True)

class DesempenhoPartidoSchema(BaseModel):
    sigla: str
    votos_nominais: int
    votos_legenda: int
    total_votos: int
    percentual_total: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class PartidosAnoResponse(BaseModel):
    ano: int
    partidos: List[DesempenhoPartidoSchema]
    total_geral_votos: int`,
    database: `# backend/database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "34.95.135.110")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "eleicoes_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,
    env: `# backend/.env.example
DB_HOST=34.95.135.110
DB_PORT=5432
DB_NAME=eleicoes_db
DB_USER=postgres
DB_PASS=SUA_SENHA_DO_CLOUD_SQL
API_PORT=8000
API_HOST=0.0.0.0`,
    req: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
sqlalchemy>=2.0.28
psycopg2-binary>=2.9.9
pydantic>=2.6.4
python-dotenv>=1.0.1`,
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Google Cloud SQL Ativo
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Projeto: eleicoes-braunas
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Instância PostgreSQL 15: <code className="text-blue-700 font-mono">eleicoes-db-instance</code>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Região: <code>southamerica-east1</code> (São Paulo) · Especificação: 1 vCPU / 3840 MB RAM
              </p>
            </div>
          </div>

          <button
            onClick={refreshHealth}
            disabled={loading}
            className="self-start md:self-center inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Testar Conexão</span>
          </button>
        </div>

        {/* Connection Coordinates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-xs">
            <span className="text-slate-500 block text-[11px] font-sans">IP Público:</span>
            <span className="font-bold text-slate-900 text-sm">34.95.135.110</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-xs">
            <span className="text-slate-500 block text-[11px] font-sans">Porta / Database:</span>
            <span className="font-bold text-blue-700 text-sm">5432 / eleicoes_db</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-xs">
            <span className="text-slate-500 block text-[11px] font-sans">Usuário Master:</span>
            <span className="font-bold text-emerald-800 text-sm">postgres</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-xs">
            <span className="text-slate-500 block text-[11px] font-sans">Status Conexão:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1 text-xs mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health?.status === 'healthy' ? 'API Conectada' : 'Simulador Conectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Code Explorer */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-700" />
              <span>Código-Fonte Completo do Backend FastAPI (Python)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Arquivos salvos e disponíveis no diretório <code>/backend/</code> do repositório.
            </p>
          </div>

          {/* File Selector Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-200/70 p-0.5 rounded-lg border border-slate-300 text-xs font-mono">
            {[
              { id: 'main', label: 'main.py' },
              { id: 'models', label: 'models.py' },
              { id: 'schemas', label: 'schemas.py' },
              { id: 'database', label: 'database.py' },
              { id: 'env', label: '.env.example' },
              { id: 'req', label: 'requirements.txt' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFile(f.id as any)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  activeFile === f.id
                    ? 'bg-blue-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content Box (Dark high-contrast container) */}
        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[480px] scrollbar-dark relative group">
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={() => copyCode(fileContents[activeFile], activeFile)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-md"
            >
              {copiedFile === activeFile ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === activeFile ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>

          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {fileContents[activeFile]}
          </pre>
        </div>
      </div>

      {/* Local Run Instructions */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-600" />
          <span>Como Executar o Backend FastAPI Localmente (Apontando para o Cloud SQL)</span>
        </h4>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 font-mono text-xs space-y-2 scrollbar-dark overflow-x-auto">
          <div className="text-slate-400"># 1. Entre na pasta do backend e crie o ambiente virtual:</div>
          <div className="text-emerald-400 font-semibold">cd backend && python -m venv .venv && source .venv/bin/activate</div>

          <div className="text-slate-400 pt-1"># 2. Instale as dependências:</div>
          <div className="text-emerald-400 font-semibold">pip install -r requirements.txt</div>

          <div className="text-slate-400 pt-1"># 3. Configure a senha da instância Cloud SQL:</div>
          <div className="text-emerald-400 font-semibold">export DB_PASS="sua_senha_cloud_sql"</div>

          <div className="text-slate-400 pt-1"># 4. Inicie o servidor FastAPI:</div>
          <div className="text-amber-300 font-bold">uvicorn main:app --host 0.0.0.0 --port 8000 --reload</div>
        </div>
      </div>
    </div>
  );
};
