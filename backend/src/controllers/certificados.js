const prisma = require('../config/db');
const SHA256 = require('crypto-js/sha256');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.certificado.findMany({
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
    const item = await prisma.certificado.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { matricula: true }
    });
    if (!item) return res.status(404).json({ error: 'Certificado no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { matriculaId, titulo, pdfCid } = req.body;
    const hashDocumento = SHA256(JSON.stringify({ matriculaId, titulo, pdfCid })).toString();

    const item = await prisma.certificado.create({
      data: { matriculaId, titulo, pdfCid, hashDocumento }
    });

    try {
      const blockchain = require('../blockchain');
      const id = `CERT-${item.id}`;
      const { txHash, wallet } = await blockchain.notarize('certificados', id, '0x' + hashDocumento);
      await prisma.certificado.update({
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
    const { matriculaId, titulo, pdfCid } = req.body;
    const hashDocumento = SHA256(JSON.stringify({ matriculaId, titulo, pdfCid })).toString();

    const item = await prisma.certificado.update({
      where: { id: parseInt(req.params.id) },
      data: { matriculaId, titulo, pdfCid, hashDocumento }
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.certificado.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const item = await prisma.certificado.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Certificado no encontrado' });

    const offChainHash = SHA256(JSON.stringify({
      matriculaId: item.matriculaId,
      titulo: item.titulo,
      pdfCid: item.pdfCid
    })).toString();

    let onChainResult = { valid: false, message: 'Not notarized on blockchain' };
    if (item.txHash) {
      try {
        const blockchain = require('../blockchain');
        const id = `CERT-${item.id}`;
        const valid = await blockchain.verify('certificados', id, '0x' + offChainHash);
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
