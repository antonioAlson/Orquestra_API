import express from 'express';
import {
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  generateCertificatePdf,
} from '../controllers/qualityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/',           authenticate, listCertificates);
router.get('/:id/pdf',    authenticate, generateCertificatePdf);
router.get('/:id',        authenticate, getCertificate);
router.post('/',          authenticate, createCertificate);
router.put('/:id',        authenticate, updateCertificate);
router.delete('/:id',     authenticate, deleteCertificate);

export default router;
