import {
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { v7 } from "uuid";
import { Reservation } from "./type.js";
import { ConfigurationService } from "./configuration.service.js";

export class ReservationService {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly configurationService: ConfigurationService,
  ) {}

  async createReservation(reservation: Reservation): Promise<void> {
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.configurationService.reservationQueue,
        MessageBody: JSON.stringify({ reservation }),
      }),
    );
  }

  async createMassiveReservation(reservations: Reservation[]): Promise<void> {
    await this.sqsClient.send(
      new SendMessageBatchCommand({
        QueueUrl: this.configurationService.reservationQueue,
        Entries: reservations.map((reservation) => ({
          Id: v7(),
          MessageBody: JSON.stringify({ reservation }),
        })),
      }),
    );
  }
}
