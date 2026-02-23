import { Router } from "express";
import { getUsuarios, createUsuario, getInfoByCP } from "./controller.js";

const router = Router();

router.get('/ping', (req, res) => {
    res.json({ message: "pong 🏓" });
});

router.get("/usuarios", getUsuarios);
router.post("/usuarios/crearUsuario", createUsuario)
router.get('/cp/:codigoPostal', getInfoByCP);


export default router;