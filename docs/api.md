# API REST - Zona Kids Blockchain

## Base URL

```
http://localhost:3000/api
```

## Autenticación

Pendiente de implementar

---

## Inscripciones

### Listar todas

```
GET /api/inscripciones
```

**Response 200:**

```json
[
  {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "cedula": "123456789",
    "fechaNac": "2020-03-15T00:00:00.000Z",
    "representante": "María Gómez",
    "telefono": "3001234567",
    "email": "maria@email.com",
    "hashDocumento": "8f3c4e1a...",
    "txHash": "0xabc...",
    "walletAddress": "0xA1B2...",
    "createdAt": "2026-08-25T10:00:00.000Z",
    "updatedAt": "2026-08-25T10:00:00.000Z"
  }
]
```



### Obtener una

```
GET /api/inscripciones/:id
```

**Response 200:** Objeto con inscripción y sus matrículas.

**Response 404:** `{ "error": "Inscripción no encontrada" }`

### Crear

```
POST /api/inscripciones
```

**Body:**

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "cedula": "123456789",
  "fechaNac": "2020-03-15",
  "representante": "María Gómez",
  "telefono": "3001234567",
  "email": "maria@email.com"
}
```

**Flujo:**

1. Genera SHA-256 con `{ cedula, nombre, apellido, fechaNac }`
2. Guarda en PostgreSQL
3. Notariza hash en blockchain (opcional, falla silenciosa)
4. Guarda `txHash` y `walletAddress` en PostgreSQL

**Response 201:** Objeto creado con `txHash` y `walletAddress` si la notarización fue exitosa.

### Actualizar

```
PUT /api/inscripciones/:id
```

**Body:** Mismos campos que crear.

**Response 200:** Objeto actualizado.

### Eliminar

```
DELETE /api/inscripciones/:id
```

**Response 200:** `{ "message": "Eliminado" }`

### Verificar integridad

```
GET /api/inscripciones/:id/verify
```

**Flujo:**

1. Busca el registro en PostgreSQL
2. Recalcula SHA-256 con los datos actuales
3. Consulta el hash en blockchain
4. Compara ambos

**Response 200:**

```json
{
  "id": 1,
  "offChainHash": "8f3c4e1a...",
  "onChainHash": "0xabc...",
  "walletAddress": "0xA1B2...",
  "valid": true,
  "message": "Integrity verified"
}
```

Valores posibles de `message`:

- `"Integrity verified"` — Hash coincide, datos íntegros
- `"Hash mismatch - possible tampering"` — Hash no coincide
- `"Not notarized on blockchain"` — Registro no fue notarizado
- `"Blockchain verification failed: ..."` — Error al consultar blockchain

---



## Matrículas



### Listar todas

```
GET /api/matriculas
```

**Response 200:** Array con matrículas e inscripción asociada.

### Obtener una

```
GET /api/matriculas/:id
```

**Response 200:** Objeto con matrícula, inscripción, pagos y certificados.

### Crear

```
POST /api/matriculas
```

**Body:**

```json
{
  "inscripcionId": 1,
  "anno": 2026,
  "grado": "Preescolar A"
}
```

**Flujo:** Genera SHA-256 → guarda en PostgreSQL → notariza en blockchain.

### Actualizar

```
PUT /api/matriculas/:id
```

**Body:**

```json
{
  "anno": 2026,
  "grado": "Preescolar B",
  "estado": "activa"
}
```



### Eliminar

```
DELETE /api/matriculas/:id
```



### Verificar integridad

```
GET /api/matriculas/:id/verify
```

Mismo patrón que inscripciones.

---



## Pagos



### Listar todos

```
GET /api/pagos
```



### Obtener uno

```
GET /api/pagos/:id
```



### Crear

```
POST /api/pagos
```

**Body:**

```json
{
  "matriculaId": 1,
  "monto": 150000,
  "concepto": "Matrícula 2026",
  "comprobante": "REC-001"
}
```

**Flujo:** Genera SHA-256 con `{ matriculaId, monto, concepto }` → guarda → notariza.

### Actualizar

```
PUT /api/pagos/:id
```



### Eliminar

```
DELETE /api/pagos/:id
```



### Verificar integridad

```
GET /api/pagos/:id/verify
```

---



## Certificados



### Listar todos

```
GET /api/certificados
```



### Obtener uno

```
GET /api/certificados/:id
```



### Crear

```
POST /api/certificados
```

**Body:**

```json
{
  "matriculaId": 1,
  "titulo": "Certificado de Preescolar",
  "pdfCid": "QmXoypiz..."
}
```

**Flujo:** Genera SHA-256 con `{ matriculaId, titulo, pdfCid }` → guarda → notariza.

El campo `pdfCid` es el Content Identifier de IPFS donde se almacena el PDF.

### Actualizar

```
PUT /api/certificados/:id
```



### Eliminar

```
DELETE /api/certificados/:id
```



### Verificar integridad

```
GET /api/certificados/:id/verify
```

---



## Errores

Todos los endpoints retornan errores en formato:

```json
{
  "error": "Mensaje de error"
}
```

Códigos de estado:


| Código | Descripción                |
| ------ | -------------------------- |
| 200    | Éxito                      |
| 201    | Creado                     |
| 404    | No encontrado              |
| 500    | Error interno del servidor |


