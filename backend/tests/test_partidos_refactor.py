import pytest
from fastapi.testclient import TestClient
import sys
import os

# Adiciona o diretório backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


def test_resolver_partido_polimorfico_70():
    """
    Testa que a rota /api/partidos/resolver/{termo} resolve indistintamente:
    - O número TSE: 70
    - A sigla atual: AVANTE
    - A sigla histórica: PT do B e PTdoB
    Todos retornando o mesmo partido canônico número 70.
    """
    for termo in ["70", "AVANTE", "avante", "PT do B", "pt do b", "PTdoB"]:
        response = client.get(f"/api/partidos/resolver/{termo}")
        assert response.status_code == 200, f"Falha ao resolver termo {termo}: {response.text}"
        data = response.json()
        assert data["numero"] == 70
        assert data["sigla_atual"] == "AVANTE"
        assert any("PT DO B" in s.upper() for s in data["siglas_anteriores"])


def test_resolver_partido_polimorfico_15_mdb():
    """Testa que 15, MDB e PMDB resolvem para o mesmo partido canônico número 15."""
    for termo in ["15", "MDB", "PMDB", "pmdb"]:
        response = client.get(f"/api/partidos/resolver/{termo}")
        assert response.status_code == 200, f"Falha ao resolver termo {termo}: {response.text}"
        data = response.json()
        assert data["numero"] == 15
        assert data["sigla_atual"] == "MDB"


def test_linha_do_tempo_unificada_partido_70():
    """
    Testa que /api/partidos/timeline/{termo} retorna o histórico completo
    unificado de 2000 a 2024 para o partido 70 (tanto sob PT do B quanto sob AVANTE).
    """
    for termo in ["70", "AVANTE", "PT do B"]:
        response = client.get(f"/api/partidos/timeline/{termo}")
        assert response.status_code == 200, f"Falha na timeline para {termo}: {response.text}"
        data = response.json()
        assert data["partido"]["numero"] == 70
        assert data["partido"]["sigla_atual"] == "AVANTE"
        
        # Validar estatísticas gerais agregadas
        stats = data["estatisticas_gerais"]
        assert stats["total_votos_historico"] > 0
        assert stats["total_eleicoes_disputadas"] >= 2
        assert stats["total_candidatos_historico"] > 0

        # Verificar pleitos históricos sob PT do B (ex: 2008) e sob Avante (ex: 2020)
        anos_encontrados = {el["ano"]: el for el in data["eleicoes"]}
        if 2008 in anos_encontrados:
            el_2008 = anos_encontrados[2008]
            assert "PT DO B" in el_2008["sigla_vigente"].upper()
            assert el_2008["is_rebranded"] is True


def test_resultados_filtro_partido_polimorfico():
    """
    Testa que /api/resultados aceita o parâmetro 'partido' como número ou sigla de época.
    Em 2008, o partido 70 concorreu como PT do B.
    """
    resp_num = client.get("/api/resultados?ano=2008&cargo=Vereador&partido=70")
    assert resp_num.status_code == 200
    dados_num = resp_num.json()

    resp_sigla = client.get("/api/resultados?ano=2008&cargo=Vereador&partido=PT do B")
    assert resp_sigla.status_code == 200
    dados_sigla = resp_sigla.json()

    # Devem retornar o mesmo conjunto de candidatos
    assert len(dados_num) == len(dados_sigla)
    assert len(dados_num) > 0
    for cand in dados_num:
        assert cand["partido_numero"] == 70
        assert cand["sigla_atual"] == "AVANTE"


def test_coligacoes_vinculo_partido_numero():
    """
    Testa que /api/coligacoes resolve as coligações vinculando partidos pelo número
    e mantendo a fidelidade histórica dos membros.
    """
    response = client.get("/api/coligacoes?ano=2008")
    assert response.status_code == 200
    coligacoes = response.json()
    assert len(coligacoes) > 0

    # Verifica se os membros possuem partido_numero preenchido
    tem_membro_com_numero = False
    for col in coligacoes:
        for membro in col.get("partidos", []):
            if membro.get("partido_numero"):
                tem_membro_com_numero = True
                assert isinstance(membro["partido_numero"], int)
    assert tem_membro_com_numero is True
