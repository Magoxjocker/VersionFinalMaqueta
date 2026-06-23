# API Endpoints

## Autenticacion

| Metodo | Ruta | Descripcion | Rol | Parametros | Respuesta | Validaciones |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | Pantalla de ingreso | Publico | Ninguno | Vista login | Sesion opcional |
| GET | `/login` | Pantalla de ingreso | Publico | Ninguno | Vista login | Sesion opcional |
| POST | `/login` | Iniciar sesion | Publico | `correo`, `clave` | Redireccion por rol | Correo valido, clave obligatoria |
| GET | `/logout` | Cerrar sesion | Autenticado | Ninguno | Redireccion a login | Sesion valida |

## Administrador

| Metodo | Ruta | Descripcion | Rol | Parametros | Respuesta | Validaciones |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/admin` | Dashboard | Administrador | Ninguno | Vista resumen | Sesion y rol |
| GET | `/admin/usuarios` | Listar usuarios | Administrador | `edit` opcional | Vista usuarios | Sesion y rol |
| POST | `/admin/usuarios` | Crear o editar usuario | Administrador | `id_usuario`, `nombre`, `correo`, `clave`, `rol_id`, `unidad_id`, `estado` | Redireccion | Nombre, correo y rol obligatorios |
| POST | `/admin/usuarios/:id/eliminar` | Eliminar usuario | Administrador | `id` | Redireccion | Id valido |
| GET | `/admin/unidades` | Listar unidades | Administrador | `edit` opcional | Vista unidades | Sesion y rol |
| POST | `/admin/unidades` | Crear o editar unidad | Administrador | `id_unidad`, `nombre`, `descripcion`, `estado` | Redireccion | Nombre obligatorio |
| POST | `/admin/unidades/:id/eliminar` | Eliminar unidad | Administrador | `id` | Redireccion | Id valido |
| GET | `/admin/eventos` | Listar eventos | Administrador | `edit` opcional | Vista eventos | Sesion y rol |
| POST | `/admin/eventos` | Crear o editar evento | Administrador | `id_evento`, `nombre`, `codigo_evento`, `fecha_inicio`, `fecha_termino`, `hora_inicio`, `hora_termino`, `estado`, `unidad_ids` | Redireccion | Fechas y horas obligatorias |
| POST | `/admin/eventos/:id/finalizar` | Finalizar evento | Administrador | `id` | Redireccion | Id valido |
| POST | `/admin/eventos/:id/eliminar` | Eliminar evento | Administrador | `id` | Redireccion | Id valido |
| GET | `/admin/estacionamientos` | Listar cards de estacionamiento | Administrador | `evento_id` opcional | Vista estacionamientos | Evento activo |
| POST | `/admin/estacionamientos` | Crear o editar card | Administrador | `id_estacionamiento`, `evento_id`, `cantidad_espacios`, `numero_espacio`, `unidad_id` | Redireccion | Evento valido |
| POST | `/admin/estacionamientos/:id/eliminar` | Eliminar card | Administrador | `id` | Redireccion | Id valido |
| GET | `/admin/historiales` | Ver historiales | Administrador | Ninguno | Vista historiales | Sesion y rol |

## Encargado

| Metodo | Ruta | Descripcion | Rol | Parametros | Respuesta | Validaciones |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/encargado` | Panel del encargado | Encargado | `scope`, `evento_id`, `q` | Vista panel | Sesion y rol |
| POST | `/encargado/personas` | Registrar persona principal y pasajero opcional | Encargado | `scope`, `evento_id`, `tipo_documento`, `numero_documento`, `nombre_completo`, `correo`, `telefono`, `tipo_llegada`, `patente`, `marca`, `modelo`, `color`, `requiere_estacionamiento`, `con_pasajero`, `tipo_documento_pasajero`, `numero_documento_pasajero`, `nombre_completo_pasajero`, `evento_id_pasajero`, `glosa_visita` | Redireccion | Documento, nombre y scope obligatorios; pasajero requiere evento |

## Guardia

| Metodo | Ruta | Descripcion | Rol | Parametros | Respuesta | Validaciones |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/guardia` | Panel del guardia | Guardia | `scope`, `evento_id`, `q`, `vehiculo_persona_id` | Vista panel | Sesion y rol |
| POST | `/guardia/ingresos` | Marcar ingreso | Guardia | `persona_id`, `evento_id`, `tipo_participacion`, `scope` | Redireccion | Persona valida, tipo valido, evento requerido para eventos |

## Validaciones clave
- No se registra ingreso dos veces.
- El ingreso se guarda con fecha y hora automaticas.
- El checkbox de ingreso se bloquea despues del primer marcado.
- El pasajero no puede guardarse sin evento.
- Los tests automatizados cubren login, paneles por rol, registro de encargado y marca de ingreso.
