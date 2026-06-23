# Sistema Asistencia Eventos ST

Aplicacion web MVC para control de eventos, personas, vehiculos, pasajeros e ingresos por rol.

## Roles
- Administrador: gestiona usuarios, unidades, eventos, estacionamientos e historiales.
- Encargado: registra personas por evento o visita diaria, con vehiculo y pasajero opcional.
- Guardia: marca ingreso por evento activo o visitas diarias.

## Documentacion
- [README del sistema](docs/README-SISTEMA.md)
- [Manual administrador](docs/MANUAL-ADMINISTRADOR.md)
- [Manual encargado](docs/MANUAL-ENCARGADO.md)
- [Manual guardia](docs/MANUAL-GUARDIA.md)
- [Base de datos](docs/BASE-DE-DATOS.md)
- [API endpoints](docs/API-ENDPOINTS.md)
- [Instalacion y ejecucion](docs/INSTALACION-Y-EJECUCION.md)
- [Tests](docs/TESTS.md)

## Base minima para instituto
- `database/schema.sql`
- `database/seed-instituto.sql`
- Incluye solo estructura y los 3 usuarios iniciales.

## Credenciales de prueba
- Administrador: `admin@sistema.cl` / `admin123`
- Encargado: `informatica@sistema.cl` / `encargado123`
- Guardia: `guardia@sistema.cl` / `guardia123`
