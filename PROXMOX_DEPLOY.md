# 🖥️ Deploy MusicAI Editor su Proxmox

Guida completa per installare e configurare MusicAI Editor su Proxmox VE con supporto GPU.

## 📋 Prerequisiti Proxmox

### Hardware Minimo
- **CPU**: 8 core (16 thread raccomandati)
- **RAM**: 32GB (16GB per VM + 16GB per Proxmox)
- **Storage**: 500GB SSD per prestazioni ottimali
- **GPU**: NVIDIA GTX 1060 / RTX 2060 o superiore (opzionale ma raccomandato)
- **Network**: Connessione Gigabit

### Software
- **Proxmox VE**: 7.4 o superiore
- **IOMMU**: Abilitato nel BIOS/UEFI
- **VT-d/AMD-Vi**: Supporto virtualizzazione hardware

## 🚀 Setup Iniziale Proxmox

### 1. Configurazione IOMMU

Modifica GRUB per abilitare IOMMU:

```bash
# Accedi a Proxmox via SSH
ssh root@PROXMOX_IP

# Modifica GRUB
nano /etc/default/grub

# Aggiungi alla linea GRUB_CMDLINE_LINUX_DEFAULT:
# Intel: intel_iommu=on iommu=pt
# AMD: amd_iommu=on iommu=pt
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"

# Aggiorna GRUB
update-grub

# Riavvia
reboot
```

### 2. Configurazione Moduli Kernel

```bash
# Aggiungi moduli VFIO
echo 'vfio' >> /etc/modules
echo 'vfio_iommu_type1' >> /etc/modules
echo 'vfio_pci' >> /etc/modules
echo 'vfio_virqfd' >> /etc/modules

# Aggiorna initramfs
update-initramfs -u -k all

# Riavvia
reboot
```

### 3. Verifica IOMMU Groups

```bash
# Verifica gruppi IOMMU
find /sys/kernel/iommu_groups/ -type l | sort -V

# Identifica GPU
lspci | grep -i nvidia
# Output esempio: 01:00.0 VGA compatible controller: NVIDIA Corporation ...
```

## 🖥️ Creazione VM Ubuntu

### 1. Download ISO Ubuntu Server

```bash
# Scarica Ubuntu Server 22.04 LTS
cd /var/lib/vz/template/iso
wget https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso
```

### 2. Creazione VM via Web UI

1. **General**:
   - VM ID: 100
   - Name: musicai-editor
   - Resource Pool: (opzionale)

2. **OS**:
   - ISO: ubuntu-22.04.3-live-server-amd64.iso
   - Type: Linux
   - Version: 6.x - 2.6 Kernel

3. **System**:
   - Machine: q35
   - BIOS: OVMF (UEFI)
   - Add EFI Disk: ✓
   - SCSI Controller: VirtIO SCSI single
   - Qemu Agent: ✓

4. **Hard Disk**:
   - Bus/Device: VirtIO Block
   - Storage: local-lvm
   - Size: 200GB
   - Cache: Write back
   - Discard: ✓

5. **CPU**:
   - Sockets: 1
   - Cores: 8
   - Type: host
   - Enable NUMA: ✓

6. **Memory**:
   - Memory: 16384 MB (16GB)
   - Ballooning Device: ✓

7. **Network**:
   - Bridge: vmbr0
   - Model: VirtIO (paravirtualized)
   - Firewall: ✓

### 3. Configurazione GPU Passthrough (Opzionale)

```bash
# Identifica GPU PCI ID
lspci -n | grep -i nvidia
# Output: 01:00.0 0300: 10de:2484 (rev a1)
# 10de:2484 è il PCI ID

# Blacklist driver nvidia su host
echo "blacklist nvidia" >> /etc/modprobe.d/blacklist.conf
echo "blacklist nouveau" >> /etc/modprobe.d/blacklist.conf

# Bind GPU a VFIO
echo "options vfio-pci ids=10de:2484" > /etc/modprobe.d/vfio.conf

# Aggiorna initramfs
update-initramfs -u

# Riavvia
reboot
```

Aggiungi GPU alla VM:

```bash
# Via CLI
qm set 100 -hostpci0 01:00,pcie=1,x-vga=1

# O via Web UI: Hardware > Add > PCI Device
# Device: 01:00 (GPU)
# All Functions: ✓
# Primary GPU: ✓ (se unica GPU)
```

## 🐧 Installazione Ubuntu nella VM

### 1. Avvio e Installazione

1. Avvia la VM e connettiti via console
2. Segui l'installazione Ubuntu standard:
   - Language: English
   - Keyboard: Italian (o preferito)
   - Network: DHCP (o configurazione statica)
   - Storage: Use entire disk
   - Profile: 
     - Name: musicai
     - Server: musicai-editor
     - Username: musicai
     - Password: (sicura)
   - SSH: Install OpenSSH server ✓
   - Snaps: Docker ✓

### 2. Configurazione Post-Installazione

