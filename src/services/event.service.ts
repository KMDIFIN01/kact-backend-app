import prisma from '@config/database';
import { NotFoundError } from '@utils/errors';

interface CreateEventInput {
  programmeName: string;
  programmeType: string;
  date: string;
  time?: string;
  location?: string;
  comments?: string;
}

interface UpdateEventInput {
  programmeName: string;
  programmeType: string;
  date: string;
  time?: string;
  location?: string;
  comments?: string;
}

const eventSelect = {
  id: true,
  programmeName: true,
  programmeType: true,
  date: true,
  time: true,
  location: true,
  comments: true,
  createdAt: true,
  updatedAt: true,
};

export class EventService {
  async getAll() {
    return prisma.event.findMany({
      orderBy: { date: 'asc' },
      select: eventSelect,
    });
  }

  async createEvent(data: CreateEventInput) {
    return prisma.event.create({
      data: {
        programmeName: data.programmeName,
        programmeType: data.programmeType,
        date: data.date,
        time: data.time || null,
        location: data.location || null,
        comments: data.comments || null,
      },
      select: eventSelect,
    });
  }

  async updateEvent(id: string, data: UpdateEventInput) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Event not found');

    return prisma.event.update({
      where: { id },
      data: {
        programmeName: data.programmeName,
        programmeType: data.programmeType,
        date: data.date,
        time: data.time || null,
        location: data.location || null,
        comments: data.comments || null,
      },
      select: eventSelect,
    });
  }

  async deleteEvent(id: string) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Event not found');

    await prisma.event.delete({ where: { id } });
  }
}
