import express from "express";
import {
  login,
  getUsuarios,
  getRoles,
  createUsuario,
  getInfoByCP,
  getUsuarioById,
  updateUsuario,
  cambiarEstadoUsuario,
  deleteUsuario
} from "../routes/controller.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

//Rutas protegidas
router.get("/usuarios", verifyToken, getUsuarios);
router.get("/roles",getRoles);
router.get('/cp/:codigoPostal', getInfoByCP);
router.post("/usuarios/crearUsuario", verifyToken,createUsuario);
router.get("/usuarios/:id", getUsuarioById);
router.put("/usuarios/:id", updateUsuario);
router.patch("/usuarios/:id/estado", cambiarEstadoUsuario);
router.delete("/usuarios/:id", deleteUsuario);

export default router;