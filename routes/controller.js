import { pool } from '../db.js';
import axios from "axios";

export const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.idUsuario,
                CONCAT(u.usuNom, ' ', u.usuPrimerApellido, ' ', u.usuSegundoApellido) AS nombreCompleto,
                DATE_PART('year', AGE(u.usuFechaNacimiento)) AS edad,
                u.usuSexo,
                u.usuRFC,
                u.usuCURP,
                u.usuActivo
            FROM Usuario u;
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
            calle,
            numExterior,
            numInterior,
            referencia,
            codigoPostal,
            estadoNombre,
            estadoClave,
            municipioNombre,
            municipioClave,
            coloniaNombre
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
        0,
        $12,$13,$14,$15,
        NOW(),
        'default.png'
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
                password,
                email,
                rolId,
                activo
            ]
        );

        await client.query("COMMIT");

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