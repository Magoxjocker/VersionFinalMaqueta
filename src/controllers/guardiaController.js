import { listEventosActivos } from '../models/eventoModel.js';
import {
  listDailySummary,
  listPeopleByEvent,
  listDailyVisitors,
  getVehicleDetailsByPersonId,
  findPersonById,
} from '../models/personaModel.js';
import { createIngreso, findIngresoByParticipacionId } from '../models/ingresoModel.js';
import { findParticipacion, updateParticipacionEstado } from '../models/participacionModel.js';
import { createHistorialVisita, getOrCreateTodayClosure } from '../models/historialModel.js';
import { findTransporteByPersonaId } from '../models/transporteModel.js';

function navItems(active) {
  return [
    { href: '/guardia', label: 'Panel', active: active === 'panel' },
    { href: '/guardia?scope=diaria', label: 'Visitas diarias', active: active === 'diaria' },
  ];
}

export async function guardiaDashboard(req, res) {
  try {
    const search = (req.query.q || '').trim();
    const scope = req.query.scope || '';
    const eventoId = req.query.evento_id ? Number(req.query.evento_id) : null;
    const vehiclePersonId = req.query.vehiculo_persona_id ? Number(req.query.vehiculo_persona_id) : null;

    const [eventosActivos, resumenDiario] = await Promise.all([
      listEventosActivos(),
      listDailySummary(),
    ]);

    let selectedScope = scope;
    let personas = [];
    let resumenSeleccion = null;
    let vehicleDetail = null;

    if (selectedScope === 'evento' && eventoId) {
      personas = await listPeopleByEvent(eventoId, search);
      resumenSeleccion = eventosActivos.find((item) => Number(item.id) === Number(eventoId)) || null;
    } else if (selectedScope === 'diaria') {
      personas = await listDailyVisitors(search);
      resumenSeleccion = resumenDiario;
    }

    if (vehiclePersonId) {
      vehicleDetail = await getVehicleDetailsByPersonId(vehiclePersonId);
    }

    return res.render('guardia/dashboard', {
      title: 'Panel Guardia',
      user: req.session.user,
      navItems: navItems(selectedScope === 'diaria' ? 'diaria' : 'panel'),
      eventosActivos,
      resumenDiario,
      selectedScope,
      selectedEventId: eventoId,
      search,
      personas,
      resumenSeleccion,
      vehicleDetail,
    });
  } catch (error) {
    console.error('[guardiaController.guardiaDashboard]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar el panel de guardia.';
    return res.redirect('/');
  }
}

export async function registrarIngreso(req, res) {
  try {
    const { persona_id, evento_id, tipo_participacion, scope } = req.body;
    const personaId = Number(persona_id);
    const parsedEventoId = evento_id ? Number(evento_id) : null;
    const eventoId = Number.isFinite(parsedEventoId) && parsedEventoId > 0 ? parsedEventoId : null;
    const tipoParticipacion = String(tipo_participacion || '').trim().toUpperCase();

    if (!personaId || !['EVENTO', 'VISITA_DIARIA'].includes(tipoParticipacion)) {
      req.session.error = 'Datos de ingreso invalidos.';
      return res.redirect('/guardia');
    }

    if (tipoParticipacion === 'EVENTO' && !eventoId) {
      req.session.error = 'Debe seleccionar un evento.';
      return res.redirect('/guardia');
    }

    const person = await findPersonById(personaId);
    if (!person) {
      req.session.error = 'La persona no existe.';
      return res.redirect(scope === 'diaria' ? '/guardia?scope=diaria' : `/guardia?scope=evento&evento_id=${eventoId}`);
    }

    const participacion = await findParticipacion(personaId, eventoId, tipoParticipacion);
    if (!participacion) {
      req.session.error = 'No existe la participacion asociada a esta persona.';
      return res.redirect(scope === 'diaria' ? '/guardia?scope=diaria' : `/guardia?scope=evento&evento_id=${eventoId}`);
    }

    const existing = await findIngresoByParticipacionId(participacion.id);
    if (existing) {
      req.session.error = 'Esta persona ya registra ingreso.';
      return res.redirect(scope === 'diaria' ? '/guardia?scope=diaria' : `/guardia?scope=evento&evento_id=${eventoId}`);
    }

    const transporte = await findTransporteByPersonaId(personaId);
    const ingresoId = await createIngreso({
      personaId,
      participacionId: participacion.id,
      usuarioGuardiaId: req.session.user.id,
      eventoId: eventoId || null,
      tipoParticipacion,
      vehiculoId: transporte?.id_vehiculo || null,
    });

    const cierreId = await getOrCreateTodayClosure(req.session.user.id);
    await updateParticipacionEstado(participacion.id, 'INGRESADO');
    await createHistorialVisita({
      cierreId,
      personaId,
      participacionId: participacion.id,
      nombrePersona: person?.nombre_completo || '',
      documento: person?.numero_documento || '',
      unidad: scope === 'diaria' ? 'Visita diaria' : 'Evento',
      motivo: `Ingreso registrado con ID ${ingresoId}.`,
      tipoLlegada: transporte?.tipo_llegada || null,
      patente: transporte?.patente || null,
      horaIngreso: new Date(),
      horaSalida: null,
      usuarioId: req.session.user.id,
      accion: 'INGRESO',
      detalle: 'Ingreso marcado por guardia.',
    });

    req.session.success = 'Ingreso registrado correctamente.';
    return res.redirect(scope === 'diaria' ? '/guardia?scope=diaria' : `/guardia?scope=evento&evento_id=${eventoId}`);
  } catch (error) {
    console.error('[guardiaController.registrarIngreso]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la informacion.';
    return res.redirect('/guardia');
  }
}
