const prisma = require('../config/db');
const SHA256 = require('crypto-js/sha256');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.matricula.findMany({
      orderBy: { createdAt: 'desc' },
      include: { inscripcion: true }
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await prisma.matricula.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { inscripcion: true, pagos: true, certificados: true }
    });
    if (!item) return res.status(404).json({ error: 'Matrícula no encontrada' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { inscripcionId, anno, grado } = req.body;
    const hashDocumento = SHA256(JSON.stringify({ inscripcionId, anno, grado })).toString();

    const item = await prisma.matricula.create({
      data: { inscripcionId, anno, grado, hashDocumento }
    });

    try {
      const blockchain = require('../blockchain');
      const id = `MAT-${item.id}`;
      const { txHash, wallet } = await blockchain.notarize('matriculas', id, '0x' + hashDocumento);
      await prisma.matricula.update({
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
    const { inscripcionId, anno, grado, estado, txHash, walletAddress } = req.body;
    const data = { anno, grado, estado, txHash, walletAddress };
    if (inscripcionId) data.inscripcionId = inscripcionId;

    const item = await prisma.matricula.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.matricula.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const item = await prisma.matricula.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Matrícula no encontrada' });

    const offChainHash = SHA256(JSON.stringify({
      inscripcionId: item.inscripcionId,
      anno: item.anno,
      grado: item.grado
    })).toString();

    let onChainResult = { valid: false, message: 'Not notarized on blockchain' };
    if (item.txHash) {
      try {
        const blockchain = require('../blockchain');
        const id = `MAT-${item.id}`;
        const valid = await blockchain.verify('matriculas', id, '0x' + offChainHash);
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