```bash
# Accedi alla VM
ssh musicai@VM_IP

# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa pacchetti essenziali
sudo apt install -y curl wget git htop nano ufw fail2ban

# Configura firewall
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend
sudo ufw allow 3001/tcp  # Grafana (opzionale)
sudo ufw --force enable
```

### 3. Installazione Driver NVIDIA (se GPU passthrough)

```bash
# Aggiungi repository NVIDIA
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt update

# Installa driver e CUDA
sudo apt install -y nvidia-driver-535 cuda-toolkit-12-0

# Riavvia
sudo reboot

# Verifica installazione
nvidia-smi
```

## 🐳 Installazione Docker

### 1. Installazione Docker Engine

```bash
# Rimuovi versioni precedenti
sudo apt remove docker docker-engine docker.io containerd runc

# Aggiungi repository Docker
sudo apt update
sudo apt install ca-certificates curl gnupg lsb-release
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installa Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Aggiungi utente al gruppo docker
sudo usermod -aG docker $USER
newgrp docker

# Verifica installazione
docker --version
docker compose version
```

### 2. Installazione NVIDIA Container Toolkit (se GPU)

```bash
# Aggiungi repository NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
      && curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
      && curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
            sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
            sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Installa toolkit
sudo apt update
sudo apt install -y nvidia-container-toolkit

# Configura Docker
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Verifica
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
```

## 🎵 Deploy MusicAI Editor

### 1. Clone Repository

```bash
# Clone progetto
cd /home/musicai
git clone https://github.com/musicai-editor/musicai-editor.git
cd musicai-editor

# Crea directory necessarie
sudo mkdir -p /opt/musicai/{temp_files,models,logs}
sudo chown -R musicai:musicai /opt/musicai
```

### 2. Configurazione Ambiente

```bash
# Crea file .env
cat > .env << EOF
# Backend Configuration
REDIS_URL=redis://redis:6379
TEMP_DIR=/opt/musicai/temp_files
MODEL_CACHE_DIR=/opt/musicai/models
CUDA_VISIBLE_DEVICES=0
MAX_FILE_SIZE=104857600
SESSION_TIMEOUT=86400
LOG_LEVEL=info

# Frontend Configuration
REACT_APP_API_URL=http://VM_IP:8000
REACT_APP_WS_URL=ws://VM_IP:8000
REACT_APP_MAX_FILE_SIZE=104857600

# Database (opzionale)
POSTGRES_DB=musicai
POSTGRES_USER=musicai
POSTGRES_PASSWORD=secure_password_here

# Monitoring
GRAFANA_ADMIN_PASSWORD=admin_password_here
EOF

# Sostituisci VM_IP con l'IP effettivo
sed -i 's/VM_IP/192.168.1.100/g' .env  # Cambia con IP reale
```

### 3. Configurazione Docker Compose per Proxmox

```bash
# Crea docker-compose.proxmox.yml
cat > docker-compose.proxmox.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=${REACT_APP_API_URL}
      - REACT_APP_WS_URL=${REACT_APP_WS_URL}
      - REACT_APP_MAX_FILE_SIZE=${REACT_APP_MAX_FILE_SIZE}
    networks:
      - musicai
    depends_on:
      - backend
    restart: unless-stopped
    mem_limit: 1g
    cpus: 2

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - /opt/musicai/temp_files:/app/temp_files
      - /opt/musicai/models:/app/models
      - /opt/musicai/logs:/app/logs
    environment:
      - REDIS_URL=${REDIS_URL}
      - TEMP_DIR=${TEMP_DIR}
      - MODEL_CACHE_DIR=${MODEL_CACHE_DIR}
      - CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES}
      - MAX_FILE_SIZE=${MAX_FILE_SIZE}
      - SESSION_TIMEOUT=${SESSION_TIMEOUT}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - musicai
    depends_on:
      - redis
    restart: unless-stopped
    mem_limit: 8g
    cpus: 4
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    volumes:
      - /opt/musicai/temp_files:/app/temp_files
      - /opt/musicai/models:/app/models
      - /opt/musicai/logs:/app/logs
    environment:
      - REDIS_URL=${REDIS_URL}
      - TEMP_DIR=${TEMP_DIR}
      - MODEL_CACHE_DIR=${MODEL_CACHE_DIR}
      - CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - musicai
    depends_on:
      - redis
    restart: unless-stopped
    mem_limit: 12g
    cpus: 6
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - musicai
    restart: unless-stopped
    mem_limit: 512m
    cpus: 1
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    networks:
      - musicai
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    mem_limit: 256m
    cpus: 1

volumes:
  redis_data:

networks:
  musicai:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
EOF
```

### 4. Avvio Applicazione

```bash
# Build e avvio
docker compose -f docker-compose.proxmox.yml up -d --build

# Verifica stato
docker compose -f docker-compose.proxmox.yml ps

# Visualizza log
docker compose -f docker-compose.proxmox.yml logs -f

# Verifica GPU (se disponibile)
docker compose -f docker-compose.proxmox.yml exec backend nvidia-smi
```

