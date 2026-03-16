import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({httpMethod: "GET"})
})

router.post('/', authMiddleware, (req, res) => {
    res.json({httpMethod: "POST"})
})

router.put('/:id', authMiddleware, (req, res) => {
    res.json({httpMethod: "PUT"})
})

router.delete('/:id', authMiddleware, (req, res) => {
    res.json({httpMethod: "DELETE"})
})

export default router;
