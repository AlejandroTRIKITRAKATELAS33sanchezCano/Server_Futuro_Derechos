import express from "express";
import {
  login,
  getUsuarios,
  getRoles,
  createUsuario,
  getInfoByCP
} from "../routes/controller.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

//Rutas protegidas
router.get("/usuarios", verifyToken, getUsuarios);
router.get("/roles", getRoles);
router.get('/cp/:codigoPostal', getInfoByCP);
router.post("/usuarios", createUsuario);

export default router;