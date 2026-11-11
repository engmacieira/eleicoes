import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, text

from database import engine, get_db, Base
import models
import schemas

# Inicializa a aplicação FastAPI
app = FastAPI(
    title="Eleições Braúnas/MG - API Cloud SQL (2000 a 2024)",
    description="API RESTful de alta performance para consulta do histórico eleitoral municipal armazenado no Google Cloud SQL (PostgreSQL 15).",
    version="1.0.0"
)

# Configuração de CORS para permitir acesso irrestrito pelo frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Infraestrutura"])
def health_check(db: Session = Depends(get_db)):
    """Verifica a conectividade ativa com a instância do Google Cloud SQL."""
    try:
        result = db.execute(text("SELECT version(), current_database(), inet_server_addr();")).fetchone()
        return {
            "status": "healthy",
            "database": result[1] if result else "eleicoes_db",
            "server_ip": str(result[2]) if result and result[2] else os.getenv("DB_HOST", "34.95.135.110"),
            "engine": "PostgreSQL 15 (Cloud SQL)",
            "cloud_project": "eleicoes-braunas"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "host": os.getenv("DB_HOST", "34.95.135.110")
        }


@app.get("/api/eleicoes", response_model=List[schemas.EleicaoResumoSchema], tags=["Pleitos"])
def listar_eleicoes(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (ex: 2024)"),
    cargo: Optional[str] = Query(None, description="Filtrar por cargo (Prefeito ou Vereador)"),
    db: Session = Depends(get_db)
):
    """
    Retorna os anos disponíveis e o resumo de Detalhes_Votacao (aptos, comparecimento,
    abstenções, válidos, brancos e nulos) com filtros opcionais por ano e cargo.
    """
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
            taxa_abs = round((d.abstencoes / d.aptos * 100), 2) if d.aptos and d.aptos > 0 else 0.0
            taxa_comp = round((d.comparecimento / d.aptos * 100), 2) if d.aptos and d.aptos > 0 else 0.0

            detalhes_list.append(schemas.DetalhesVotacaoSchema(
                id=d.id,
                cargo=d.cargo,
                aptos=d.aptos or 0,
                comparecimento=d.comparecimento or 0,
                abstencoes=d.abstencoes or 0,
                validos=d.validos or 0,
                brancos=d.brancos or 0,
                nulos=d.nulos or 0,
                taxa_abstencao_pct=taxa_abs,
                taxa_comparecimento_pct=taxa_comp
            ))

        resultado.append(schemas.EleicaoResumoSchema(
            id=el.id,
            ano=el.ano,
            detalhes=detalhes_list
        ))

    return resultado


@app.get("/api/resultados", response_model=List[schemas.ResultadoCandidatoSchema], tags=["Resultados"])
def obter_resultados(
    ano: int = Query(2024, description="Ano da eleição (ex: 2000 a 2024)"),
    cargo: str = Query("Vereador", description="Cargo concorrido (Prefeito ou Vereador)"),
    db: Session = Depends(get_db)
):
    """
    Retorna o ranking oficial de candidatos de uma eleição (ano e cargo), trazendo
    nome_urna, nome_completo, titulo_eleitor, numero_urna, sigla do partido, votos,
    posicao e situacao.
    """
    eleicao = db.query(models.Eleicao).filter(models.Eleicao.ano == ano).first()
    if not eleicao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Eleição do ano {ano} não encontrada."
        )

    # Consulta dos votos válidos para cálculo de percentual
    detalhe = db.query(models.DetalhesVotacao).filter(
        models.DetalhesVotacao.id_eleicao == eleicao.id,
        models.DetalhesVotacao.cargo.ilike(cargo)
    ).first()
    votos_validos_totais = detalhe.validos if detalhe and detalhe.validos and detalhe.validos > 0 else 0

    candidatos_raw = (
        db.query(
            models.CandidatosEleicao,
            models.DadosCandidato.nome_completo,
            models.Partidos.sigla
        )
        .join(models.DadosCandidato, models.CandidatosEleicao.titulo_eleitor == models.DadosCandidato.titulo_eleitor)
        .join(models.Partidos, models.CandidatosEleicao.id_partido == models.Partidos.id)
        .filter(
            models.CandidatosEleicao.id_eleicao == eleicao.id,
            models.CandidatosEleicao.cargo.ilike(cargo)
        )
        .order_by(
            asc(models.CandidatosEleicao.posicao).nulls_last(),
            desc(models.CandidatosEleicao.votos)
        )
        .all()
    )

    lista_resultados = []
    # Caso votos_validos_totais seja 0 no DTO original (algumas eleições antigas), calculamos pela soma dos votos nominais
    soma_votos = sum(cand.votos for cand, _, _ in candidatos_raw) or 1

    for cand, nome_completo, sigla in candidatos_raw:
        divisor = votos_validos_totais if votos_validos_totais > 0 else soma_votos
        pct = round((cand.votos / divisor) * 100, 2)

        lista_resultados.append(schemas.ResultadoCandidatoSchema(
            posicao=cand.posicao,
            numero_urna=cand.numero_urna,
            nome_urna=cand.nome_urna,
            nome_completo=nome_completo,
            titulo_eleitor=cand.titulo_eleitor,
            sigla_partido=sigla,
            cargo=cand.cargo,
            votos=cand.votos,
            situacao=cand.situacao,
            percentual_validos=pct
        ))

    return lista_resultados


