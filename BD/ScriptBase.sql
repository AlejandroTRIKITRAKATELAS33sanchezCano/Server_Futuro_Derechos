-- Configuración de zona horaria y esquema
CREATE SCHEMA IF NOT EXISTS mydb;
SET search_path TO mydb;

-- -----------------------------------------------------
-- Table Estado
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Estado (
  idEstado SERIAL PRIMARY KEY,
  estNombre VARCHAR(50) NOT NULL,
  estClaveEntidad VARCHAR(45) NOT NULL
);

-- -----------------------------------------------------
-- Table Municipio
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Municipio (
  idMunicipio SERIAL,
  munNombre VARCHAR(45) NOT NULL,
  Estado_idEstado INT NOT NULL,
  munClaveIdentidad INT NOT NULL,
  munClave INT NOT NULL,
  PRIMARY KEY (idMunicipio, Estado_idEstado),
  CONSTRAINT fk_Municipio_Estado
    FOREIGN KEY (Estado_idEstado)
    REFERENCES Estado (idEstado)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table Colonia
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Colonia (
  idColonia SERIAL,
  colCodigoPostal INT NOT NULL,
  colNombre VARCHAR(45) NOT NULL,
  Municipio_idMunicipio INT NOT NULL,
  Municipio_Estado_idEstado INT NOT NULL,
  PRIMARY KEY (idColonia, Municipio_idMunicipio, Municipio_Estado_idEstado),
  CONSTRAINT fk_Colonia_Municipio1
    FOREIGN KEY (Municipio_idMunicipio, Municipio_Estado_idEstado)
    REFERENCES Municipio (idMunicipio, Estado_idEstado)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table Direccion
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Direccion (
  idUsuDireccion SERIAL,
  UdirCalle VARCHAR(45) NOT NULL,
  UdirNumExterior INT NULL,
  UdirNumInterior INT NULL,
  UdirTieneNum SMALLINT NULL, -- TINYINT se convierte a SMALLINT o BOOLEAN
  UdirReferencia VARCHAR(500) NULL,
  Colonia_idColonia INT NOT NULL,
  Colonia_Municipio_idMunicipio INT NOT NULL,
  Colonia_Municipio_Estado_idEstado INT NOT NULL,
  PRIMARY KEY (idUsuDireccion, Colonia_idColonia, Colonia_Municipio_idMunicipio, Colonia_Municipio_Estado_idEstado),
  CONSTRAINT fk_Direccion_Colonia1
    FOREIGN KEY (Colonia_idColonia, Colonia_Municipio_idMunicipio, Colonia_Municipio_Estado_idEstado)
    REFERENCES Colonia (idColonia, Municipio_idMunicipio, Municipio_Estado_idEstado)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table Rol
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Rol (
  idRol SERIAL PRIMARY KEY,
  rolNombre VARCHAR(45) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- Table Usuario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuario (
  idUsuario SERIAL,
  usuNom VARCHAR(50) NOT NULL,
  usuPrimerApellido VARCHAR(45) NOT NULL,
  usuSegundoApellido VARCHAR(45) NOT NULL,
  usuRFC VARCHAR(13) NOT NULL UNIQUE,
  usuCURP VARCHAR(18) NOT NULL UNIQUE,
  usuFechaNacimiento DATE NOT NULL,
  usuSexo CHAR(1) NOT NULL,
  Direccion_idUsuDireccion INT NOT NULL,
  Direccion_Colonia_idColonia INT NOT NULL,
  Direccion_Colonia_Municipio_idMunicipio INT NOT NULL,
  Direccion_Colonia_Municipio_Estado_idEstado INT NOT NULL,
  usuVoluntarioEmpleado SMALLINT NOT NULL,
  usuContrasenna VARCHAR(45) NOT NULL,
  usuEmail VARCHAR(45) NOT NULL,
  Rol_idRol INT NOT NULL,
  usuActivo SMALLINT NOT NULL,
  usuFechaRegistro TIMESTAMP NOT NULL, -- DATETIME se convierte a TIMESTAMP
  usuImagen VARCHAR(60) NOT NULL,
  PRIMARY KEY (idUsuario, Direccion_idUsuDireccion, Direccion_Colonia_idColonia, Direccion_Colonia_Municipio_idMunicipio, Direccion_Colonia_Municipio_Estado_idEstado, Rol_idRol),
  CONSTRAINT fk_Usuario_Direccion1
    FOREIGN KEY (Direccion_idUsuDireccion, Direccion_Colonia_idColonia, Direccion_Colonia_Municipio_idMunicipio, Direccion_Colonia_Municipio_Estado_idEstado)
    REFERENCES Direccion (idUsuDireccion, Colonia_idColonia, Colonia_Municipio_idMunicipio, Colonia_Municipio_Estado_idEstado)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Usuario_Rol1
    FOREIGN KEY (Rol_idRol)
    REFERENCES Rol (idRol)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table EquipoMultidisciplinario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS EquipoMultidisciplinario (
  idEquipoMultidisciplinario SERIAL PRIMARY KEY,
  equClave VARCHAR(5) NOT NULL
);

-- -----------------------------------------------------
-- Table Usuario_has_EquipoMultidisciplinario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuario_has_EquipoMultidisciplinario (
  Usuario_idUsuario INT NOT NULL,
  Usuario_Direccion_idUsuDireccion INT NOT NULL,
  Usuario_Direccion_Colonia_idColonia INT NOT NULL,
  Usuario_Direccion_Colonia_Municipio_idMunicipio INT NOT NULL,
  Usuario_Direccion_Colonia_Municipio_Estado_idEstado INT NOT NULL,
  Usuario_Rol_idRol INT NOT NULL,
  EquipoMultidisciplinario_idEquipoMultidisciplinario INT NOT NULL,
  PRIMARY KEY (Usuario_idUsuario, Usuario_Direccion_idUsuDireccion, Usuario_Direccion_Colonia_idColonia, Usuario_Direccion_Colonia_Municipio_idMunicipio, Usuario_Direccion_Colonia_Municipio_Estado_idEstado, Usuario_Rol_idRol, EquipoMultidisciplinario_idEquipoMultidisciplinario),
  CONSTRAINT fk_Usuario_has_EquipoMultidisciplinario_Usuario1
    FOREIGN KEY (Usuario_idUsuario, Usuario_Direccion_idUsuDireccion, Usuario_Direccion_Colonia_idColonia, Usuario_Direccion_Colonia_Municipio_idMunicipio, Usuario_Direccion_Colonia_Municipio_Estado_idEstado, Usuario_Rol_idRol)
    REFERENCES Usuario (idUsuario, Direccion_idUsuDireccion, Direccion_Colonia_idColonia, Direccion_Colonia_Municipio_idMunicipio, Direccion_Colonia_Municipio_Estado_idEstado, Rol_idRol)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Usuario_has_EquipoMultidisciplinario_EquipoMultidisciplina1
    FOREIGN KEY (EquipoMultidisciplinario_idEquipoMultidisciplinario)
    REFERENCES EquipoMultidisciplinario (idEquipoMultidisciplinario)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);