# Tests

## Cobertura
- `tests/unit`: reglas puras, helpers y modelos base.
- `tests/integration`: rutas HTTP, login por rol y flujo encargado/guardia.
- `tests/e2e`: flujo completo contra el servidor real.

## Comandos
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm test`
- `npm run test:coverage`

## Criterios validados
- La card seleccionada del encargado se respeta en `persona_participacion`.
- El pasajero se guarda en su propio evento.
- El guardia no duplica ingresos para una misma participacion.
- Los paneles de admin, encargado y guardia responden con sesion valida.
