"""
Ponto de entrada do backend VigiMinas.
Importa a aplicação FastAPI modularizada e construída segundo Domain-Driven Design (DDD).
"""
import sys
import os

# Adiciona o diretório backend ao sys.path para importações locais
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
