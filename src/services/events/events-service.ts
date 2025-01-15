import { customAlphabet } from "nanoid";
import { eventsModel } from "../../models/events/events-schema";
import { queryBuilder } from "src/utils";

export interface Event {
  _id?: string;
  identifier: string;
  image: string;
  name: string;
  description: string;
}

export const createEvent = async (eventData: Event): Promise<Event> => {
  const identifier = customAlphabet("0123456789", 3);
  eventData.identifier = identifier();
  const event = new eventsModel(eventData);
  const savedEvent = await event.save();
  const res = savedEvent.toObject() as unknown as Event;
  return res;
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  return await eventsModel.findById(eventId);
};

export const updateEvent = async (
  eventId: string,
  eventData: Event
): Promise<Event | null> => {
  return await eventsModel.findByIdAndUpdate(eventId, eventData, { new: true });
};

export const deleteEvent = async (eventId: string): Promise<Event | null> => {
  return await eventsModel.findByIdAndDelete(eventId);
};

export const getAllEvents = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1
  const limit = parseInt(payload.limit as string) || 0
  const offset = (page - 1) * limit
  const { query, sort } = queryBuilder(payload, ['name'])
 
  const totalDataCount = Object.keys(query).length < 1 ? await eventsModel.countDocuments() : await eventsModel.countDocuments(query)
  const results = await eventsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v")
  if (results.length) return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results
  }
  else {
      return {
          data: [],
          page,
          limit,
          success: false,
          total: 0
      }
  }
}
