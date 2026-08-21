import { ConfigurationService } from "./configuration.service.js";
import { ReservationService } from "./reservation.service.js";
import { RoomService } from "./room.service.js";
import { UserService } from "./user.service.js";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Room = {
  id: string;
  name: string;
};

export type Reservation = {
  userId: string;
  roomId: string;
};

export type Container = {
  userService: UserService;
  roomService: RoomService;
  reservationService: ReservationService;
  configurationService: ConfigurationService;
};
