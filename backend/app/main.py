"""
FastAPI application entry point.
Configures CORS, includes routes, and loads persisted data on startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router, init_trie


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load dictionary data from JSON into the Radix Trie on startup."""
    init_trie()
    yield


app = FastAPI(
    title="Radix-Trie English Dictionary API",
    description="An English dictionary backed by a Radix Trie data structure.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow the Next.js dev server (and any origin)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────
app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "Radix-Trie English Dictionary API",
        "version": "1.0.0",
        "docs": "/docs",
    }
