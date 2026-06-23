import bcrypt from 'bcrypt';
import { findRoleById, listRoles } from '../models/roleModel.js';
import {
  listUsers,
  createUser as createUserModel,
  updateUser as updateUserModel,
  deleteUser as deleteUserModel,
  findUserById,
} from '../models/userModel.js';
import {
  listUnidades,
  createUnidad as createUnidadModel,
  updateUnidad as updateUnidadModel,
  deleteUnidad as deleteUnidadModel,
  findUnidadById,
} from '../models/unidadModel.js';
import {
  listEventos,
  listEventosActivos,
  createEvento as createEventoModel,
  updateEvento as updateEventoModel,
  deleteEvento as deleteEventoModel,
  finalizeEvento as finalizeEventoModel,
  getActiveEventSummaries,
  listEventUnits,
  setEventUnits,
  listParkingByEvent,
  listParkingSummaryByEvent,
  createParkingCards,
  updateParkingSpace,
  deleteParkingSpace,
  findEventoById,
  getEventHistorySnapshot,
} from '../models/eventoModel.js';
import {
  listHistorialEventos,
  listHistorialVisitas,
  createHistorialEvento,
} from '../models/historialModel.js';

function parseIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => Number(item)).filter(Boolean);
  return [Number(value)].filter(Boolean);
}

function buildNav(active) {
  return [
    { href: '/admin', label: 'Resumen', active: active === 'resumen' },
    { href: '/admin/usuarios', label: 'Usuarios', active: active === 'usuarios' },
    { href: '/admin/unidades', label: 'Unidades', active: active === 'unidades' },
    { href: '/admin/eventos', label: 'Eventos', active: active === 'eventos' },
    { href: '/admin/estacionamientos', label: 'Estacionamientos', active: active === 'estacionamientos' },
    { href: '/admin/historiales', label: 'Historiales', active: active === 'historiales' },
  ];
}

async function writeEventHistory(eventoId) {
  const snapshot = await getEventHistorySnapshot(eventoId);
  if (!snapshot) return;
  await createHistorialEvento({
    eventoId: snapshot.id,
    nombreEvento: snapshot.nombre,
    fechaInicio: snapshot.fecha_inicio,
    fechaTermino: snapshot.fecha_termino,
    horaInicio: snapshot.hora_inicio,
    horaTermino: snapshot.hora_termino,
    totalUnidades: snapshot.total_unidades,
    totalPersonas: snapshot.total_personas,
    totalAsistentes: snapshot.total_asistentes,
    totalAusentes: snapshot.total_ausentes,
    totalVehiculos: snapshot.total_vehiculos,
    estacionamientosAsignados: snapshot.estacionamientos_asignados,
    estacionamientosUtilizados: snapshot.estacionamientos_utilizados,
    fechaCierre: new Date(),
  });
}

