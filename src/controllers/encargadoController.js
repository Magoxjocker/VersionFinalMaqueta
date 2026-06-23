import {
  findPersonByDocumento,
  createPerson,
  updatePerson,
  listPeopleByEvent,
  listDailyVisitors,
  listPeopleSummaryByEvent,
  listDailySummary,
  getVehicleDetailsByPersonId,
} from '../models/personaModel.js';
import { findAvailableParkingForUnidad, occupyParkingSpace, listEventosActivosByUnidad, listParkingSummaryByUnidad } from '../models/eventoModel.js';
import { findParticipacion, createParticipacion, updateParticipacion } from '../models/participacionModel.js';
import { findOrCreateVehiculo } from '../models/vehiculoModel.js';
import { upsertTransporte } from '../models/transporteModel.js';
import { createHistorialVisita, getOrCreateTodayClosure } from '../models/historialModel.js';
import {
  buildEncargadoRegistration,
  buildMainParticipation,
  buildPassengerParticipation,
} from '../services/encargadoService.js';

function buildBaseNav(active = 'encargado') {
  return [
    { href: '/encargado', label: 'Panel', active: active === 'encargado' },
    { href: '/encargado?scope=diaria', label: 'Visitas diarias', active: active === 'diaria' },
  ];
}

export async function encargadoDashboard(req, res) {
  try {
    const unidadId = req.session.user.unidad_id;
    const search = (req.query.q || '').trim();
    const scope = req.query.scope || '';
    const eventoId = req.query.evento_id ? Number(req.query.evento_id) : null;
    const vehiclePersonId = req.query.vehiculo_persona_id ? Number(req.query.vehiculo_persona_id) : null;

    const [eventosActivos, resumenDiario, resumenEstacionamientos] = await Promise.all([
      listEventosActivosByUnidad(unidadId),
      listDailySummary(unidadId),
      listParkingSummaryByUnidad(unidadId),
    ]);

    let selectedScope = scope;
    let selectedEventId = eventoId;
    let personas = [];
    let resumenSeleccion = null;
    let vehicleDetail = null;

    if (selectedScope === 'evento' && selectedEventId) {
      personas = await listPeopleByEvent(selectedEventId, search, unidadId);
      resumenSeleccion = await listPeopleSummaryByEvent(selectedEventId);
    } else if (selectedScope === 'diaria') {
      personas = await listDailyVisitors(search, unidadId);
      resumenSeleccion = resumenDiario;
    }

    if (vehiclePersonId) {
      vehicleDetail = await getVehicleDetailsByPersonId(vehiclePersonId);
    }

    const eventosVisuales = eventosActivos.map((evento) => ({
      ...evento,
      seleccionUrl: `/encargado?scope=evento&evento_id=${evento.id}`,
    }));

    return res.render('encargado/dashboard', {
      title: 'Panel Encargado',
      user: req.session.user,
      navItems: buildBaseNav(selectedScope === 'diaria' ? 'diaria' : 'encargado'),
      eventosActivos: eventosVisuales,
      resumenDiario,
      resumenEstacionamientos,
      selectedScope,
      selectedEventId,
      search,
      personas,
      resumenSeleccion,
      vehicleDetail,
    });
  } catch (error) {
    console.error('[encargadoController.encargadoDashboard]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible cargar el panel de encargado.';
    return res.redirect('/');
  }
}

export async function registrarPersona(req, res) {
  try {
    const {
      tipo_documento,
      numero_documento,
      nombre_completo,
      correo,
      telefono,
      scope,
      evento_id,
      glosa_visita,
      tipo_llegada,
      patente,
      marca,
      modelo,
      color,
      requiere_estacionamiento,
      con_pasajero,
      tipo_documento_pasajero,
      numero_documento_pasajero,
      nombre_completo_pasajero,
      evento_id_pasajero,
    } = req.body;

    const unidadId = req.session.user.unidad_id;
    const plan = buildEncargadoRegistration({
      tipo_documento,
      numero_documento,
      nombre_completo,
      correo,
      telefono,
      scope,
      return_scope: req.body.return_scope,
      evento_id,
      glosa_visita,
      tipo_llegada,
      patente,
      marca,
      modelo,
      color,
      requiere_estacionamiento,
      con_pasajero,
      tipo_documento_pasajero,
      numero_documento_pasajero,
      nombre_completo_pasajero,
      evento_id_pasajero,
    });

    if (plan.errors.length) {
      req.session.error = plan.errors[0];
      return res.redirect('/encargado');
    }

    const {
      selectedScope,
      eventoId,
      tipoDocumento,
      tipoLlegada,
      passengerRequested,
      passengerTipoDocumento,
      passengerEventId,
      parkingRequested,
    } = plan;

    let parkingToOccupy = null;
    if (parkingRequested && selectedScope === 'evento') {
      parkingToOccupy = await findAvailableParkingForUnidad(eventoId, unidadId);
      if (!parkingToOccupy) {
        req.session.error = 'No hay estacionamientos disponibles para su unidad en este evento.';
        return res.redirect('/encargado');
      }
    }

    const existingPerson = await findPersonByDocumento(tipoDocumento, numero_documento);
    let personaId = existingPerson?.id || null;

    if (existingPerson) {
      await updatePerson(existingPerson.id, {
        tipo_documento: tipoDocumento,
        numero_documento,
        nombre_completo,
        correo,
        telefono,
        estado: 'ACTIVA',
      });
      personaId = existingPerson.id;
    } else {
      personaId = await createPerson({
        tipo_documento: tipoDocumento,
        numero_documento,
        nombre_completo,
        correo,
        telefono,
      });
    }

    const mainParticipationData = buildMainParticipation(selectedScope, eventoId, unidadId, req.session.user.id, glosa_visita);
    const existingMainParticipation = await findParticipacion(personaId, mainParticipationData.eventoId, mainParticipationData.tipoParticipacion);
    if (!existingMainParticipation) {
      await createParticipacion({
        personaId,
        eventoId: mainParticipationData.eventoId,
        unidadId: mainParticipationData.unidadId,
        tipoParticipacion: mainParticipationData.tipoParticipacion,
        glosa: mainParticipationData.glosa,
        registradoPor: mainParticipationData.registradoPor,
      });
    } else {
      await updateParticipacion(existingMainParticipation.id, {
        eventoId: mainParticipationData.eventoId,
        unidadId: mainParticipationData.unidadId,
        tipoParticipacion: mainParticipationData.tipoParticipacion,
        glosa: mainParticipationData.glosa,
        estado: 'PENDIENTE',
      });
    }

    let vehiculoId = null;
    if (tipoLlegada === 'VEHICULO_PROPIO') {
      vehiculoId = await findOrCreateVehiculo({
        patente,
        marca,
        modelo,
        color,
        conductorId: personaId,
      });
    }

    await upsertTransporte({
      personaId,
      vehiculoId,
      tipoLlegada,
      conductorId: tipoLlegada === 'VEHICULO_PROPIO' ? personaId : null,
      documentoConductor: numero_documento,
    });

    if (parkingToOccupy) {
      await occupyParkingSpace(parkingToOccupy.id);
    }

    const cierreId = await getOrCreateTodayClosure(req.session.user.id);
    const participacionActual = await findParticipacion(personaId, mainParticipationData.eventoId, mainParticipationData.tipoParticipacion);
    await createHistorialVisita({
      cierreId,
      personaId,
      participacionId: participacionActual?.id || existingMainParticipation?.id || null,
      nombrePersona: nombre_completo,
      documento: numero_documento,
      unidad: req.session.user.unidad_nombre || 'Sin unidad',
      motivo: mainParticipationData.tipoParticipacion === 'VISITA_DIARIA' ? (glosa_visita || 'Visita diaria') : 'Registro de evento',
      tipoLlegada,
      patente: patente || null,
      horaIngreso: new Date(),
      horaSalida: null,
      usuarioId: req.session.user.id,
      detalle: 'Registro generado por encargado.',
    });

    if (passengerRequested) {
      const passengerExisting = await findPersonByDocumento(passengerTipoDocumento, numero_documento_pasajero);
      let passengerPersonId = passengerExisting?.id || null;

      if (passengerExisting) {
        await updatePerson(passengerExisting.id, {
          tipo_documento: passengerTipoDocumento,
          numero_documento: numero_documento_pasajero,
          nombre_completo: nombre_completo_pasajero,
          correo: null,
          telefono: null,
          estado: 'ACTIVA',
        });
        passengerPersonId = passengerExisting.id;
      } else {
        passengerPersonId = await createPerson({
          tipo_documento: passengerTipoDocumento,
          numero_documento: numero_documento_pasajero,
          nombre_completo: nombre_completo_pasajero,
          correo: null,
          telefono: null,
        });
      }

      const passengerParticipationData = buildPassengerParticipation(passengerEventId, unidadId, req.session.user.id);
      const passengerParticipation = await findParticipacion(passengerPersonId, passengerParticipationData.eventoId, passengerParticipationData.tipoParticipacion);
      const passengerParticipationId = passengerParticipation?.id || await createParticipacion({
        personaId: passengerPersonId,
        eventoId: passengerParticipationData.eventoId,
        unidadId: passengerParticipationData.unidadId,
        tipoParticipacion: passengerParticipationData.tipoParticipacion,
        glosa: passengerParticipationData.glosa,
        registradoPor: passengerParticipationData.registradoPor,
      });

      await createHistorialVisita({
        cierreId,
        personaId: passengerPersonId,
        participacionId: passengerParticipationId,
        nombrePersona: nombre_completo_pasajero,
        documento: numero_documento_pasajero,
        unidad: req.session.user.unidad_nombre || 'Sin unidad',
        motivo: 'Pasajero registrado por encargado.',
        tipoLlegada: 'A_PIE',
        horaIngreso: new Date(),
        horaSalida: null,
        usuarioId: req.session.user.id,
        detalle: 'Pasajero independiente asociado a evento.',
      });
    }

    req.session.success = 'Persona registrada correctamente.';
    return res.redirect(selectedScope === 'diaria' ? '/encargado?scope=diaria' : `/encargado?scope=evento&evento_id=${eventoId}`);
  } catch (error) {
    console.error('[encargadoController.registrarPersona]', {
      route: req.originalUrl,
      role: req.session.user?.rol,
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible guardar la informacion.';
    return res.redirect('/encargado');
  }
}
