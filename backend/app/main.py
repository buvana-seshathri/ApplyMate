from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import discovery, tailoring

app = FastAPI(title="Auto-Apply Job Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tailoring.router, prefix="/api/tailoring", tags=["tailoring"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["discovery"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
