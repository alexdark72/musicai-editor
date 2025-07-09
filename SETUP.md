# 🚀 Guida di Setup - MusicAI Editor

Questa guida ti aiuterà a configurare e avviare MusicAI Editor sul tuo sistema.

## 📋 Prerequisiti

### 1. Docker Desktop

**Windows:**
1. Scarica Docker Desktop da: https://www.docker.com/products/docker-desktop/
2. Installa Docker Desktop seguendo le istruzioni
3. Riavvia il computer se richiesto
4. Avvia Docker Desktop e attendi che sia completamente avviato

**Verifica installazione:**
```bash
docker --version
docker compose version
```

### 2. Git (Opzionale)

Se non hai ancora clonato il repository:
```bash
git clone https://github.com/musicai-editor/musicai-editor.git
cd musicai-editor
```

### 3. GPU NVIDIA (Opzionale ma Raccomandato)

Per prestazioni ottimali con l'AI:
1. Installa i driver NVIDIA più recenti
2. Installa NVIDIA Container Toolkit:
   - Segui le istruzioni su: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

## 🏃‍♂️ Avvio Rapido

### Opzione 1: Avvio Completo (Raccomandato)

```bash
# Naviga nella directory del progetto
cd musicai-editor

# Avvia tutti i servizi
docker compose up -d

# Verifica che i servizi siano avviati
docker compose ps

# Visualizza i log in tempo reale
docker compose logs -f
```

### Opzione 2: Avvio per Sviluppo

```bash
# Avvia in modalità sviluppo con hot reload
docker compose -f docker-compose.dev.yml up -d

# Visualizza i log
docker compose -f docker-compose.dev.yml logs -f
```

### Opzione 3: Avvio con Monitoraggio

```bash
# Avvia con Prometheus e Grafana
docker compose --profile monitoring up -d

# Accedi a Grafana: http://localhost:3001
# Username: admin, Password: admin
```

## 🌐 Accesso all'Applicazione

Dopo l'avvio, i servizi saranno disponibili su:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana (se abilitato)**: http://localhost:3001
- **Prometheus (se abilitato)**: http://localhost:9090

## 🔧 Configurazione

### Variabili d'Ambiente

Crea un file `.env` nella root del progetto per personalizzare la configurazione:

```env
# Backend
REDIS_URL=redis://redis:6379
TEMP_DIR=./temp_files
MODEL_CACHE_DIR=./models
CUDA_VISIBLE_DEVICES=0
MAX_FILE_SIZE=104857600
SESSION_TIMEOUT=86400

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_MAX_FILE_SIZE=104857600

# Database (se utilizzato)
POSTGRES_DB=musicai
POSTGRES_USER=musicai
POSTGRES_PASSWORD=secure_password

# Monitoring
GRAFANA_ADMIN_PASSWORD=admin
```

### Ottimizzazione GPU

Se hai una GPU NVIDIA, assicurati che sia configurata correttamente:

```bash
# Verifica che Docker possa accedere alla GPU
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
```

## 📊 Monitoraggio

### Verifica Stato Servizi

```bash
# Stato di tutti i container
docker compose ps

# Log di un servizio specifico
docker compose logs backend

# Log in tempo reale
docker compose logs -f frontend

# Statistiche risorse
docker stats
```

### Health Check

```bash
# Verifica salute backend
curl http://localhost:8000/health

# Verifica frontend
curl http://localhost:3000

# Verifica Redis
docker compose exec redis redis-cli ping
```

## 🛠️ Sviluppo

### Setup Ambiente di Sviluppo

```bash
# Clona il repository
git clone https://github.com/musicai-editor/musicai-editor.git
cd musicai-editor

# Avvia in modalità sviluppo
docker compose -f docker-compose.dev.yml up -d

# Oppure sviluppo locale:

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (nuovo terminale)
cd frontend
npm install
npm start
```

### Test

```bash
# Test backend
cd backend
pytest

# Test frontend
cd frontend
npm test

# Test end-to-end
npm run test:e2e
```

## 🐛 Risoluzione Problemi

### Problemi Comuni

#### 1. Docker non avviato
```bash
# Errore: Cannot connect to the Docker daemon
# Soluzione: Avvia Docker Desktop
```

#### 2. Porta già in uso
```bash
# Errore: Port 3000 is already in use
# Soluzione: Cambia porta nel docker-compose.yml o ferma il servizio che usa la porta
netstat -ano | findstr :3000
```

#### 3. Memoria insufficiente
```bash
# Errore: Out of memory
# Soluzione: Aumenta memoria Docker Desktop (Settings > Resources > Memory)
```

#### 4. GPU non rilevata
```bash
# Verifica driver NVIDIA
nvidia-smi

# Verifica Docker GPU support
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
```

#### 5. Modelli AI non scaricati
```bash
# I modelli vengono scaricati automaticamente al primo avvio
# Verifica log del backend:
docker compose logs backend
```

### Log Debugging

```bash
# Log dettagliati di tutti i servizi
docker compose logs --tail=100 -f

# Log di un servizio specifico
docker compose logs backend --tail=50

# Accesso shell container
docker compose exec backend bash
docker compose exec frontend sh
```

### Reset Completo

```bash
# Ferma tutti i servizi
docker compose down

# Rimuovi volumi (ATTENZIONE: cancella tutti i dati)
docker compose down -v

# Rimuovi immagini
docker compose down --rmi all

# Rebuild completo
docker compose build --no-cache
docker compose up -d
```

## 📈 Performance

### Ottimizzazioni

1. **GPU**: Usa GPU NVIDIA per elaborazione AI più veloce
2. **RAM**: Almeno 16GB raccomandati per file audio grandi
3. **Storage**: SSD per accesso più veloce ai file temporanei
4. **Network**: Connessione stabile per download modelli AI

### Metriche

- **Tempo elaborazione**: ~30-60 secondi per brano 3-4 minuti (con GPU)
- **Memoria**: ~2-4GB per job di separazione
- **Storage**: ~500MB-2GB per modelli AI

## 🔒 Sicurezza

### Produzione

1. Cambia password predefinite
2. Usa HTTPS con certificati SSL
3. Configura firewall appropriato
4. Abilita autenticazione se necessario
5. Monitora log per attività sospette

### Backup

```bash
# Backup configurazione
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup

# Backup volumi (se necessario)
docker run --rm -v musicai_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz /data
```

## 📞 Supporto

Se incontri problemi:

1. Controlla questa guida per soluzioni comuni
2. Verifica i log con `docker compose logs`
3. Cerca nelle [GitHub Issues](https://github.com/musicai-editor/issues)
4. Crea una nuova issue con:
   - Descrizione del problema
   - Log di errore
   - Informazioni sistema (OS, Docker version, etc.)
   - Passi per riprodurre

---

**Buon editing musicale! 🎵**