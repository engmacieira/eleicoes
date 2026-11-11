# Backend FastAPI - Eleições Braúnas/MG (Google Cloud SQL)

API RESTful construída em Python (FastAPI + SQLAlchemy) conectada diretamente ao banco de dados relacional **PostgreSQL 15** hospedado no **Google Cloud SQL**.

## 1. Pré-requisitos
- Python 3.10+
- Acesso à internet para alcançar o IP público da instância Cloud SQL (`34.95.135.110`)

## 2. Instalação e Execução Local

```bash
# 1. Navegue até a pasta do backend
cd backend

# 2. Crie e ative o ambiente virtual
python -m venv .venv
source .venv/bin/activate  # No Linux/macOS
# ou: .venv\Scripts\activate  # No Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env e insira a senha do usuário postgres:
# DB_PASS="sua_senha_do_cloud_sql"

# 5. Inicie o servidor FastAPI com live reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 3. Endpoints Disponíveis
A documentação interativa Swagger UI estará disponível em: `http://localhost:8000/docs`

- **GET `/api/health`**: Verifica status da conexão com a instância Cloud SQL.
- **GET `/api/eleicoes`**: Retorna anos disponíveis (2000 a 2024) e estatísticas de comparecimento/abstenção.
- **GET `/api/resultados?ano=2024&cargo=Vereador`**: Ranking oficial de apuração com situação e votos.
- **GET `/api/candidatos/{titulo_eleitor}/historico`**: Trajetória completa de vida política do candidato de 2000 a 2024.
- **GET `/api/partidos/{ano}`**: Desempenho das legendas para vereador (votos nominais vs. votos de legenda).
