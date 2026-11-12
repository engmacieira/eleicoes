import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...infrastructure.database import get_db

router = APIRouter(prefix="/api", tags=["Infraestrutura"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Verifica a conectividade ativa com a instância do Google Cloud SQL."""
    try:
        result = db.execute(text("SELECT version(), current_database(), inet_server_addr();")).fetchone()
        return {
            "status": "healthy",
            "database": result[1] if result else "eleicoes_db",
            "server_ip": str(result[2]) if result and result[2] else os.getenv("DB_HOST", "34.95.135.110"),
            "engine": "PostgreSQL 15 (Cloud SQL)",
            "cloud_project": "eleicoes-braunas",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "host": os.getenv("DB_HOST", "34.95.135.110"),
        }
