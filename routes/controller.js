import { pool } from '../db.js';

export const getEmpleados = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuario');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error del servidor" });
    }
};