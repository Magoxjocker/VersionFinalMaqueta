# Sistema de Asistencia/Eventos ST

## Objetivo
Controlar acceso, registro e ingreso de personas por evento o visita diaria, separando los flujos de Administrador, Encargado y Guardia.

## Descripcion general
Aplicacion web MVC con Node.js, Express, EJS y MySQL. Centraliza usuarios, eventos, unidades, personas, vehiculos, pasajeros e ingresos.

## Tecnologias utilizadas
- Node.js
- Express
- EJS
- MySQL
- mysql2
- express-session
- bcrypt
- express-validator

## Arquitectura general
- `src/routes`: exposicion de endpoints
- `src/controllers`: logica por rol
- `src/models`: consultas SQL
- `src/views`: vistas EJS
- `src/middlewares`: autenticacion y validacion
- `src/helpers`: utilidades de formato

## Roles del sistema
- Administrador: crea y administra eventos, unidades, usuarios, estacionamientos e historiales.
- Encargado: registra personas asociadas a una card de evento o visitas diarias, con opcion de vehiculo y pasajero.
- Guardia: visualiza listas por evento o visitas diarias y marca ingreso una sola vez.

## Flujo principal
1. El administrador crea y activa eventos.
2. El encargado selecciona una card de evento activo o visitas diarias.
3. El encargado registra persona principal y, si corresponde, vehiculo y pasajero.
4. El guardia abre la card del evento o visitas diarias y marca el ingreso.
5. El sistema guarda fecha, hora y bloquea un segundo ingreso.

## Entidades clave
- Eventos: actividades activas, programadas o finalizadas.
- Personas: registro unico por documento.
- Vehiculos: asociados a la persona principal.
- Pasajeros: personas independientes con su propio evento.
- Ingresos: registro unico por participacion.

## Estado final del proyecto
Flujo funcional alineado al modelo de datos actual, con documentacion final en `docs/` y semillas de prueba para los tres roles.

## Base minima de despliegue
- `database/schema.sql`
- `database/seed-instituto.sql`
- Resultado esperado: solo tablas creadas, 3 roles, 3 unidades base y 3 usuarios iniciales.
