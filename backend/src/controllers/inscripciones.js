const prisma = require('../config/db');
const SHA256 = require('crypto-js/sha256');

exports.getAll = async (req, res, next) => {
  try {
    const data = await prisma.inscripcion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await prisma.inscripcion.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { matriculas: true }
    });
    if (!item) return res.status(404).json({ error: 'Inscripción no encontrada' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { nombre, apellido, cedula, fechaNac, representante, telefono, email } = req.body;
    const fechaNacNorm = new Date(fechaNac).toISOString().split('T')[0];
    const hashDocumento = SHA256(JSON.stringify({ cedula, nombre, apellido, fechaNac: fechaNacNorm })).toString();

    const item = await prisma.inscripcion.create({
      data: { nombre, apellido, cedula, fechaNac: new Date(fechaNac), representante, telefono, email, hashDocumento }
    });

    try {
      const blockchain = require('../blockchain');
      const id = `INS-${item.id}`;
      const { txHash, wallet } = await blockchain.notarize('inscripciones', id, '0x' + hashDocumento);
      await prisma.inscripcion.update({
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
    const { nombre, apellido, cedula, fechaNac, representante, telefono, email } = req.body;
    const fechaNacNorm = fechaNac ? new Date(fechaNac).toISOString().split('T')[0] : fechaNac;
    const hashDocumento = SHA256(JSON.stringify({ cedula, nombre, apellido, fechaNac: fechaNacNorm })).toString();

    const item = await prisma.inscripcion.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, apellido, cedula, fechaNac: new Date(fechaNac), representante, telefono, email, hashDocumento }
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.inscripcion.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const item = await prisma.inscripcion.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Inscripción no encontrada' });

    // Normaliza fecha a YYYY-MM-DD para que coincida con el hash creado (string original, no Date ISO)
    const fechaNacStr = item.fechaNac instanceof Date ? item.fechaNac.toISOString().split('T')[0] : item.fechaNac;
    const offChainHash = SHA256(JSON.stringify({
      cedula: item.cedula,
      nombre: item.nombre,
      apellido: item.apellido,
      fechaNac: fechaNacStr
    })).toString();

    let onChainResult = { valid: false, message: 'Not notarized on blockchain' };
    if (item.txHash) {
      try {
        const blockchain = require('../blockchain');
        const id = `INS-${item.id}`;
        const valid = await blockchain.verify('inscripciones', id, '0x' + offChainHash);
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
