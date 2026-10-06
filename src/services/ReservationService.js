export class ReservationService {
  constructor({ reservationRepository, roomRepository }) {
    this.reservationRepository = reservationRepository;
    this.roomRepository = roomRepository;
  }
  async createReservation(reservationData) {
    const { roomId, userId, startDate, endDate, guestCount } = reservationData;

    if (!roomId || !userId || !startDate || !endDate || !guestCount) {
      throw new Error("Dados obrigatórios ausentes para a reserva.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Datas de início ou término inválidas.");
    }

    if (start >= end) {
      throw new Error("A data/hora de início deve ser anterior à data/hora de término.");
    }
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error("Sala/Recurso não encontrado.");
    }

    if (guestCount > room.capacity) {
      throw new Error(`
        A quantidade de pessoas (${guestCount}) excede a capacidade máxima da sala (${room.capacity}).
      `);
    }
    const existingReservations = await this.reservationRepository.findByRoomAndDateRange(
      roomId,
      start,
      end
    );

    const hasOverlap = existingReservations.some((existing) => {
      const existingStart = new Date(existing.startDate);
      const existingEnd = new Date(existing.endDate);
      return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
      throw new Error("Conflito de horário: A sala já possui uma reserva no período selecionado.");
    }
    return await this.reservationRepository.save({
      ...reservationData,
      startDate: start,
      endDate: end,
      status: "CONFIRMED",
      createdAt: new Date(),
    });
  }
}