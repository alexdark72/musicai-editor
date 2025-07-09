# Multi-stage build per ottimizzare dimensioni
FROM nvidia/cuda:11.8-devel-ubuntu22.04 as base

# Evita prompt interattivi
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Installa dipendenze sistema
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    libsox-fmt-all \
    sox \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Crea symlink per python
RUN ln -s /usr/bin/python3.10 /usr/bin/python

# Aggiorna pip
RUN python -m pip install --upgrade pip setuptools wheel

# Stage di build per dipendenze pesanti
FROM base as builder

# Installa dipendenze Python in ambiente virtuale
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia requirements e installa dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download modelli Demucs
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

# Stage finale
FROM base as final

# Copia ambiente virtuale
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Crea utente non-root
RUN useradd --create-home --shell /bin/bash musicai
USER musicai
WORKDIR /app

# Copia codice applicazione
COPY --chown=musicai:musicai . .

# Crea directory necessarie
RUN mkdir -p /app/temp_files /app/models /app/logs

# Variabili ambiente
ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=0
ENV TORCH_HOME=/app/models
ENV HF_HOME=/app/models

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Esponi porta
EXPOSE 8000

# Comando di avvio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]