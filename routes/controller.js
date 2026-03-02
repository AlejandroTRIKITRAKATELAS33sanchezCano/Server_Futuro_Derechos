import { pool } from '../db.js';
import { JWT_SECRET } from '../config.js'
import axios from "axios";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM usuario WHERE usuemail = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }

        const user = result.rows[0];

        if (user.usuactivo !== 1) {
            return res.status(403).json({ message: "Usuario inactivo" });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.usucontrasenna
        );

        if (!validPassword) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            {
                id: user.idusuario,
                rol: user.rol_idrol,
                name : user.usunom
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

export const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                idusuario,
                usunom || ' ' || usuprimerapellido || ' ' || ususegundoapellido AS nombre_completo,
                usurfc,
                usucurp,
                usuactivo
            FROM Usuario;
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo usuarios" });
    }
};

export const getRoles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                *
            FROM rol;
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo usuarios" });
    }
};


export const createUsuario = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            nombre,
            primerApellido,
            segundoApellido,
            rfc,
            curp,
            fechaNacimiento,
            sexo,
            password,
            email,
            rolId,
            activo,
            empleadoVoluntario,
            calle,
            numExterior,
            numInterior,
            referencia,
            codigoPostal,
            estadoNombre,
            estadoClave,
            municipioNombre,
            municipioClave,
            coloniaNombre,
            urlIMG
        } = req.body;

        await client.query("BEGIN");

        /* =========================
            ESTADO
        ========================== */

        let estadoQuery = await client.query(
            `SELECT idEstado FROM Estado WHERE estNombre = $1`,
            [estadoNombre]
        );

        let idEstado;

        if (estadoQuery.rows.length > 0) {
            idEstado = estadoQuery.rows[0].idestado;
        } else {
            const insertEstado = await client.query(
                `INSERT INTO Estado (estNombre, estClaveEntidad)
         VALUES ($1, $2)
         RETURNING idEstado`,
                [estadoNombre, estadoClave]
            );
            idEstado = insertEstado.rows[0].idestado;
        }

        /* =========================
            MUNICIPIO
        ========================== */

        let municipioQuery = await client.query(
            `SELECT idMunicipio 
       FROM Municipio 
       WHERE munNombre = $1 AND Estado_idEstado = $2`,
            [municipioNombre, idEstado]
        );

        let idMunicipio;

        if (municipioQuery.rows.length > 0) {
            idMunicipio = municipioQuery.rows[0].idmunicipio;
        } else {
            const insertMunicipio = await client.query(
                `INSERT INTO Municipio 
        (munNombre, Estado_idEstado, munClaveIdentidad, munClave)
         VALUES ($1, $2, 0, $3)
         RETURNING idMunicipio`,
                [municipioNombre, idEstado, municipioClave]
            );
            idMunicipio = insertMunicipio.rows[0].idmunicipio;
        }

        /* =========================
            COLONIA
        ========================== */

        let coloniaQuery = await client.query(
            `SELECT idColonia 
       FROM Colonia 
       WHERE colNombre = $1 
       AND Municipio_idMunicipio = $2 
       AND Municipio_Estado_idEstado = $3`,
            [coloniaNombre, idMunicipio, idEstado]
        );

        let idColonia;

        if (coloniaQuery.rows.length > 0) {
            idColonia = coloniaQuery.rows[0].idcolonia;
        } else {
            const insertColonia = await client.query(
                `INSERT INTO Colonia 
        (colCodigoPostal, colNombre, Municipio_idMunicipio, Municipio_Estado_idEstado)
         VALUES ($1, $2, $3, $4)
         RETURNING idColonia`,
                [codigoPostal, coloniaNombre, idMunicipio, idEstado]
            );
            idColonia = insertColonia.rows[0].idcolonia;
        }

        /* =========================
            DIRECCIÓN
        ========================== */

        const direccionInsert = await client.query(
            `INSERT INTO Direccion (
        UdirCalle,
        UdirNumExterior,
        UdirNumInterior,
        UdirTieneNum,
        UdirReferencia,
        Colonia_idColonia,
        Colonia_Municipio_idMunicipio,
        Colonia_Municipio_Estado_idEstado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING idUsuDireccion`,
            [
                calle,
                numExterior,
                numInterior,
                numExterior ? 1 : 0,
                referencia,
                idColonia,
                idMunicipio,
                idEstado
            ]
        );

        const idDireccion = direccionInsert.rows[0].idusudireccion;

        /* =========================
            USUARIO
        ========================== */

        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO Usuario (
        usuNom,
        usuPrimerApellido,
        usuSegundoApellido,
        usuRFC,
        usuCURP,
        usuFechaNacimiento,
        usuSexo,
        Direccion_idUsuDireccion,
        Direccion_Colonia_idColonia,
        Direccion_Colonia_Municipio_idMunicipio,
        Direccion_Colonia_Municipio_Estado_idEstado,
        usuVoluntarioEmpleado,
        usuContrasenna,
        usuEmail,
        Rol_idRol,
        usuActivo,
        usuFechaRegistro,
        usuImagen
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,
        $12,
        $13,$14,$15,$16,
        NOW(),
        $17
      )`,
            [
                nombre,
                primerApellido,
                segundoApellido,
                rfc,
                curp,
                fechaNacimiento,
                sexo,
                idDireccion,
                idColonia,
                idMunicipio,
                idEstado,
                empleadoVoluntario,
                hashedPassword,
                email,
                rolId,
                activo,
                urlIMG
            ]
        );

        console.log("Password original:", password);
        console.log("Password hash:", hashedPassword);
        await client.query("COMMIT");
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sanchez.cano.alejandro33@gmail.com",
                pass: "hilreahrfvgcyfcz"
            }
        });

        await transporter.sendMail({
            from: `"Sistema" <sanchez.cano.alejandro33@gmail.com>`,
            to: email,
            subject: "Tu cuenta ha sido creada",
            html: `
        <h2>Hola ${nombre}</h2>
        <p>Tu cuenta fue creada correctamente.</p>
        <p><strong>Contraseña temporal:</strong> ${password}</p>
        <p>Por favor cámbiala al iniciar sesión.</p>
    `
        });

        res.json({ message: "Usuario creado correctamente" });

    } catch (error) {

        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ message: "Error creando usuario" });

    } finally {
        client.release();
    }
};

export const getInfoByCP = async (req, res) => {
    const { codigoPostal } = req.params;

    try {
        const response = await fetch(
            `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${codigoPostal}&per_page=200`
        );

        const data = await response.json();

        if (!data.zip_codes || data.zip_codes.length === 0) {
            return res.status(404).json({
                message: "Código postal no encontrado"
            });
        }

        const zipData = data.zip_codes;

        const estadoNombre = zipData[0].d_estado;
        const estadoClave = zipData[0].c_estado;
        const municipioNombre = zipData[0].d_mnpio;
        const municipioClave = zipData[0].c_mnpio;

        const colonias = zipData.map(z => z.d_asenta);

        res.json({
            estadoNombre,
            estadoClave,
            municipioNombre,
            municipioClave,
            colonias
        });

    } catch (error) {
        console.error("Error consultando Sepomex:", error);
        res.status(500).json({
            message: "Error consultando Sepomex"
        });
    }
};

export const getUsuarioById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                u.idusuario,
                u.usunom AS nombre,
                u.usuprimerapellido AS "primerApellido",
                u.ususegundoapellido AS "segundoApellido",
                TO_CHAR(u.usufechanacimiento, 'YYYY-MM-DD') AS "fechaNacimiento",
                u.ususexo AS sexo,
                u.usurfc AS rfc,
                u.usucurp AS curp,
                u.usuvoluntarioempleado AS "empleadoVoluntario",
                u.rol_idrol AS rolid,
                u.usuemail AS email,
                u.usuactivo,
                
                d.udircalle AS calle,
                d.udirnumexterior AS "numExterior",
                d.udirnuminterior AS "numInterior",
                d.udirreferencia AS referencia,
                
                c.colnombre AS "coloniaNombre",
                c.colcodigopostal AS "codigoPostal",
                
                e.estnombre AS "estadoNombre",
                e.estclaveentidad AS "estadoClave",
                
                m.munnombre AS "municipioNombre",
                m.munclave AS "municipioClave"

            FROM usuario u
            JOIN direccion d ON u.direccion_idusudireccion = d.idusudireccion
            JOIN colonia c ON d.colonia_idcolonia = c.idcolonia
            JOIN municipio m ON c.municipio_idmunicipio = m.idmunicipio
            JOIN estado e ON m.estado_idestado = e.idestado
            WHERE u.idusuario = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo usuario" });
    }
};

export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            nombre,
            primerApellido,
            segundoApellido,
            fechaNacimiento,
            sexo,
            rfc,
            curp,
            empleadoVoluntario,
            rolId,
            email,
            calle,
            numExterior,
            numInterior,
            referencia
        } = req.body;

        // Obtener idDireccion
        const dirResult = await client.query(
            `SELECT direccion_idusudireccion 
             FROM usuario 
             WHERE idusuario = $1`,
            [id]
        );

        const idDireccion = dirResult.rows[0].direccion_idusudireccion;

        // Actualizar direccion
        await client.query(`
            UPDATE direccion
            SET udircalle = $1,
                udirnumexterior = $2,
                udirnuminterior = $3,
                udirreferencia = $4
            WHERE idusudireccion = $5
        `, [calle, numExterior, numInterior, referencia, idDireccion]);

        // Actualizar usuario
        await client.query(`
            UPDATE usuario
            SET usunom = $1,
                usuprimerapellido = $2,
                ususegundoapellido = $3,
                usufechanacimiento = $4,
                ususexo = $5,
                usurfc = $6,
                usucurp = $7,
                usuvoluntarioempleado = $8,
                rol_idrol = $9,
                usuemail = $10
            WHERE idusuario = $11
        `, [
            nombre,
            primerApellido,
            segundoApellido,
            fechaNacimiento,
            sexo,
            rfc,
            curp,
            empleadoVoluntario,
            rolId,
            email,
            id
        ]);

        await client.query("COMMIT");
        res.json({ message: "Usuario actualizado correctamente" });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ message: "Error actualizando usuario" });
    } finally {
        client.release();
    }
};

export const cambiarEstadoUsuario = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    try {
        await pool.query(
            `UPDATE usuario 
             SET usuactivo = $1 
             WHERE idusuario = $2`,
            [activo, id]
        );

        res.json({ message: "Estado actualizado" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error cambiando estado" });
    }
};

export const deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `DELETE FROM usuario WHERE idusuario = $1`,
            [id]
        );

        res.json({ message: "Usuario eliminado" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error eliminando usuario" });
    }
};