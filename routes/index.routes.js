import express from "express";
import {
  login,
  getUsuarios,
  getRoles,
  createUsuario
} from "../routes/controller.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

//Rutas protegidas
router.get("/usuarios", verifyToken, getUsuarios);
router.get("/roles", verifyToken, getRoles);
router.post("/usuarios", verifyToken, createUsuario);

export default router;