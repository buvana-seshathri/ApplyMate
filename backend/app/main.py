from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import applications, discovery, matching, tailoring

app = FastAPI(title="ApplyMate", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(tailoring.router, prefix="/api/tailoring", tags=["tailoring"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["discovery"])
app.include_router(matching.router, prefix="/api/matching", tags=["matching"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
