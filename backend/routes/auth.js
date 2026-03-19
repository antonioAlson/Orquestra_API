import express from 'express';
import { register, login, getMe, listUsers, createUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas (não requerem autenticação)
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas (requerem autenticação)
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, listUsers);
router.post('/users', authenticate, createUser);

export default router;
