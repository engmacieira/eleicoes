import pytest
import math
from fastapi.testclient import TestClient
import sys
import os

# Adiciona o diretório backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.domain.entities import (
    ParametrosQeEntity,
    ChapaProporcionalEntity,
    ChapaProporcionalPartidoEntity,
    PartidosEleicaoEntity,
    CandidatosEleicaoEntity,
    EleicaoEntity,
)
from app.application.use_cases import CalcularQuocienteEleitoralUseCase
from app.domain.repositories import IQuocienteEleitoralRepository, IEleicaoRepository

client = TestClient(app)


class MockEleicaoRepo(IEleicaoRepository):
    def list_all(self, ano=None):
        return [EleicaoEntity(id=1, ano=2024)]
    def get_by_ano(self, ano):
        return EleicaoEntity(id=1, ano=2024)
    def get_detalhes(self, id_eleicao, cargo=None):
        return []
    def create(self, ano):
        return EleicaoEntity(id=1, ano=ano)
    def soft_delete(self, id):
        return True


class MockQuocienteRepo(IQuocienteEleitoralRepository):
    def __init__(self, params=None, chapas=None, partidos_eleicao=None, candidatos_eleicao=None):
        self._params = params
        self._chapas = chapas or []
        self._partidos_eleicao = partidos_eleicao or []
        self._candidatos_eleicao = candidatos_eleicao or []

    def get_parametros(self, eleicao_id: int):
        return self._params

    def save_parametros(self, entity: ParametrosQeEntity):
        self._params = entity
        return entity

    def list_chapas(self, eleicao_id: int):
        return self._chapas

    def get_chapa_by_id(self, chapa_id: int):
        for c in self._chapas:
            if c.id == chapa_id:
                return c
        return None

    def create_chapa(self, eleicao_id: int, nome: str, tipo: str, partido_ids):
        chapa = ChapaProporcionalEntity(
            id=len(self._chapas) + 1,
            eleicao_id=eleicao_id,
            nome=nome,
            tipo=tipo,
            partidos=[
                ChapaProporcionalPartidoEntity(
                    chapa_proporcional_id=len(self._chapas) + 1,
                    partido_id=pid,
                    numero=pid,
                    sigla=f"P{pid}",
                )
                for pid in partido_ids
            ],
        )
        self._chapas.append(chapa)
        return chapa

    def update_chapa(self, chapa_id, nome=None, tipo=None, partido_ids=None, is_active=None):
        chapa = self.get_chapa_by_id(chapa_id)
        if chapa:
            if nome: chapa.nome = nome
            if tipo: chapa.tipo = tipo
            if is_active is not None: chapa.is_active = is_active
        return chapa

    def soft_delete_chapa(self, chapa_id):
        chapa = self.get_chapa_by_id(chapa_id)
        if chapa:
            chapa.is_deleted = True
            return True
        return False

    def verificar_partido_em_outra_chapa(self, eleicao_id, partido_id, ignore_chapa_id=None):
        for c in self._chapas:
            if ignore_chapa_id and c.id == ignore_chapa_id:
                continue
            for p in (c.partidos or []):
                if p.partido_id == partido_id:
                    return True
        return False

    def get_dados_apuracao_vereador(self, eleicao_id: int):
        return self._partidos_eleicao, self._candidatos_eleicao


def test_arredondamento_qe_tse():
    """
    Valida a regra oficial de arredondamento do Quociente Eleitoral (TSE):
    - Se a parte fracionária for <= 0.5, arredonda para baixo (floor). Ex: 450.50 -> 450
    - Se a parte fracionária for > 0.5, arredonda para cima (ceil). Ex: 450.51 -> 451
    """
    def calc_qe(votos_validos, vagas=9):
        qe_exato = votos_validos / vagas
        frac = round(qe_exato - math.floor(qe_exato), 6)
        return math.ceil(qe_exato) if frac > 0.5 else math.floor(qe_exato)

    # 4054 / 9 = 450.4444... -> frac = 0.4444... <= 0.5 -> 450
    assert calc_qe(4054, 9) == 450

    # 4055 / 9 = 450.5555... -> frac = 0.5555... > 0.5 -> 451
    assert calc_qe(4055, 9) == 451

    # Fração exata 0.5: 450.50 (9 vagas * 450.5 = 4054.5, testando a matemática da regra)
    val_exato_meio = 450.50
    frac_meio = round(val_exato_meio - math.floor(val_exato_meio), 6)
    arred_meio = math.ceil(val_exato_meio) if frac_meio > 0.5 else math.floor(val_exato_meio)
    assert arred_meio == 450

    # Fração 0.500001
    val_acima_meio = 450.500001
    frac_acima = round(val_acima_meio - math.floor(val_acima_meio), 6)
    arred_acima = math.ceil(val_acima_meio) if frac_acima > 0.5 else math.floor(val_acima_meio)
    assert arred_acima == 451


