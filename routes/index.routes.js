import { Router } from "express";
import { getEmpleados } from "./controller.js";

const router = Router();

router.get('/ping', (req, res) => {
    res.json({ message: "pong 🏓" });
});

router.get('/empleados', getEmpleados);


export default router;