## 🔧 Ottimizzazioni Proxmox

### 1. Configurazione CPU

```bash
# Via Proxmox CLI
qm set 100 -cpu host,flags=+aes
qm set 100 -numa 1

# Affinity CPU (opzionale)
qm set 100 -cpulimit 8
qm set 100 -cpuunits 2048
```

### 2. Ottimizzazione Storage

```bash
# Abilita discard per SSD
qm set 100 -scsi0 local-lvm:vm-100-disk-0,discard=on,ssd=1

# Cache write-back per performance
qm set 100 -scsi0 local-lvm:vm-100-disk-0,cache=writeback
```

### 3. Configurazione Network

```bash
# Abilita multiqueue per performance
qm set 100 -net0 virtio,bridge=vmbr0,queues=4

# Jumbo frames (se supportato dalla rete)
qm set 100 -net0 virtio,bridge=vmbr0,mtu=9000
```

### 4. Hugepages (Opzionale)

```bash
# Su host Proxmox
echo 'vm.nr_hugepages=4096' >> /etc/sysctl.conf
sysctl -p

# Configura VM per hugepages
qm set 100 -hugepages 1048576
```

## 📊 Monitoraggio

### 1. Monitoraggio Proxmox

```bash
# Installa pve-monitor
apt install pve-monitor

# Configura alerting
nano /etc/pve/notifications.cfg
```

### 2. Monitoraggio Applicazione

```bash
# Avvia con monitoraggio
docker compose -f docker-compose.proxmox.yml --profile monitoring up -d

# Accedi a Grafana
# http://VM_IP:3001
# Username: admin
# Password: (da .env)
```

### 3. Script di Monitoraggio

```bash
# Crea script di health check
cat > /home/musicai/health_check.sh << 'EOF'
#!/bin/bash

# Health check MusicAI Editor
echo "=== MusicAI Editor Health Check ==="
echo "Date: $(date)"
echo

# Check containers
echo "Container Status:"
docker compose -f /home/musicai/musicai-editor/docker-compose.proxmox.yml ps
echo

# Check GPU
if command -v nvidia-smi &> /dev/null; then
    echo "GPU Status:"
    nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
    echo
fi

# Check disk space
echo "Disk Usage:"
df -h /opt/musicai
echo

# Check memory
echo "Memory Usage:"
free -h
echo

# Check API health
echo "API Health:"
curl -s http://localhost:8000/health || echo "API not responding"
echo
EOF

chmod +x /home/musicai/health_check.sh

# Aggiungi a crontab per check ogni 5 minuti
echo "*/5 * * * * /home/musicai/health_check.sh >> /var/log/musicai_health.log 2>&1" | crontab -
```

## 🔒 Sicurezza

### 1. Firewall VM

```bash
# Configura UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend API
sudo ufw allow from 192.168.1.0/24 to any port 3001  # Grafana (solo rete locale)
sudo ufw --force enable
```

### 2. Fail2Ban

```bash
# Configura fail2ban
sudo nano /etc/fail2ban/jail.local

# Aggiungi:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

sudo systemctl restart fail2ban
```

### 3. SSL/TLS (Opzionale)

```bash
# Genera certificati self-signed
sudo mkdir -p /opt/musicai/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/musicai/ssl/musicai.key \
    -out /opt/musicai/ssl/musicai.crt

# Configura Nginx per HTTPS
# (Modifica nginx.conf per includere SSL)
```

## 🚀 Accesso all'Applicazione

Dopo il deploy completo:

- **Frontend**: http://VM_IP:3000
- **API Docs**: http://VM_IP:8000/docs
- **Grafana**: http://VM_IP:3001 (se abilitato)
- **Health Check**: http://VM_IP:8000/health

## 🔧 Troubleshooting

### Problemi Comuni

1. **GPU non rilevata**:
   ```bash
   # Verifica passthrough
   lspci | grep -i nvidia
   nvidia-smi
   ```

2. **Container non si avviano**:
   ```bash
   # Check logs
   docker compose logs backend
   # Check risorse
   docker stats
   ```

3. **Performance scarse**:
   ```bash
   # Verifica CPU pinning
   cat /proc/cpuinfo | grep processor
   # Verifica hugepages
   cat /proc/meminfo | grep Huge
   ```

4. **Rete non raggiungibile**:
   ```bash
   # Verifica bridge
   ip addr show vmbr0
   # Verifica firewall Proxmox
   iptables -L
   ```

### Log Utili

```bash
# Log Proxmox
tail -f /var/log/pve/tasks/active

# Log VM
journalctl -u qemu-server@100 -f

# Log applicazione
docker compose logs -f

# Log sistema VM
sudo journalctl -f
```

---

**MusicAI Editor è ora pronto su Proxmox! 🎵**

Per supporto aggiuntivo, consulta la documentazione completa o apri una issue su GitHub.