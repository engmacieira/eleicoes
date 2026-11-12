from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .presentation.routers.eleicoes_router import router as eleicoes_router
from .presentation.routers.resultados_router import router as resultados_router
from .presentation.routers.candidatos_router import router as candidatos_router
from .presentation.routers.partidos_router import router as partidos_router
from .presentation.routers.coligacoes_router import router as coligacoes_router
from .presentation.routers.infra_router import router as infra_router

app = FastAPI(
    title="VigiMinas - API Eleições Braúnas/MG (2000 a 2024)",
    description="Backend arquitetado em DDD (Domain, Application, Infrastructure, Presentation) com FastAPI e SQLAlchemy 2.0.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(infra_router)
app.include_router(eleicoes_router)
app.include_router(resultados_router)
app.include_router(candidatos_router)
app.include_router(partidos_router)
app.include_router(coligacoes_router)
