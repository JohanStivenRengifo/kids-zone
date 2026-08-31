# Arquitectura del Sistema - Zona Kids Blockchain

## Versión

0.2

## Descripción

Zona Kids Blockchain es una plataforma para gestionar inscripciones, matrículas, pagos y certificados de un centro infantil utilizando tecnología blockchain para garantizar integridad, autenticidad y trazabilidad de la información.

---

## Arquitectura General

```
                 Usuario
                    │
                    ▼
          ┌──────────────────┐
          │    Frontend      │
          └────────┬─────────┘
                   │ HTTPS
                   ▼
         ┌─────────────────────────┐
         │  Backend (Node + Express)│
         │  + Prisma ORM           │
         └──┬──────────┬────────┬──┘
            │          │        │
            ▼          ▼        ▼
       PostgreSQL    IPFS    Ethereum
       (off-chain)           (on-chain)
            │                    │
            │    SHA-256 hash    │
            └────────┬───────────┘
                     │
              Smart Contract
              DocumentNotary
                     │
                     ▼
              Ethereum Sepolia
```

---



## Patrón On-Chain / Off-Chain

La blockchain actúa como un **notario digital**: certifica que un documento existía en un momento determinado y que no ha sido alterado.

### PostgreSQL (off-chain) — Datos completos

Almacena toda la información sensible: nombres, documentos, teléfonos, fechas, montos, etc.


| Campo     | Ejemplo      |
| --------- | ------------ |
| id        | MAT-001      |
| Nombre    | Juan Pérez   |
| Documento | 123456789    |
| Padre     | María Gómez  |
| Curso     | Preescolar A |
| Fecha     | 2026-08-25   |




### Blockchain (on-chain) — Solo hashes

El backend genera un SHA-256 con los datos relevantes y lo envía al contrato inteligente.


| Campo     | Ejemplo           |
| --------- | ----------------- |
| moduleId  | matriculas        |
| recordId  | MAT-001           |
| hash      | 0x8f3c4e1a9b7d... |
| timestamp | 1756118400        |
| wallet    | 0xA1B2...         |


No hay nombres, documentos ni teléfonos en la cadena.

### Flujo de Creación

```
1. Admin envía datos al Backend
2. Backend guarda en PostgreSQL (off-chain)
3. Backend genera SHA-256 con los datos
4. Backend envía hash al Smart Contract (on-chain)
5. Smart Contract guarda: hash + timestamp + wallet
6. Backend actualiza PostgreSQL con txHash y walletAddress
```



### Flujo de Verificación

```
1. Se obtiene el registro de PostgreSQL
2. Se recalcula el SHA-256 con los datos actuales
3. Se consulta el hash almacenado en Ethereum
4. Se comparan ambos hashes
   - Iguales: registro íntegro
   - Diferentes: posible alteración
```



### Módulos


| Módulo        | PostgreSQL (off-chain)     | Blockchain (on-chain)      |
| ------------- | -------------------------- | -------------------------- |
| Inscripciones | Datos del niño y acudiente | Hash de la inscripción     |
| Matrículas    | Datos del niño y acudiente | Hash de la matrícula       |
| Pagos         | Valor, método, recibo      | Hash del comprobante       |
| Certificados  | PDF y datos del estudiante | Hash del PDF + CID de IPFS |


---



## Smart Contract: DocumentNotary

Contrato de notaría que almacena hashes de documentos con timestamp y wallet.

### Funciones


| Función                      | Descripción                          |
| ---------------------------- | ------------------------------------ |
| `notarize(module, id, hash)` | Registra un hash para un módulo e ID |
| `getRecord(module, id)`      | Retorna hash, timestamp y wallet     |
| `verify(module, id, hash)`   | Compara un hash con el almacenado    |




### Módulos soportados

- `inscripciones`
- `matriculas`
- `pagos`
- `certificados`

---



## Comunicación entre Componentes


| Origen   | Destino    | Protocolo            |
| -------- | ---------- | -------------------- |
| Frontend | Backend    | HTTPS                |
| Backend  | PostgreSQL | TCP (Prisma ORM)     |
| Backend  | Ethereum   | JSON-RPC (ethers.js) |
| Backend  | IPFS       | HTTP                 |
| Usuario  | MetaMask   | Wallet               |


---



## Seguridad



### Integridad

Todos los documentos generan un SHA-256. Cualquier modificación produce un hash diferente.

```
SHA256({ cedula, nombre, apellido, fechaNac })
```



### Firmas Digitales

Cada transacción queda firmada por la wallet del administrador. Esto permite saber quién realizó cada operación.

### Trazabilidad

Toda operación conserva:

- timestamp (del bloque de Ethereum)
- wallet (dirección del firmante)
- txHash (hash de la transacción)



### Verificación independiente

Cualquier tercero puede verificar la integridad de un registro sin acceso a la base de datos, solo con el hash y el contrato inteligente.

---



## Stack Tecnológico


| Componente           | Tecnología                 |
| -------------------- | -------------------------- |
| Backend              | Node.js + Express          |
| ORM                  | Prisma                     |
| Base de datos        | PostgreSQL 16              |
| Smart Contract       | Solidity 0.8.28            |
| Framework Blockchain | Hardhat 3.x                |
| Ethereum Client      | ethers.js 6.x              |
| Contratos Base       | OpenZeppelin 5.x           |
| Red                  | Ethereum Sepolia (testnet) |
| Almacenamiento       | IPFS                       |
| Wallet               | MetaMask                   |


