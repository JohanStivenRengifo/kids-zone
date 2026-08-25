# Arquitectura del Sistema - Zona Kids Blockchain

## Versión

0.1

## Descripción

Zona Kids Blockchain es una plataforma para gestionar matrículas, pagos y certificados de un centro infantil utilizando tecnología blockchain para garantizar integridad, autenticidad y trazabilidad de la información.

---

# Arquitectura General

```
                 Usuario
                    │
                    ▼
          ┌──────────────────┐
          │ Frontend         │
          └────────┬─────────┘
                   │ HTTPS
                   ▼
        ┌────────────────────────┐
        │ Backend (Node + Express)│
        └──────┬─────────┬────────┘
               │         │
               │         │
               ▼         ▼
        PostgreSQL     IPFS
               │
               │ Hash + CID
               ▼
        Smart Contract
               │
               ▼
      Ethereum Sepolia
```

---

# Comunicación entre Componentes


| Origen   | Destino    | Protocolo |
| -------- | ---------- | --------- |
| Frontend | Backend    | HTTPS     |
| Backend  | PostgreSQL | TCP       |
| Backend  | Ethereum   | JSON-RPC  |
| Backend  | IPFS       | HTTP      |
| Usuario  | MetaMask   | Wallet    |


---

# Seguridad

### 1. No almacenar datos personales en blockchain

Se almacenan únicamente hashes.

### 2. Integridad

Todos los documentos generan un SHA-256.

```
SHA256(block)
```

Cualquier modificación produce un hash diferente.

### 3. Firmas Digitales

Cada transacción queda firmada por la wallet del administrador.

Esto permite saber quién realizó cada operación.

### 4. Trazabilidad

Toda operación conserva:

- timestamp
- wallet
- transaction hash