def test_motor_calculo_completo_9_vagas_qp_e_sobras():
    """
    Testa o motor completo de cálculo do QE:
    - 9 vagas em disputa
    - Total de votos válidos = 3.600 -> QE = 400
    - Barreira de 10% do QE = 40 votos
    - Barreira de 80% do QE para chapa = 320 votos
    - Barreira de 20% do QE para candidato = 80 votos
    - Chapas:
      * Chapa A: 1.250 votos (QP = 3 vagas diretas, mas apenas 2 candidatos têm >= 40 votos)
        -> Conquista 2 vagas por QP. 1 vaga não preenchida vai para as sobras.
      * Chapa B: 850 votos (QP = 2 vagas diretas, ambos candidatos têm >= 40 votos)
        -> Conquista 2 vagas por QP.
      * Chapa C: 700 votos (QP = 1 vaga direta, candidato tem >= 40 votos)
        -> Conquista 1 vaga por QP.
      * Chapa D: 500 votos (QP = 1 vaga direta, candidato tem >= 40 votos)
        -> Conquista 1 vaga por QP.
      * Chapa E: 300 votos (QP = 0 vagas diretas, < 80% do QE).
    - Total QP = 2 + 2 + 1 + 1 = 6 vagas diretas.
    - Vagas restantes para as Sobras (Médias) = 9 - 6 = 3 vagas.
    - Validação de que todas as 9 vagas são preenchidas respeitando as médias e repescagem.
    """
    params = ParametrosQeEntity(
        eleicao_id=1,
        vagas_vereador=9,
        perc_minimo_candidato_qp=10.0,
        perc_minimo_chapa_sobras=80.0,
        perc_minimo_candidato_sobras=20.0,
        permite_repescagem_sobras=True,
    )

    # 4 Chapas
    chapa_a = ChapaProporcionalEntity(id=1, eleicao_id=1, nome="Chapa A", tipo="PARTIDO", partidos=[
        ChapaProporcionalPartidoEntity(chapa_proporcional_id=1, partido_id=10, numero=10, sigla="PA")
    ])
    chapa_b = ChapaProporcionalEntity(id=2, eleicao_id=1, nome="Chapa B", tipo="PARTIDO", partidos=[
        ChapaProporcionalPartidoEntity(chapa_proporcional_id=2, partido_id=20, numero=20, sigla="PB")
    ])
    chapa_c = ChapaProporcionalEntity(id=3, eleicao_id=1, nome="Chapa C", tipo="PARTIDO", partidos=[
        ChapaProporcionalPartidoEntity(chapa_proporcional_id=3, partido_id=30, numero=30, sigla="PC")
    ])
    chapa_d = ChapaProporcionalEntity(id=4, eleicao_id=1, nome="Chapa D", tipo="PARTIDO", partidos=[
        ChapaProporcionalPartidoEntity(chapa_proporcional_id=4, partido_id=40, numero=40, sigla="PD")
    ])
    chapa_e = ChapaProporcionalEntity(id=5, eleicao_id=1, nome="Chapa E", tipo="PARTIDO", partidos=[
        ChapaProporcionalPartidoEntity(chapa_proporcional_id=5, partido_id=50, numero=50, sigla="PE")
    ])

    partidos_eleicao = [
        (PartidosEleicaoEntity(id_eleicao=1, partido_numero=10, votos_nominais=1160, votos_legenda=90, total_votos=1250), "PA", "Partido A"),
        (PartidosEleicaoEntity(id_eleicao=1, partido_numero=20, votos_nominais=800, votos_legenda=50, total_votos=850), "PB", "Partido B"),
        (PartidosEleicaoEntity(id_eleicao=1, partido_numero=30, votos_nominais=680, votos_legenda=20, total_votos=700), "PC", "Partido C"),
        (PartidosEleicaoEntity(id_eleicao=1, partido_numero=40, votos_nominais=480, votos_legenda=20, total_votos=500), "PD", "Partido D"),
        (PartidosEleicaoEntity(id_eleicao=1, partido_numero=50, votos_nominais=290, votos_legenda=10, total_votos=300), "PE", "Partido E"),
    ]

    candidatos_eleicao = [
        # Chapa A: tem direito a 3 QP (1250 // 400 = 3), mas apenas 2 candidatos têm >= 40 votos (600 e 500)
        (CandidatosEleicaoEntity(id=1, titulo_eleitor="T1", id_eleicao=1, partido_numero=10, cargo="Vereador", numero_urna=101, nome_urna="A1", votos=600, situacao="ELEITO"), "Nome A1", "PA"),
        (CandidatosEleicaoEntity(id=2, titulo_eleitor="T2", id_eleicao=1, partido_numero=10, cargo="Vereador", numero_urna=102, nome_urna="A2", votos=500, situacao="ELEITO"), "Nome A2", "PA"),
        (CandidatosEleicaoEntity(id=3, titulo_eleitor="T3", id_eleicao=1, partido_numero=10, cargo="Vereador", numero_urna=103, nome_urna="A3", votos=35, situacao="SUPLENTE"), "Nome A3", "PA"),
        (CandidatosEleicaoEntity(id=4, titulo_eleitor="T4", id_eleicao=1, partido_numero=10, cargo="Vereador", numero_urna=104, nome_urna="A4", votos=25, situacao="SUPLENTE"), "Nome A4", "PA"),

        # Chapa B: 850 votos -> 2 QP.
        (CandidatosEleicaoEntity(id=5, titulo_eleitor="T5", id_eleicao=1, partido_numero=20, cargo="Vereador", numero_urna=201, nome_urna="B1", votos=400, situacao="ELEITO"), "Nome B1", "PB"),
        (CandidatosEleicaoEntity(id=6, titulo_eleitor="T6", id_eleicao=1, partido_numero=20, cargo="Vereador", numero_urna=202, nome_urna="B2", votos=300, situacao="ELEITO"), "Nome B2", "PB"),
        (CandidatosEleicaoEntity(id=7, titulo_eleitor="T7", id_eleicao=1, partido_numero=20, cargo="Vereador", numero_urna=203, nome_urna="B3", votos=100, situacao="SUPLENTE"), "Nome B3", "PB"),

        # Chapa C: 700 votos -> 1 QP.
        (CandidatosEleicaoEntity(id=8, titulo_eleitor="T8", id_eleicao=1, partido_numero=30, cargo="Vereador", numero_urna=301, nome_urna="C1", votos=350, situacao="ELEITO"), "Nome C1", "PC"),
        (CandidatosEleicaoEntity(id=9, titulo_eleitor="T9", id_eleicao=1, partido_numero=30, cargo="Vereador", numero_urna=302, nome_urna="C2", votos=250, situacao="SUPLENTE"), "Nome C2", "PC"),
        (CandidatosEleicaoEntity(id=10, titulo_eleitor="T10", id_eleicao=1, partido_numero=30, cargo="Vereador", numero_urna=303, nome_urna="C3", votos=80, situacao="SUPLENTE"), "Nome C3", "PC"),

        # Chapa D: 500 votos -> 1 QP.
        (CandidatosEleicaoEntity(id=11, titulo_eleitor="T11", id_eleicao=1, partido_numero=40, cargo="Vereador", numero_urna=401, nome_urna="D1", votos=280, situacao="ELEITO"), "Nome D1", "PD"),
        (CandidatosEleicaoEntity(id=12, titulo_eleitor="T12", id_eleicao=1, partido_numero=40, cargo="Vereador", numero_urna=402, nome_urna="D2", votos=200, situacao="SUPLENTE"), "Nome D2", "PD"),

        # Chapa E: 300 votos -> 0 QP (< 320 do corte 80% do QE)
        (CandidatosEleicaoEntity(id=13, titulo_eleitor="T13", id_eleicao=1, partido_numero=50, cargo="Vereador", numero_urna=501, nome_urna="E1", votos=290, situacao="SUPLENTE"), "Nome E1", "PE"),
    ]

    mock_q_repo = MockQuocienteRepo(
        params=params,
        chapas=[chapa_a, chapa_b, chapa_c, chapa_d, chapa_e],
        partidos_eleicao=partidos_eleicao,
        candidatos_eleicao=candidatos_eleicao,
    )
    mock_el_repo = MockEleicaoRepo()

    use_case = CalcularQuocienteEleitoralUseCase(mock_q_repo, mock_el_repo)
    resultado = use_case.execute(eleicao_id=1)

    assert resultado.vagas_vereador == 9
    assert resultado.total_votos_validos == 3600
    assert resultado.qe_arredondado == 400
    assert resultado.corte_10_qp == 40.0
    assert resultado.corte_80_chapa == 320.0
    assert resultado.corte_20_sobras == 80.0

    # Vagas diretas por QP:
    # Chapa A: direito a 3 QP, mas só 2 candidatos atingiram 40 votos -> elege 2 por QP
    # Chapa B: 2 QP
    # Chapa C: 1 QP
    # Chapa D: 1 QP
    assert resultado.total_vagas_qp_distribuidas == 6
    assert resultado.total_vagas_media_distribuidas == 3
    assert len(resultado.memoria_sobras) == 3

    # Total geral de eleitos deve ser exatamente 9!
    total_eleitos_todas = sum(ch.total_eleitos for ch in resultado.chapas)
    assert total_eleitos_todas == 9

    # Memória de cálculo das 3 rodadas de sobra
    r1 = resultado.memoria_sobras[0]
    r2 = resultado.memoria_sobras[1]
    r3 = resultado.memoria_sobras[2]
    assert r1.rodada == 1
    assert r2.rodada == 2
    assert r3.rodada == 3


