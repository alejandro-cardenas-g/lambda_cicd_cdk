import { v4 } from "uuid";
import { Room } from "./type.js";

export class RoomService {
  private rooms: Room[];

  constructor() {
    const rooms: Room[] = Array.from({ length: 12 }).map((_, index) => ({
      id: v4(),
      name: "room" + (index + 1),
    }));
    this.rooms = rooms;
  }

  getRooms(): Room[] {
    return this.rooms;
  }
}
