import json
import os
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

# Caminho relativo para o JSON base (Ajuste se o nome do arquivo for diferente)
ARQUIVO_JSON = "public/assets/aistudio/eleicoes_braunas_ed52d128.json"

DDL_SCHEMA = """
CREATE TABLE IF NOT EXISTS Dados_Candidato (
    titulo_eleitor VARCHAR(15) PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE
);
CREATE TABLE IF NOT EXISTS Eleicao (
    id SERIAL PRIMARY KEY,
    ano INT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS Detalhes_Votacao (
    id SERIAL PRIMARY KEY,
    id_eleicao INT REFERENCES Eleicao(id) ON DELETE CASCADE,
    cargo VARCHAR(50) NOT NULL,
    aptos INT,
    comparecimento INT,
    abstencoes INT,
    validos INT,
    brancos INT,
    nulos INT,
    UNIQUE(id_eleicao, cargo)
);
CREATE TABLE IF NOT EXISTS Partidos (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(20) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS Partidos_Eleicao (
    id SERIAL PRIMARY KEY,
    id_eleicao INT REFERENCES Eleicao(id) ON DELETE CASCADE,
    id_partido INT REFERENCES Partidos(id) ON DELETE CASCADE,
    votos_nominais INT,
    votos_legenda INT,
    total_votos INT,
    UNIQUE(id_eleicao, id_partido)
);
CREATE TABLE IF NOT EXISTS Candidatos_Eleicao (
    id SERIAL PRIMARY KEY,
    titulo_eleitor VARCHAR(15) REFERENCES Dados_Candidato(titulo_eleitor) ON DELETE RESTRICT,
    id_eleicao INT REFERENCES Eleicao(id) ON DELETE CASCADE,
    id_partido INT REFERENCES Partidos(id) ON DELETE RESTRICT,
    cargo VARCHAR(50) NOT NULL,
    numero_urna INT NOT NULL,
    nome_urna VARCHAR(150) NOT NULL,
    votos INT NOT NULL,
    situacao VARCHAR(50) NOT NULL,
    posicao INT,
    UNIQUE(titulo_eleitor, id_eleicao, cargo)
);
CREATE INDEX IF NOT EXISTS idx_cand_eleicao_cargo ON Candidatos_Eleicao(cargo);
CREATE INDEX IF NOT EXISTS idx_detalhes_eleicao ON Detalhes_Votacao(id_eleicao);
"""

def normalizar_data(d):
    if not d:
        return None
    d = str(d).strip()
    if "/" in d:
        partes = d.split("/")
        if len(partes) == 3:
            return f"{partes[2]}-{partes[1].zfill(2)}-{partes[0].zfill(2)}"
    return d

def processar():
    if not os.path.exists(ARQUIVO_JSON):
        print(f"[ERRO] JSON não encontrado em: {ARQUIVO_JSON}")
        return

    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        dados = json.load(f)

    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    conn.autocommit = False
    cursor = conn.cursor()

    try:
        cursor.execute("SET datestyle TO 'ISO, DMY';")
        cursor.execute(DDL_SCHEMA)
        
        # 1. Pessoas
        cands = [(info['titulo_eleitor'], info['nome_completo'], normalizar_data(info['data_nascimento'])) 
                 for info in dados['candidatos_base'].values()]
        execute_values(cursor, "INSERT INTO Dados_Candidato (titulo_eleitor, nome_completo, data_nascimento) VALUES %s ON CONFLICT (titulo_eleitor) DO NOTHING", cands)

        # Iteração por Eleição
        for ano_str, eleicao in dados['eleicoes'].items():
            ano = eleicao['ano']
            cursor.execute("INSERT INTO Eleicao (ano) VALUES (%s) ON CONFLICT (ano) DO NOTHING RETURNING id", (ano,))
            res = cursor.fetchone()
            if not res:
                cursor.execute("SELECT id FROM Eleicao WHERE ano = %s", (ano,))
                res = cursor.fetchone()
            id_eleicao = res[0]

            # 2. Detalhes Votação
            det = []
            for cargo, st in eleicao['detalhes'].items():
                if st: det.append((id_eleicao, cargo.capitalize(), st.get('aptos',0), st.get('comparecimento',0), st.get('abstencoes',0), st.get('validos',0), st.get('brancos',0), st.get('nulos',0)))
            if det: execute_values(cursor, "INSERT INTO Detalhes_Votacao (id_eleicao, cargo, aptos, comparecimento, abstencoes, validos, brancos, nulos) VALUES %s ON CONFLICT (id_eleicao, cargo) DO NOTHING", det)

            # 3. Partidos
            partidos_unicos = set([p['partido'] for p in eleicao['partidos_vereador']] + [c['partido'] for c in eleicao['resultados']])
            execute_values(cursor, "INSERT INTO Partidos (sigla) VALUES %s ON CONFLICT (sigla) DO NOTHING", [(p,) for p in partidos_unicos])

            # 4. Desempenho Partido
            pdados = []
            for p in eleicao['partidos_vereador']:
                cursor.execute("SELECT id FROM Partidos WHERE sigla = %s", (p['partido'],))
                id_partido = cursor.fetchone()[0]
                pdados.append((id_eleicao, id_partido, p['votos_nominais'], p['votos_legenda'], p['total_votos']))
            if pdados: execute_values(cursor, "INSERT INTO Partidos_Eleicao (id_eleicao, id_partido, votos_nominais, votos_legenda, total_votos) VALUES %s ON CONFLICT (id_eleicao, id_partido) DO NOTHING", pdados)

            # 5. Candidaturas
            cdados = []
            for rc in eleicao['resultados']:
                if not rc.get('titulo_eleitor'): continue
                cursor.execute("SELECT id FROM Partidos WHERE sigla = %s", (rc['partido'],))
                id_p = cursor.fetchone()[0]
                cdados.append((rc['titulo_eleitor'], id_eleicao, id_p, rc['cargo'], rc['numero'], rc['nome_urna'], rc['votos'], rc['situacao'], rc['posicao']))
            if cdados: execute_values(cursor, "INSERT INTO Candidatos_Eleicao (titulo_eleitor, id_eleicao, id_partido, cargo, numero_urna, nome_urna, votos, situacao, posicao) VALUES %s ON CONFLICT (titulo_eleitor, id_eleicao, cargo) DO NOTHING", cdados)

        conn.commit()
        print("[SUCESSO] Tabelas criadas e dados inseridos com sucesso!")
    except Exception as e:
        conn.rollback()
        print(f"[ERRO] {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    processar()
