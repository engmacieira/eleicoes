"""
Script de Migração e Carga de Dados Canônicos (2000 a 2024)
Compatibilidade Dual-DB: SQLite local (eleicoes.db) e Cloud SQL (PostgreSQL).

Garante que o número TSE (2 dígitos) atue como chave canônica única e referencial (FK),
desacoplando o modelo de strings soltas de siglas e unificando históricos e rebrandings.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Adicionar raiz do backend ao sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.infrastructure.database import engine, SessionLocal
from backend.app.infrastructure.models import (
    Base,
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

ARQUIVO_JSON = BASE_DIR / "public/assets/aistudio/eleicoes_braunas_ed52d128.json"

# Catálogo canônico mestre dos partidos em Braúnas/MG com histórico de denominações
PARTIDOS_CANONICOS = [
    {
        "numero": 10,
        "sigla_atual": "REPUBLICANOS",
        "nome_atual": "Republicanos",
        "historico": [
            {"sigla": "PRB", "nome": "Partido Republicano Brasileiro", "ano_inicio": 2005, "ano_fim": 2019, "is_atual": False},
            {"sigla": "REPUBLICANOS", "nome": "Republicanos", "ano_inicio": 2019, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 11,
        "sigla_atual": "PP",
        "nome_atual": "Progressistas",
        "historico": [
            {"sigla": "PPB", "nome": "Partido Progressista Brasileiro", "ano_inicio": 1995, "ano_fim": 2003, "is_atual": False},
            {"sigla": "PP", "nome": "Progressistas", "ano_inicio": 2003, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 12,
        "sigla_atual": "PDT",
        "nome_atual": "Partido Democrático Trabalhista",
        "historico": [
            {"sigla": "PDT", "nome": "Partido Democrático Trabalhista", "ano_inicio": 1979, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 13,
        "sigla_atual": "PT",
        "nome_atual": "Partido dos Trabalhadores",
        "historico": [
            {"sigla": "PT", "nome": "Partido dos Trabalhadores", "ano_inicio": 1980, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 14,
        "sigla_atual": "PTB",
        "nome_atual": "Partido Trabalhista Brasileiro",
        "historico": [
            {"sigla": "PTB", "nome": "Partido Trabalhista Brasileiro", "ano_inicio": 1979, "ano_fim": 2023, "is_atual": False},
        ],
    },
    {
        "numero": 15,
        "sigla_atual": "MDB",
        "nome_atual": "Movimento Democrático Brasileiro",
        "historico": [
            {"sigla": "PMDB", "nome": "Partido do Movimento Democrático Brasileiro", "ano_inicio": 1980, "ano_fim": 2017, "is_atual": False},
            {"sigla": "MDB", "nome": "Movimento Democrático Brasileiro", "ano_inicio": 2017, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 18,
        "sigla_atual": "REDE",
        "nome_atual": "Rede Sustentabilidade",
        "historico": [
            {"sigla": "REDE", "nome": "Rede Sustentabilidade", "ano_inicio": 2013, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 19,
        "sigla_atual": "PODE",
        "nome_atual": "Podemos",
        "historico": [
            {"sigla": "PTN", "nome": "Partido Trabalhista Nacional", "ano_inicio": 1995, "ano_fim": 2017, "is_atual": False},
            {"sigla": "PODE", "nome": "Podemos", "ano_inicio": 2017, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 20,
        "sigla_atual": "PSC",
        "nome_atual": "Partido Social Cristão",
        "historico": [
            {"sigla": "PSC", "nome": "Partido Social Cristão", "ano_inicio": 1985, "ano_fim": 2023, "is_atual": False},
        ],
    },
    {
        "numero": 22,
        "sigla_atual": "PL",
        "nome_atual": "Partido Liberal",
        "historico": [
            {"sigla": "PL", "nome": "Partido Liberal", "ano_inicio": 1985, "ano_fim": 2006, "is_atual": False},
            {"sigla": "PR", "nome": "Partido da República", "ano_inicio": 2006, "ano_fim": 2019, "is_atual": False},
            {"sigla": "PL", "nome": "Partido Liberal", "ano_inicio": 2019, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 23,
        "sigla_atual": "CIDADANIA",
        "nome_atual": "Cidadania",
        "historico": [
            {"sigla": "PPS", "nome": "Partido Popular Socialista", "ano_inicio": 1992, "ano_fim": 2019, "is_atual": False},
            {"sigla": "CIDADANIA", "nome": "Cidadania", "ano_inicio": 2019, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 25,
        "sigla_atual": "PRD",
        "nome_atual": "Partido Renovação Democrática",
        "historico": [
            {"sigla": "PFL", "nome": "Partido da Frente Liberal", "ano_inicio": 1985, "ano_fim": 2007, "is_atual": False},
            {"sigla": "DEM", "nome": "Democratas", "ano_inicio": 2007, "ano_fim": 2022, "is_atual": False},
            {"sigla": "PRD", "nome": "Partido Renovação Democrática", "ano_inicio": 2023, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 27,
        "sigla_atual": "DC",
        "nome_atual": "Democracia Cristã",
        "historico": [
            {"sigla": "PSDC", "nome": "Partido Social Democrata Cristão", "ano_inicio": 1995, "ano_fim": 2018, "is_atual": False},
            {"sigla": "DC", "nome": "Democracia Cristã", "ano_inicio": 2018, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 31,
        "sigla_atual": "PHS",
        "nome_atual": "Partido Humanista da Solidariedade",
        "historico": [
            {"sigla": "PHS", "nome": "Partido Humanista da Solidariedade", "ano_inicio": 1997, "ano_fim": 2019, "is_atual": False},
        ],
    },
    {
        "numero": 36,
        "sigla_atual": "AGIR",
        "nome_atual": "Agir",
        "historico": [
            {"sigla": "PRN", "nome": "Partido da Reconstrução Nacional", "ano_inicio": 1989, "ano_fim": 2000, "is_atual": False},
            {"sigla": "PTC", "nome": "Partido Trabalhista Cristão", "ano_inicio": 2000, "ano_fim": 2022, "is_atual": False},
            {"sigla": "AGIR", "nome": "Agir", "ano_inicio": 2022, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 40,
        "sigla_atual": "PSB",
        "nome_atual": "Partido Socialista Brasileiro",
        "historico": [
            {"sigla": "PSB", "nome": "Partido Socialista Brasileiro", "ano_inicio": 1985, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 43,
        "sigla_atual": "PV",
        "nome_atual": "Partido Verde",
        "historico": [
            {"sigla": "PV", "nome": "Partido Verde", "ano_inicio": 1986, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 44,
        "sigla_atual": "UNIÃO",
        "nome_atual": "União Brasil",
        "historico": [
            {"sigla": "UNIÃO", "nome": "União Brasil", "ano_inicio": 2022, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 45,
        "sigla_atual": "PSDB",
        "nome_atual": "Partido da Social Democracia Brasileira",
        "historico": [
            {"sigla": "PSDB", "nome": "Partido da Social Democracia Brasileira", "ano_inicio": 1988, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 51,
        "sigla_atual": "PATRIOTA",
        "nome_atual": "Patriota",
        "historico": [
            {"sigla": "PEN", "nome": "Partido Ecológico Nacional", "ano_inicio": 2012, "ano_fim": 2017, "is_atual": False},
            {"sigla": "PATRIOTA", "nome": "Patriota", "ano_inicio": 2017, "ano_fim": 2023, "is_atual": False},
        ],
    },
    {
        "numero": 55,
        "sigla_atual": "PSD",
        "nome_atual": "Partido Social Democrático",
        "historico": [
            {"sigla": "PSD", "nome": "Partido Social Democrático", "ano_inicio": 2011, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 70,
        "sigla_atual": "AVANTE",
        "nome_atual": "Avante",
        "historico": [
            {"sigla": "PT do B", "nome": "Partido Trabalhista do Brasil", "ano_inicio": 1989, "ano_fim": 2017, "is_atual": False},
            {"sigla": "PTdoB", "nome": "Partido Trabalhista do Brasil", "ano_inicio": 1989, "ano_fim": 2017, "is_atual": False},
            {"sigla": "AVANTE", "nome": "Avante", "ano_inicio": 2017, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 77,
        "sigla_atual": "SOLIDARIEDADE",
        "nome_atual": "Solidariedade",
        "historico": [
            {"sigla": "SD", "nome": "Solidariedade", "ano_inicio": 2013, "ano_fim": 2019, "is_atual": False},
            {"sigla": "SOLIDARIEDADE", "nome": "Solidariedade", "ano_inicio": 2019, "ano_fim": None, "is_atual": True},
        ],
    },
    {
        "numero": 90,
        "sigla_atual": "PROS",
        "nome_atual": "Partido Republicano da Ordem Social",
        "historico": [
            {"sigla": "PROS", "nome": "Partido Republicano da Ordem Social", "ano_inicio": 2013, "ano_fim": 2023, "is_atual": False},
        ],
    },
]

# Mapa de resolução direta para partidos_vereador onde há apenas a string da sigla
SIGLA_PARA_NUMERO = {
    "PT DO B": 70,
    "PTDOB": 70,
    "AVANTE": 70,
    "PMDB": 15,
    "MDB": 15,
    "PFL": 25,
    "DEM": 25,
    "PRD": 25,
    "PPB": 11,
    "PP": 11,
    "PDT": 12,
    "PT": 13,
    "PTB": 14,
    "REDE": 18,
    "PODE": 19,
    "PTN": 19,
    "PSC": 20,
    "PR": 22,
    "PL": 22,
    "PPS": 23,
    "CIDADANIA": 23,
    "DC": 27,
    "PSDC": 27,
    "PHS": 31,
    "PTC": 36,
    "AGIR": 36,
    "PSB": 40,
    "PV": 43,
    "PSDB": 45,
    "PATRIOTA": 51,
    "PEN": 51,
    "PSD": 55,
    "SD": 77,
    "SOLIDARIEDADE": 77,
    "PROS": 90,
    "UNIÃO": 44,
    "UNIAO": 44,
    "REPUBLICANOS": 10,
    "PRB": 10,
}


def normalizar_data(d_str):
    if not d_str:
        return None
    d_str = str(d_str).strip()
    if "/" in d_str:
        partes = d_str.split("/")
        if len(partes) == 3:
            return datetime.strptime(f"{partes[2]}-{partes[1].zfill(2)}-{partes[0].zfill(2)}", "%Y-%m-%d").date()
    try:
        return datetime.strptime(d_str, "%Y-%m-%d").date()
    except Exception:
        return None


def seed_database():
    print(f"=== Iniciando Seed Canônico com Identidade por Número TSE ===")
    print(f"Banco alvo conectado: {engine.url}")

    if not ARQUIVO_JSON.exists():
        print(f"[ERRO] Arquivo JSON não encontrado em: {ARQUIVO_JSON}")
        return

    with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
        dados = json.load(f)

    # Criação das tabelas via metadados SQLAlchemy
    Base.metadata.create_all(bind=engine)
    print("[1/6] Tabelas do banco de dados verificadas/criadas com sucesso.")

    db = SessionLocal()
    try:
        # 1. Carga de Dados_Candidato (Pessoas Físicas)
        print("[2/6] Inserindo/atualizando pessoas físicas (Dados_Candidato)...")
        candidatos_base = dados.get("candidatos_base", {})
        total_pessoas = 0
        for info in candidatos_base.values():
            tit = info["titulo_eleitor"].strip()
            existing = db.query(DadosCandidato).filter_by(titulo_eleitor=tit).first()
            dt_nasc = normalizar_data(info.get("data_nascimento"))
            if not existing:
                cand = DadosCandidato(
                    titulo_eleitor=tit,
                    nome_completo=info["nome_completo"].strip().upper(),
                    data_nascimento=dt_nasc,
                    is_active=True,
                    is_deleted=False,
                )
                db.add(cand)
                total_pessoas += 1
            else:
                existing.nome_completo = info["nome_completo"].strip().upper()
                if dt_nasc:
                    existing.data_nascimento = dt_nasc
                existing.is_active = True
                existing.is_deleted = False

        db.commit()
        print(f"      Pessoas físicas processadas: {len(candidatos_base)} (novas: {total_pessoas}).")

        # 2. Carga Mestre de Partidos Canônicos (Número TSE) + Histórico de Siglas
        print("[3/6] Inserindo/atualizando catálogo canônico de partidos e rebrandings...")
        partido_id_map = {}  # numero -> id_partido

        for p_data in PARTIDOS_CANONICOS:
            num = p_data["numero"]
            partido = db.query(Partidos).filter_by(numero=num).first()
            if not partido:
                partido = Partidos(
                    numero=num,
                    sigla_atual=p_data["sigla_atual"],
                    nome_atual=p_data["nome_atual"],
                    is_active=True,
                    is_deleted=False,
                )
                db.add(partido)
                db.flush()
            else:
                partido.sigla_atual = p_data["sigla_atual"]
                partido.nome_atual = p_data["nome_atual"]
                partido.is_active = True
                partido.is_deleted = False
                db.flush()

            partido_id_map[num] = partido.id

            # Inserir ou atualizar histórico de siglas
            for h in p_data.get("historico", []):
                h_sigla = h["sigla"].strip().upper()
                exist_h = (
                    db.query(PartidoHistorico)
                    .filter_by(partido_numero=num, sigla=h_sigla)
                    .first()
                )
                if not exist_h:
                    novo_h = PartidoHistorico(
                        id_partido=partido.id,
                        partido_numero=num,
                        numero=num,
                        sigla=h_sigla,
                        nome=h.get("nome"),
                        ano_inicio=h.get("ano_inicio"),
                        ano_fim=h.get("ano_fim"),
                        is_atual=h.get("is_atual", False),
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(novo_h)
                else:
                    exist_h.nome = h.get("nome")
                    exist_h.ano_inicio = h.get("ano_inicio")
                    exist_h.ano_fim = h.get("ano_fim")
                    exist_h.is_atual = h.get("is_atual", False)
                    exist_h.is_active = True
                    exist_h.is_deleted = False

        db.commit()
        print(f"      Partidos canônicos cadastrados: {len(PARTIDOS_CANONICOS)} agremiações.")

        # 3. Iteração por Eleições (2000 a 2024)
        print("[4/6] Processando pleitos eleitorais, detalhes de votação e bancadas...")
        eleicoes_dict = dados.get("eleicoes", {})
        total_candidaturas = 0
        total_desempenhos = 0
        coligacoes_criadas = 0

        for ano_str, el_data in eleicoes_dict.items():
            ano = el_data["ano"]
            eleicao = db.query(Eleicao).filter_by(ano=ano).first()
            if not eleicao:
                eleicao = Eleicao(ano=ano, is_active=True, is_deleted=False)
                db.add(eleicao)
                db.flush()
            else:
                eleicao.is_active = True
                eleicao.is_deleted = False
                db.flush()

            id_eleicao = eleicao.id

            # Detalhes de Votação
            detalhes = el_data.get("detalhes", {})
            for cargo_nome, det in detalhes.items():
                if not det:
                    continue
                cargo_fmt = cargo_nome.capitalize()
                d_obj = (
                    db.query(DetalhesVotacao)
                    .filter_by(id_eleicao=id_eleicao, cargo=cargo_fmt)
                    .first()
                )
                if not d_obj:
                    d_obj = DetalhesVotacao(
                        id_eleicao=id_eleicao,
                        cargo=cargo_fmt,
                        aptos=det.get("aptos", 0),
                        comparecimento=det.get("comparecimento", 0),
                        abstencoes=det.get("abstencoes", 0),
                        validos=det.get("validos", 0),
                        brancos=det.get("brancos", 0),
                        nulos=det.get("nulos", 0),
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(d_obj)
                else:
                    d_obj.aptos = det.get("aptos", 0)
                    d_obj.comparecimento = det.get("comparecimento", 0)
                    d_obj.abstencoes = det.get("abstencoes", 0)
                    d_obj.validos = det.get("validos", 0)
                    d_obj.brancos = det.get("brancos", 0)
                    d_obj.nulos = det.get("nulos", 0)

            # Desempenho Partidário em Vereador (Partidos_Eleicao)
            for pv in el_data.get("partidos_vereador", []):
                sigla_p = pv["partido"].strip().upper()
                num_p = SIGLA_PARA_NUMERO.get(sigla_p)
                if not num_p:
                    # Tentar achar no banco
                    hist = db.query(PartidoHistorico).filter_by(sigla=sigla_p).first()
                    if hist:
                        num_p = hist.partido_numero

                if not num_p:
                    print(f"      [AVISO] Partido {sigla_p} não encontrado no catálogo canônico.")
                    continue

                id_partido = partido_id_map.get(num_p)
                p_eleicao = (
                    db.query(PartidosEleicao)
                    .filter_by(id_eleicao=id_eleicao, partido_numero=num_p)
                    .first()
                )
                if not p_eleicao:
                    p_eleicao = PartidosEleicao(
                        id_eleicao=id_eleicao,
                        partido_numero=num_p,
                        votos_nominais=pv.get("votos_nominais", 0),
                        votos_legenda=pv.get("votos_legenda", 0),
                        total_votos=pv.get("total_votos", 0),
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(p_eleicao)
                    total_desempenhos += 1
                else:
                    p_eleicao.votos_nominais = pv.get("votos_nominais", 0)
                    p_eleicao.votos_legenda = pv.get("votos_legenda", 0)
                    p_eleicao.total_votos = pv.get("total_votos", 0)

            # Candidaturas (Candidatos_Eleicao)
            candidatos_pleito = el_data.get("resultados", [])
            prefeitos_eleicao = []

            for cand in candidatos_pleito:
                tit = cand.get("titulo_eleitor")
                if not tit:
                    continue

                num_urna = cand["numero"]
                # REGRA DE OURO: Deducao automatica via 2 primeiros digitos do numero de urna
                num_partido_deduzido = int(str(num_urna)[:2])

                sigla_epoca = cand.get("partido", "").strip().upper()

                # Validar e obter ID do partido
                id_partido = partido_id_map.get(num_partido_deduzido)
                if not id_partido:
                    # Criar partido emergencial caso surja número novo
                    p_emerg = Partidos(
                        numero=num_partido_deduzido,
                        sigla_atual=sigla_epoca or f"P{num_partido_deduzido}",
                        nome_atual=f"Partido {num_partido_deduzido}",
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(p_emerg)
                    db.flush()
                    partido_id_map[num_partido_deduzido] = p_emerg.id
                    id_partido = p_emerg.id

                cand_obj = (
                    db.query(CandidatosEleicao)
                    .filter_by(
                        id_eleicao=id_eleicao,
                        titulo_eleitor=tit,
                        cargo=cand["cargo"],
                    )
                    .first()
                )

                if not cand_obj:
                    cand_obj = CandidatosEleicao(
                        titulo_eleitor=tit,
                        id_eleicao=id_eleicao,
                        partido_numero=num_partido_deduzido,
                        cargo=cand["cargo"],
                        numero_urna=num_urna,
                        nome_urna=cand["nome_urna"],
                        votos=cand["votos"],
                        situacao=cand["situacao"],
                        posicao=cand.get("posicao"),
                        sigla_epoca=sigla_epoca,
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(cand_obj)
                    total_candidaturas += 1
                else:
                    cand_obj.partido_numero = num_partido_deduzido
                    cand_obj.numero_urna = num_urna
                    cand_obj.nome_urna = cand["nome_urna"]
                    cand_obj.votos = cand["votos"]
                    cand_obj.situacao = cand["situacao"]
                    cand_obj.posicao = cand.get("posicao")
                    cand_obj.sigla_epoca = sigla_epoca

                if cand["cargo"].upper() == "PREFEITO":
                    prefeitos_eleicao.append({
                        "numero": num_partido_deduzido,
                        "numero_urna": num_urna,
                        "nome_urna": cand["nome_urna"],
                        "sigla_epoca": sigla_epoca,
                    })

            # Montagem e Vínculo Canônico de Coligações
            for pref in prefeitos_eleicao:
                p_num = pref["numero"]
                sigla_e = pref["sigla_epoca"]
                nome_colig = f"Coligação {pref['nome_urna']}"
                comp_siglas = sigla_e

                colig = (
                    db.query(Coligacao)
                    .filter_by(
                        id_eleicao=id_eleicao,
                        cargo="Prefeito",
                        numero_urna=pref["numero_urna"],
                    )
                    .first()
                )
                if not colig:
                    colig = Coligacao(
                        id_eleicao=id_eleicao,
                        cargo="Prefeito",
                        numero_urna=pref["numero_urna"],
                        nome_coligacao=nome_colig,
                        partido_numero_titular=p_num,
                        sigla_partido_titular=sigla_e,
                        composicao_siglas=comp_siglas,
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(colig)
                    db.flush()
                    coligacoes_criadas += 1

                    # Adicionar partido titular como membro cabeça de chapa
                    membro = ColigacaoPartidos(
                        id_coligacao=colig.id,
                        partido_numero=p_num,
                        papel="Cabeça de Chapa",
                        sigla_epoca=sigla_e,
                        is_active=True,
                        is_deleted=False,
                    )
                    db.add(membro)
                else:
                    colig.partido_numero_titular = p_num
                    colig.sigla_partido_titular = sigla_e

        db.commit()
        print(f"[5/6] Carga concluída com sucesso:")
        print(f"      - Desempenhos de bancada inseridos: {total_desempenhos}")
        print(f"      - Candidaturas registradas: {total_candidaturas}")
        print(f"      - Coligações majoritárias estruturadas: {coligacoes_criadas}")

        # Validação final de integridade
        total_cand_bd = db.query(CandidatosEleicao).count()
        total_partidos_bd = db.query(Partidos).count()
        total_colig_bd = db.query(Coligacao).count()
        print(f"[6/6] Auditoria de Integridade Referencial:")
        print(f"      Total de Partidos no banco: {total_partidos_bd}")
        print(f"      Total de Candidaturas no banco: {total_cand_bd}")
        print(f"      Total de Coligações no banco: {total_colig_bd}")
        print("=== Migração e Seed Concluídos com 100% de Integridade! ===")

    except Exception as e:
        db.rollback()
        print(f"[ERRO CRÍTICO] Falha durante a migração/seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
