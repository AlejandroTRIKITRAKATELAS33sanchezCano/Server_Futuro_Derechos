import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import indexRoutes from './routes/index.routes.js';

const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

//Rutas
app.use('/api', indexRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});