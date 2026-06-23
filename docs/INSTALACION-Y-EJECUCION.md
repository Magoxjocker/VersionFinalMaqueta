# Instalacion y ejecucion

## Requisitos
- Node.js 18 o superior
- MySQL 8 o superior
- npm

## Instalacion
1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. Crear la base de datos usando `database/schema.sql`.
4. Para una instalacion completa de prueba, cargar `database/seed.sql`.
5. Para una instalacion limpia del instituto, cargar `database/seed-instituto.sql`.

## Variables de entorno
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `SESSION_SECRET`
- `APP_PORT` o `PORT`

## Configuracion de base de datos
Ejemplo:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sistema_asistencia_eventos_st
DB_USER=root
DB_PASSWORD=
SESSION_SECRET=SistemaEventosST_2026
APP_PORT=3000
```

## Comandos
- `npm run dev`
- `npm start`

## Carga inicial
- Ejecutar primero `schema.sql`.
- Luego ejecutar `seed.sql`.
- Alternativa minima: ejecutar `schema.sql` y luego `seed-instituto.sql`.

## Usuarios iniciales
- Administrador: `admin@sistema.cl` / `admin123`
- Encargado: `informatica@sistema.cl` / `encargado123`
- Guardia: `guardia@sistema.cl` / `guardia123`

## Pruebas rapidas
1. Iniciar sesion como administrador.
2. Crear un evento y activarlo.
3. Iniciar sesion como encargado.
4. Seleccionar el evento y registrar una persona.
5. Iniciar sesion como guardia.
6. Marcar ingreso y verificar bloqueo.

## Errores comunes
- Error de conexion MySQL: revisar `DB_HOST`, `DB_USER` y `DB_PASSWORD`.
- Tabla inexistente: volver a ejecutar `schema.sql` y `seed.sql`.
- Credenciales invalidas: confirmar que la semilla se cargo correctamente.