def test_endpoints_api_quociente_eleitoral():
    """
    Testa todas as rotas FastAPI do módulo de Quociente Eleitoral:
    - GET e PUT de parâmetros
    - CRUD de Chapas Proporcionais
    - Validação de unicidade de partido por eleição (rejeita duplicata com 400)
    - Geração rápida de chapas isoladas
    - Execução do cálculo do QE
    """
    # 1. Obter parâmetros default da eleição 1 (2024 cadastrada no banco)
    resp_get_param = client.get("/api/eleicoes/1/parametros-qe")
    assert resp_get_param.status_code == 200
    data_param = resp_get_param.json()
    assert data_param["vagas_vereador"] == 9
    assert data_param["perc_minimo_candidato_qp"] == 10.0

    # 2. Atualizar parâmetros
    resp_put_param = client.put("/api/eleicoes/1/parametros-qe", json={
        "vagas_vereador": 9,
        "perc_minimo_candidato_qp": 10.0,
        "perc_minimo_chapa_sobras": 80.0,
        "perc_minimo_candidato_sobras": 20.0,
        "permite_repescagem_sobras": True,
    })
    assert resp_put_param.status_code == 200
    assert resp_put_param.json()["vagas_vereador"] == 9

    # 3. Gerar chapas isoladas automaticamente para a eleição 1
    resp_gerar = client.post("/api/eleicoes/1/chapas-proporcionais/gerar-isoladas")
    assert resp_gerar.status_code == 200
    chapas = resp_gerar.json()
    assert len(chapas) > 0

    # 4. Listar chapas proporcionais
    resp_list = client.get("/api/eleicoes/1/chapas-proporcionais")
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == len(chapas)

    # 5. Tentar criar chapa com partido já vinculado em outra chapa da mesma eleição (deve dar erro 400)
    partido_num = chapas[0]["partidos"][0]["partido_id"]
    resp_conflict = client.post("/api/eleicoes/1/chapas-proporcionais", json={
        "nome": "Chapa Conflitante",
        "tipo": "COLIGACAO",
        "partido_ids": [partido_num],
    })
    assert resp_conflict.status_code == 400
    assert "já está vinculado a outra chapa" in resp_conflict.json()["detail"]

    # 6. Atualizar uma chapa
    primeira_chapa_id = chapas[0]["id"]
    resp_put_chapa = client.put(f"/api/chapas-proporcionais/{primeira_chapa_id}", json={
        "nome": "Nome Atualizado da Chapa",
    })
    assert resp_put_chapa.status_code == 200
    assert resp_put_chapa.json()["nome"] == "Nome Atualizado da Chapa"

    # 7. Executar cálculo do QE
    resp_calc = client.get("/api/eleicoes/1/calculo-qe")
    assert resp_calc.status_code == 200
    calc_data = resp_calc.json()
    assert calc_data["vagas_vereador"] == 9
    assert calc_data["total_votos_validos"] > 0
    assert calc_data["qe_arredondado"] > 0
    assert len(calc_data["chapas"]) > 0

    # Total de cadeiras distribuídas deve ser 9 para a eleição 2024 de Braúnas/MG
    tot_eleitos = sum(ch["total_eleitos"] for ch in calc_data["chapas"])
    assert tot_eleitos == 9