@app.get("/api/candidatos/{titulo_eleitor}/historico", response_model=schemas.CandidatoHistoricoResponse, tags=["Dossiê"])
def obter_historico_candidato(
    titulo_eleitor: str,
    db: Session = Depends(get_db)
):
    """
    Busca a pessoa física na tabela Dados_Candidato e lista TODAS as eleições que ela
    disputou entre 2000 e 2024, destacando evolução de votos, trocas de partido e mandatos.
    """
    candidato = db.query(models.DadosCandidato).filter(
        models.DadosCandidato.titulo_eleitor == titulo_eleitor
    ).first()

    if not candidato:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidato com título de eleitor {titulo_eleitor} não encontrado na base de dados."
        )

    disputas = (
        db.query(
            models.CandidatosEleicao,
            models.Eleicao.ano,
            models.Partidos.sigla
        )
        .join(models.Eleicao, models.CandidatosEleicao.id_eleicao == models.Eleicao.id)
        .join(models.Partidos, models.CandidatosEleicao.id_partido == models.Partidos.id)
        .filter(models.CandidatosEleicao.titulo_eleitor == titulo_eleitor)
        .order_by(asc(models.Eleicao.ano))
        .all()
    )

    historico = []
    total_votos = 0
    total_mandatos = 0

    for cand, ano, sigla in disputas:
        total_votos += cand.votos
        if "eleito" in cand.situacao.lower() and "não" not in cand.situacao.lower():
            total_mandatos += 1

        historico.append(schemas.HistoricoParticipacaoSchema(
            ano=ano,
            cargo=cand.cargo,
            numero_urna=cand.numero_urna,
            nome_urna=cand.nome_urna,
            sigla_partido=sigla,
            votos=cand.votos,
            situacao=cand.situacao,
            posicao=cand.posicao
        ))

    return schemas.CandidatoHistoricoResponse(
        titulo_eleitor=candidato.titulo_eleitor,
        nome_completo=candidato.nome_completo,
        data_nascimento=candidato.data_nascimento,
        total_eleicoes_disputadas=len(disputas),
        total_mandatos_conquistados=total_mandatos,
        total_votos_acumulados=total_votos,
        historico=historico
    )


@app.get("/api/partidos/{ano}", response_model=schemas.PartidosAnoResponse, tags=["Partidos"])
def obter_partidos_ano(
    ano: int,
    db: Session = Depends(get_db)
):
    """
    Retorna o desempenho partidário consolidado (Partidos_Eleicao) para vereador no ano
    selecionado (votos nominais, de legenda e total por agremiação).
    """
    eleicao = db.query(models.Eleicao).filter(models.Eleicao.ano == ano).first()
    if not eleicao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Eleição do ano {ano} não encontrada."
        )

    desempenhos = (
        db.query(
            models.PartidosEleicao,
            models.Partidos.sigla
        )
        .join(models.Partidos, models.PartidosEleicao.id_partido == models.Partidos.id)
        .filter(models.PartidosEleicao.id_eleicao == eleicao.id)
        .order_by(desc(models.PartidosEleicao.total_votos))
        .all()
    )

    total_geral = sum(p.total_votos for p, _ in desempenhos) or 1
    partidos_list = []

    for p, sigla in desempenhos:
        pct = round((p.total_votos / total_geral) * 100, 2)
        partidos_list.append(schemas.DesempenhoPartidoSchema(
            sigla=sigla,
            votos_nominais=p.votos_nominais or 0,
            votos_legenda=p.votos_legenda or 0,
            total_votos=p.total_votos or 0,
            percentual_total=pct
        ))

    return schemas.PartidosAnoResponse(
        ano=ano,
        partidos=partidos_list,
        total_geral_votos=total_geral if total_geral > 1 else 0
    )


@app.get("/api/candidatos/busca", tags=["Dossiê"])
def buscar_candidatos(
    q: str = Query(..., min_length=2, description="Nome civil, nome de urna ou título"),
    db: Session = Depends(get_db)
):
    """Endpoint utilitário de busca rápida para autocomplete e pesquisa global."""
    termo = f"%{q.strip()}%"
    resultados = (
        db.query(models.DadosCandidato)
        .filter(
            (models.DadosCandidato.nome_completo.ilike(termo)) |
            (models.DadosCandidato.titulo_eleitor.ilike(termo))
        )
        .limit(15)
        .all()
    )
    return [
        {
            "titulo_eleitor": c.titulo_eleitor,
            "nome_completo": c.nome_completo,
            "data_nascimento": str(c.data_nascimento) if c.data_nascimento else None
        }
        for c in resultados
    ]
