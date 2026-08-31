-- CreateTable
CREATE TABLE "inscripciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fecha_nac" TIMESTAMP(3) NOT NULL,
    "representante" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash_documento" TEXT NOT NULL,
    "tx_hash" TEXT,
    "wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" SERIAL NOT NULL,
    "inscripcion_id" INTEGER NOT NULL,
    "anno" INTEGER NOT NULL,
    "grado" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "hash_documento" TEXT NOT NULL,
    "tx_hash" TEXT,
    "wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "matricula_id" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante" TEXT,
    "hash_documento" TEXT NOT NULL,
    "tx_hash" TEXT,
    "wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" SERIAL NOT NULL,
    "matricula_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "pdf_cid" TEXT,
    "hash_documento" TEXT NOT NULL,
    "tx_hash" TEXT,
    "wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_cedula_key" ON "inscripciones"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_hash_documento_key" ON "inscripciones"("hash_documento");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_hash_documento_key" ON "matriculas"("hash_documento");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_hash_documento_key" ON "pagos"("hash_documento");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_hash_documento_key" ON "certificados"("hash_documento");

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
