```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000/api`

---



## Instalación Blockchain



### 1. Instalar dependencias

```bash
cd blockchain
npm install
```



### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```
PRIVATE_KEY=tu_clave_privada_de_wallet
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_API_KEY
ETHERSCAN_API_KEY=tu_api_key_de_etherscan
```



### 3. Compilar contratos

```bash
npx hardhat compile
```



### 4. Desplegar (Sepolia)

```bash
npm run deploy:sepolia
```

Esto genera `backend/src/contract.json` con la dirección y ABI del contrato.

### 5. Verificar en Etherscan

```bash
npx hardhat verify --network sepolia DIRECCION_DEL_CONTRATO
```

---



## Base de Datos

### Comandos

```bash
# Abrir Prisma Studio (UI web)
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name descripcion

# Resetear base de datos
npx prisma migrate reset

# Regenerar Prisma Client
npx prisma generate
```

---



## CI/CD

El pipeline de GitHub Actions ejecuta:

1. **Job blockchain:** Instala dependencias y compila contratos
2. **Job backend:** Instala dependencias, genera Prisma client, ejecuta migraciones contra PostgreSQL y ejecuta tests

---



## Scripts Disponibles



### Backend


| Script         | Comando                   | Descripción              |
| -------------- | ------------------------- | ------------------------ |
| Iniciar        | `npm start`               | Ejecuta el servidor      |
| Desarrollo     | `npm run dev`             | Servidor con auto-reload |
| Generar Prisma | `npm run prisma:generate` | Genera Prisma Client     |
| Migrar         | `npm run prisma:migrate`  | Ejecuta migraciones      |
| Studio         | `npm run prisma:studio`   | Abre Prisma Studio       |




### Blockchain


| Script         | Comando                  | Descripción                   |
| -------------- | ------------------------ | ----------------------------- |
| Compilar       | `npm run compile`        | Compila contratos Solidity    |
| Test           | `npm run test`           | Ejecuta tests de contratos    |
| Deploy local   | `npm run deploy:local`   | Despliega en Hardhat Node     |
| Deploy Sepolia | `npm run deploy:sepolia` | Despliega en Sepolia          |
| Node local     | `npm run node`           | Inicia nodo local de Ethereum |


