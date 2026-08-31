const prisma = require('../config/db');
const SHA256 = require('crypto-js/sha256');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.pago.findMany({
      orderBy: { createdAt: 'desc' },
      include: { matricula: true }
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await prisma.pago.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { matricula: true }
    });
    if (!item) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { matriculaId, monto, concepto, comprobante } = req.body;
    const hashDocumento = SHA256(JSON.stringify({ matriculaId, monto, concepto })).toString();

    const item = await prisma.pago.create({
      data: { matriculaId, monto, concepto, comprobante, hashDocumento }
    });

    try {
      const blockchain = require('../blockchain');
      const id = `PAG-${item.id}`;
      const { txHash, wallet } = await blockchain.notarize('pagos', id, '0x' + hashDocumento);
      await prisma.pago.update({
        where: { id: item.id },
        data: { txHash, walletAddress: wallet }
      });
      item.txHash = txHash;
      item.walletAddress = wallet;
    } catch (e) {
      console.warn('Blockchain notarization failed:', e.message);
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { matriculaId, monto, concepto, comprobante, txHash, walletAddress } = req.body;

    const item = await prisma.pago.update({
      where: { id: parseInt(req.params.id) },
      data: { matriculaId, monto, concepto, comprobante, txHash, walletAddress }
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.pago.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const item = await prisma.pago.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Pago no encontrado' });

    const offChainHash = SHA256(JSON.stringify({
      matriculaId: item.matriculaId,
      monto: item.monto,
      concepto: item.concepto
    })).toString();

    let onChainResult = { valid: false, message: 'Not notarized on blockchain' };
    if (item.txHash) {
      try {
        const blockchain = require('../blockchain');
        const id = `PAG-${item.id}`;
        const valid = await blockchain.verify('pagos', id, '0x' + offChainHash);
        onChainResult = { valid, message: valid ? 'Integrity verified' : 'Hash mismatch - possible tampering' };
      } catch (e) {
        onChainResult = { valid: false, message: 'Blockchain verification failed: ' + e.message };
      }
    }

    res.json({
      id: item.id,
      offChainHash,
      onChainHash: item.txHash || null,
      walletAddress: item.walletAddress || null,
      ...onChainResult
    });
  } catch (err) {
    next(err);
  }
};
