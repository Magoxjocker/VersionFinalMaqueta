# Base de Datos

## Descripcion general
La base de datos `sistema_asistencia_eventos_st` centraliza autenticacion, eventos, participaciones, vehiculos, ingresos y historiales.

## Base minima para instituto
- Archivo recomendado: `database/schema.sql` + `database/seed-instituto.sql`.
- Contiene solo estructura, los 3 roles, 3 unidades base y los 3 usuarios iniciales.
- No incluye eventos, personas, ingresos ni historiales.

## Tablas principales
- `roles`
- `unidades`
- `usuarios`
- `eventos`
- `evento_unidades`
- `evento_estacionamientos`
- `personas`
- `vehiculos`
- `persona_participacion`
- `persona_transporte`
- `registros_ingreso`
- `cierres_diarios`
- `historial_eventos`
- `historial_visitas`

## Campos importantes
- `usuarios.id_rol`, `usuarios.id_unidad`
- `eventos.estado`, `eventos.creado_por`
- `personas.tipo_documento`, `personas.numero_documento`
- `persona_participacion.tipo_participacion`, `persona_participacion.estado`
- `persona_transporte.tipo_llegada`, `persona_transporte.id_vehiculo`
- `registros_ingreso.fecha_ingreso`, `registros_ingreso.estado`

## Relaciones
- Un rol tiene muchos usuarios.
- Una unidad tiene muchos usuarios.
- Un evento puede tener muchas unidades.
- Un evento puede tener muchas participaciones.
- Una persona puede tener muchas participaciones, una por evento o visita diaria.
- Una persona puede tener un vehiculo asociado.
- Una participacion tiene a lo sumo un ingreso.

## Modelo entidad-relacion
- `usuarios` se relaciona con `roles` y `unidades`.
- `eventos` se relaciona con `usuarios` via `creado_por`.
- `persona_participacion` vincula `personas`, `eventos` y `unidades`.
- `registros_ingreso` apunta a `persona_participacion` para asegurar un ingreso unico.
- `historial_visitas` y `historial_eventos` guardan auditoria operativa.

## Cardinalidad
- `roles 1:N usuarios`
- `unidades 1:N usuarios`
- `eventos N:M unidades` mediante `evento_unidades`
- `personas 1:N persona_participacion`
- `persona_participacion 1:1 registros_ingreso`
- `personas 1:N vehiculos` en la practica mediante conductor_id

## Orden logico de creacion
1. `roles`
2. `unidades`
3. `usuarios`
4. `eventos`
5. `evento_unidades`
6. `evento_estacionamientos`
7. `personas`
8. `vehiculos`
9. `persona_participacion`
10. `persona_transporte`
11. `registros_ingreso`
12. `cierres_diarios`
13. `historial_eventos`
14. `historial_visitas`

## Scripts relevantes
- `database/schema.sql`
- `database/seed.sql`
- `database/seed-instituto.sql`
