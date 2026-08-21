import { SQSClient } from "@aws-sdk/client-sqs";
import { createHandler } from "./app.js";
import { Container } from "./type.js";
import { UserService } from "./user.service.js";
import { RoomService } from "./room.service.js";
import { ReservationService } from "./reservation.service.js";
import { ConfigurationService } from "./configuration.service.js";

const sqsClient = new SQSClient();
const configuration = new ConfigurationService();
const roomService = new RoomService();
const userService = new UserService();
const reservationService = new ReservationService(sqsClient, configuration);

const container: Container = {
  userService,
  roomService,
  reservationService,
  configurationService: configuration,
};

export const handler = createHandler(container);