export async function adminDashboard(req, res) {
  try {
    const [resumenEventos, eventos, unidades, usuarios, historialEventos, historialVisitas] = await Promise.all([
      getActiveEventSummaries(),
      listEventos(),
      listUnidades(),
      listUsers(),
      listHistorialEventos(10),
      listHistorialVisitas(10),
    ]);

    return res.render('admin/dashboard', {
      title: 'Panel Administrador',
      user: req.session.user,
      navItems: buildNav('resumen'),
      resumenEventos,
      eventos,
      unidades,
      usuarios,
      historialEventos,
      historialVisitas,
    });
  } catch (error) {
    console.error('[adminController.adminDashboard]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar el panel.';
    return res.redirect('/');
  }
}

export async function listUsersPage(req, res) {
  try {
    const [usuarios, roles, unidades] = await Promise.all([listUsers(), listRoles(), listUnidades()]);
    const editId = req.query.edit ? Number(req.query.edit) : null;
    const editingUser = editId ? await findUserById(editId) : null;

    return res.render('admin/usuarios', {
      title: 'Usuarios',
      user: req.session.user,
      navItems: buildNav('usuarios'),
      usuarios,
      roles,
      unidades,
      editingUser,
    });
  } catch (error) {
    console.error('[adminController.listUsersPage]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar usuarios.';
    return res.redirect('/admin');
  }
}

export async function saveUser(req, res) {
  try {
    const id = req.body.id_usuario ? Number(req.body.id_usuario) : null;
    const { nombre, correo, clave, rol_id, unidad_id, estado } = req.body;
    const role = await findRoleById(Number(rol_id));

    if (!role) {
      req.session.error = 'Rol inválido.';
      return res.redirect('/admin/usuarios');
    }

    const payload = {
      nombre: nombre?.trim(),
      correo: correo?.trim(),
      rolId: role.id,
      unidadId: unidad_id ? Number(unidad_id) : null,
      estado: estado || 'ACTIVO',
    };

    if (id) {
      if (clave && clave.trim()) {
        payload.claveHash = await bcrypt.hash(clave, 10);
      }
      await updateUserModel(id, payload);
      req.session.success = 'Registro actualizado correctamente.';
      return res.redirect('/admin/usuarios');
    }

    if (!clave || !clave.trim()) {
      req.session.error = 'Debe ingresar una contraseña para crear el usuario.';
      return res.redirect('/admin/usuarios');
    }

    payload.claveHash = await bcrypt.hash(clave, 10);
    await createUserModel(payload);
    req.session.success = 'Usuario creado correctamente.';
    return res.redirect('/admin/usuarios');
  } catch (error) {
    console.error('[adminController.saveUser]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la información.';
    return res.redirect('/admin/usuarios');
  }
}

export async function deleteUser(req, res) {
  try {
    await deleteUserModel(req.params.id);
    req.session.success = 'Usuario eliminado correctamente.';
    return res.redirect('/admin/usuarios');
  } catch (error) {
    console.error('[adminController.deleteUser]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible eliminar el usuario.';
    return res.redirect('/admin/usuarios');
  }
}

export async function listUnidadesPage(req, res) {
  try {
    const [unidades, editingUnit] = await Promise.all([
      listUnidades(),
      req.query.edit ? findUnidadById(Number(req.query.edit)) : Promise.resolve(null),
    ]);

    return res.render('admin/unidades', {
      title: 'Unidades',
      user: req.session.user,
      navItems: buildNav('unidades'),
      unidades,
      editingUnit,
    });
  } catch (error) {
    console.error('[adminController.listUnidadesPage]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar unidades.';
    return res.redirect('/admin');
  }
}

export async function saveUnidad(req, res) {
  try {
    const id = req.body.id_unidad ? Number(req.body.id_unidad) : null;
    const { nombre, descripcion, estado } = req.body;
    const payload = {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      estado: estado || 'ACTIVA',
    };

    if (id) {
      await updateUnidadModel(id, payload);
      req.session.success = 'Registro actualizado correctamente.';
      return res.redirect('/admin/unidades');
    }

    await createUnidadModel(payload);
    req.session.success = 'Unidad creada correctamente.';
    return res.redirect('/admin/unidades');
  } catch (error) {
    console.error('[adminController.saveUnidad]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la información.';
    return res.redirect('/admin/unidades');
  }
}

export async function deleteUnidad(req, res) {
  try {
    await deleteUnidadModel(req.params.id);
    req.session.success = 'Unidad eliminada correctamente.';
    return res.redirect('/admin/unidades');
  } catch (error) {
    console.error('[adminController.deleteUnidad]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible eliminar la unidad.';
    return res.redirect('/admin/unidades');
  }
}

export async function listEventosPage(req, res) {
  try {
    const [eventos, unidades, editingEvent] = await Promise.all([
      listEventos(),
      listUnidades(),
      req.query.edit ? findEventoById(Number(req.query.edit)) : Promise.resolve(null),
    ]);
    const editingUnits = editingEvent ? await listEventUnits(editingEvent.id) : [];
    const selectedUnitIds = editingUnits.map((item) => Number(item.id_unidad));

    return res.render('admin/eventos', {
      title: 'Eventos',
      user: req.session.user,
      navItems: buildNav('eventos'),
      eventos,
      unidades,
      editingEvent,
      selectedUnitIds,
    });
  } catch (error) {
    console.error('[adminController.listEventosPage]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar eventos.';
    return res.redirect('/admin');
  }
}

export async function saveEvento(req, res) {
  try {
    const id = req.body.id_evento ? Number(req.body.id_evento) : null;
    const { nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado } = req.body;
    const unitIds = parseIdList(req.body.unidad_ids);

    const payload = {
      nombre: nombre?.trim(),
      codigo_evento: codigo_evento?.trim(),
      fecha_inicio,
      fecha_termino,
      hora_inicio,
      hora_termino,
      estado: estado || 'PROGRAMADO',
    };

    if (id) {
      await updateEventoModel(id, payload);
      await setEventUnits(id, unitIds);
      await writeEventHistory(id);
      req.session.success = 'Registro actualizado correctamente.';
      return res.redirect('/admin/eventos');
    }

    const newEventId = await createEventoModel({
      ...payload,
      creadoPor: req.session.user.id,
    });
    await setEventUnits(newEventId, unitIds);
    await writeEventHistory(newEventId);
    req.session.success = 'Evento creado correctamente.';
    return res.redirect('/admin/eventos');
  } catch (error) {
    console.error('[adminController.saveEvento]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la información.';
    return res.redirect('/admin/eventos');
  }
}

export async function deleteEvento(req, res) {
  try {
    await writeEventHistory(Number(req.params.id));
    await deleteEventoModel(req.params.id);
    req.session.success = 'Evento eliminado correctamente.';
    return res.redirect('/admin/eventos');
  } catch (error) {
    console.error('[adminController.deleteEvento]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible eliminar el evento.';
    return res.redirect('/admin/eventos');
  }
}

export async function finalizeEvento(req, res) {
  try {
    await finalizeEventoModel(req.params.id);
    await writeEventHistory(Number(req.params.id));
    req.session.success = 'Evento finalizado correctamente.';
    return res.redirect('/admin/eventos');
  } catch (error) {
    console.error('[adminController.finalizeEvento]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible finalizar el evento.';
    return res.redirect('/admin/eventos');
  }
}

export async function listEstacionamientosPage(req, res) {
  try {
    const eventos = await listEventosActivos();
    const selectedEventId = req.query.evento_id ? Number(req.query.evento_id) : eventos[0]?.id || null;
    const estacionamientos = selectedEventId ? await listParkingByEvent(selectedEventId) : [];
    const resumenEstacionamientos = selectedEventId
      ? await listParkingSummaryByEvent(selectedEventId)
      : { total: 0, disponibles: 0, asignados: 0, ocupados: 0 };
    const editingParkingId = req.query.edit ? Number(req.query.edit) : null;
    const editingParking = editingParkingId ? estacionamientos.find((item) => Number(item.id) === editingParkingId) || null : null;

    return res.render('admin/estacionamientos', {
      title: 'Estacionamientos',
      user: req.session.user,
      navItems: buildNav('estacionamientos'),
      eventos,
      selectedEventId,
      estacionamientos,
      resumenEstacionamientos,
      editingParking,
      unidades: await listUnidades(),
    });
  } catch (error) {
    console.error('[adminController.listEstacionamientosPage]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar estacionamientos.';
    return res.redirect('/admin');
  }
}

export async function saveParkingSpace(req, res) {
  try {
    const id = req.body.id_estacionamiento ? Number(req.body.id_estacionamiento) : null;
    const eventoId = Number(req.body.evento_id);
    const unidadId = req.body.unidad_id ? Number(req.body.unidad_id) : null;
    const cantidadEspacios = req.body.cantidad_espacios ? Number(req.body.cantidad_espacios) : null;
    const espacio = req.body.numero_espacio || req.body.espacio;

    if (!id && cantidadEspacios) {
      await createParkingCards({ eventoId, totalEspacios: cantidadEspacios });
      req.session.success = 'Estacionamientos creados correctamente.';
      return res.redirect(`/admin/estacionamientos?evento_id=${eventoId}`);
    }

    if (!id) {
      req.session.error = 'Debe indicar la cantidad de espacios para crear los estacionamientos.';
      return res.redirect(`/admin/estacionamientos?evento_id=${eventoId}`);
    }

    if (!espacio) {
      req.session.error = 'Debe indicar el numero de espacio.';
      return res.redirect(`/admin/estacionamientos?evento_id=${eventoId}`);
    }

    await updateParkingSpace({ id, eventoId, unidadId, espacio: espacio?.trim() });
    req.session.success = 'Estacionamiento actualizado correctamente.';
    return res.redirect(`/admin/estacionamientos?evento_id=${eventoId}`);
  } catch (error) {
    console.error('[adminController.saveParkingSpace]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la información.';
    return res.redirect('/admin/estacionamientos');
  }
}

export async function deleteParkingSpaceAction(req, res) {
  try {
    const eventoId = req.query.evento_id ? Number(req.query.evento_id) : null;
    await deleteParkingSpace(req.params.id);
    req.session.success = 'Estacionamiento eliminado correctamente.';
    return res.redirect(eventoId ? `/admin/estacionamientos?evento_id=${eventoId}` : '/admin/estacionamientos');
  } catch (error) {
    console.error('[adminController.deleteParkingSpaceAction]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible eliminar el estacionamiento.';
    return res.redirect('/admin/estacionamientos');
  }
}

export async function historialesPage(req, res) {
  try {
    const [historialEventos, historialVisitas] = await Promise.all([
      listHistorialEventos(50),
      listHistorialVisitas(50),
    ]);

    return res.render('admin/historiales', {
      title: 'Historiales',
      user: req.session.user,
      navItems: buildNav('historiales'),
      historialEventos,
      historialVisitas,
    });
  } catch (error) {
    console.error('[adminController.historialesPage]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar historiales.';
    return res.redirect('/admin');
  }
}
