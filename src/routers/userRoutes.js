import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({httpMethod: "GET"})
})

router.post('/', (req, res) => {
    res.json({httpMethod: "POST"})
})

router.put('/:id', (req, res) => {
    res.json({httpMethod: "PUT"})
})

router.delete('/:id', (req, res) => {
    res.json({httpMethod: "DELETE"})
})

export default router;