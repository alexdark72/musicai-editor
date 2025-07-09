# 🤝 Guida per Contribuire a MusicAI Editor

Grazie per il tuo interesse nel contribuire a MusicAI Editor! Questa guida ti aiuterà a iniziare.

## 📋 Indice

- [Codice di Condotta](#codice-di-condotta)
- [Come Contribuire](#come-contribuire)
- [Setup Ambiente di Sviluppo](#setup-ambiente-di-sviluppo)
- [Processo di Sviluppo](#processo-di-sviluppo)
- [Linee Guida per il Codice](#linee-guida-per-il-codice)
- [Testing](#testing)
- [Documentazione](#documentazione)
- [Segnalazione Bug](#segnalazione-bug)
- [Richiesta Feature](#richiesta-feature)

## 📜 Codice di Condotta

Questo progetto aderisce al [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Partecipando, ti impegni a rispettare questo codice.

## 🚀 Come Contribuire

Ci sono molti modi per contribuire a MusicAI Editor:

### 🐛 Segnalazione Bug
- Cerca prima nelle [issues esistenti](https://github.com/musicai-editor/issues)
- Usa il template per bug report
- Includi informazioni dettagliate per riprodurre il problema

### ✨ Nuove Feature
- Discuti prima la feature nelle [discussions](https://github.com/musicai-editor/discussions)
- Crea una issue con il template feature request
- Attendi feedback prima di iniziare l'implementazione

### 📚 Documentazione
- Migliora la documentazione esistente
- Aggiungi esempi e tutorial
- Traduci in altre lingue

### 🔧 Codice
- Correggi bug esistenti
- Implementa nuove feature approvate
- Migliora le performance
- Refactoring del codice

## 🛠️ Setup Ambiente di Sviluppo

### Prerequisiti

```bash
# Strumenti richiesti
- Git
- Docker & Docker Compose
- Node.js 18+ (per frontend)
- Python 3.9+ (per backend)
- NVIDIA GPU con CUDA (opzionale, per AI)
```

### Clone e Setup

```bash
# 1. Fork il repository su GitHub
# 2. Clona il tuo fork
git clone https://github.com/TUO-USERNAME/musicai-editor.git
cd musicai-editor

# 3. Aggiungi il repository originale come upstream
git remote add upstream https://github.com/musicai-editor/musicai-editor.git

# 4. Crea un branch per la tua feature
git checkout -b feature/nome-feature
```

### Ambiente di Sviluppo

#### Opzione 1: Docker (Raccomandato)

```bash
# Avvia tutti i servizi in modalità sviluppo
docker-compose -f docker-compose.dev.yml up -d

# Logs in tempo reale
docker-compose -f docker-compose.dev.yml logs -f
```

#### Opzione 2: Sviluppo Locale

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (nuovo terminale)
cd frontend
npm install
npm start

# Redis (nuovo terminale)
redis-server
```

### Verifica Setup

```bash
# Test backend
curl http://localhost:8000/health

# Test frontend
open http://localhost:3000
```

## 🔄 Processo di Sviluppo

### 1. Pianificazione

- Discuti la feature/fix nelle issues o discussions
- Assicurati che non ci siano duplicati
- Ottieni feedback dalla community

### 2. Sviluppo

```bash
# Mantieni il tuo fork aggiornato
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Crea un nuovo branch
git checkout -b feature/nome-feature

# Sviluppa la feature
# Commit frequenti con messaggi chiari
git add .
git commit -m "feat: aggiungi nuova funzionalità X"
```

### 3. Testing

```bash
# Backend tests
cd backend
pytest tests/ -v
pytest tests/ --cov=app

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests
npm run test:e2e
```

### 4. Pull Request

```bash
# Push del branch
git push origin feature/nome-feature

# Crea PR su GitHub
# Usa il template PR
# Collega alle issues correlate
```

## 📝 Linee Guida per il Codice

### Convenzioni Commit

Usiamo [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: aggiungi nuova funzionalità
fix: correggi bug
docs: aggiorna documentazione
style: formattazione codice
refactor: refactoring senza cambi funzionali
test: aggiungi o modifica test
chore: task di manutenzione
```

### Backend (Python)

```python
# Usa Black per formattazione
black .

# Usa isort per import
isort .

# Usa flake8 per linting
flake8 .

# Usa mypy per type checking
mypy .
```

#### Struttura Codice

```python
# Esempio di funzione ben documentata
from typing import List, Optional

def separate_audio(
    audio_path: str,
    model_name: str = "htdemucs",
    device: Optional[str] = None
) -> List[str]:
    """
    Separa un file audio in stems usando Demucs.
    
    Args:
        audio_path: Percorso al file audio
        model_name: Nome del modello Demucs da usare
        device: Device per elaborazione (cpu/cuda)
        
    Returns:
        Lista dei percorsi ai file stems generati
        
    Raises:
        FileNotFoundError: Se il file audio non esiste
        ValueError: Se il formato audio non è supportato
    """
    # Implementazione...
    pass
```

### Frontend (TypeScript/React)

```bash
# Usa Prettier per formattazione
npm run format

# Usa ESLint per linting
npm run lint

# Type checking
npm run type-check
```

#### Struttura Componenti

```typescript
// Esempio di componente React
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAppStore } from '../store/appStore';

interface AudioPlayerProps {
  /** URL del file audio */
  audioUrl: string;
  /** Callback quando la riproduzione inizia */
  onPlay?: () => void;
  /** Callback quando la riproduzione si ferma */
  onStop?: () => void;
}

/**
 * Componente per la riproduzione audio con controlli.
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onPlay,
  onStop
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { volume } = useAppStore();

  // Implementazione...
  
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};
```

## 🧪 Testing

### Backend Testing

```python
# tests/test_audio_separation.py
import pytest
from app.services.audio_separation import separate_audio

class TestAudioSeparation:
    def test_separate_audio_success(self, sample_audio_file):
        """Test separazione audio con file valido."""
        result = separate_audio(sample_audio_file)
        assert len(result) == 4  # 4 stems
        assert all(path.endswith('.wav') for path in result)
    
    def test_separate_audio_invalid_file(self):
        """Test con file non esistente."""
        with pytest.raises(FileNotFoundError):
            separate_audio("non_esistente.wav")
```

### Frontend Testing

```typescript
// src/components/__tests__/AudioPlayer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from '../AudioPlayer';

describe('AudioPlayer', () => {
  it('renders play button when not playing', () => {
    render(<AudioPlayer audioUrl="test.mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    const onPlay = jest.fn();
    render(<AudioPlayer audioUrl="test.mp3" onPlay={onPlay} />);
    
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalled();
  });
});
```

## 📖 Documentazione

### Documentazione API

- Usa docstring per funzioni Python
- Documenta tutti gli endpoint FastAPI
- Includi esempi di request/response

### Documentazione Componenti

- Usa JSDoc per componenti React
- Documenta tutte le props
- Includi esempi di utilizzo

### README e Guide

- Mantieni README aggiornato
- Scrivi guide step-by-step
- Includi screenshot quando utili

## 🐛 Segnalazione Bug

### Template Bug Report

```markdown
**Descrizione Bug**
Descrizione chiara e concisa del bug.

**Passi per Riprodurre**
1. Vai a '...'
2. Clicca su '....'
3. Scorri fino a '....'
4. Vedi errore

**Comportamento Atteso**
Descrizione di cosa ti aspettavi che accadesse.

**Screenshot**
Se applicabile, aggiungi screenshot.

**Ambiente:**
 - OS: [e.g. Windows 10, macOS 12, Ubuntu 20.04]
 - Browser: [e.g. Chrome 96, Firefox 95]
 - Versione: [e.g. v1.0.0]

**Informazioni Aggiuntive**
Qualsiasi altra informazione sul problema.
```

## ✨ Richiesta Feature

### Template Feature Request

```markdown
**La tua richiesta è correlata a un problema?**
Descrizione chiara del problema. Es. Sono sempre frustrato quando [...]

**Descrivi la soluzione che vorresti**
Descrizione chiara di cosa vorresti che accadesse.

**Descrivi alternative considerate**
Descrizione di soluzioni alternative considerate.

**Informazioni Aggiuntive**
Qualsiasi altra informazione sulla feature request.
```

## 🏆 Riconoscimenti

Tutti i contributori saranno riconosciuti:

- Nel file [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Nella sezione "Contributors" del README
- Nei release notes per contributi significativi

## 📞 Supporto

Se hai domande:

- 💬 [GitHub Discussions](https://github.com/musicai-editor/discussions)
- 📧 [Email](mailto:contributors@musicai-editor.com)
- 💭 [Discord Community](https://discord.gg/musicai-editor)

---

**Grazie per contribuire a MusicAI Editor! 🎵**