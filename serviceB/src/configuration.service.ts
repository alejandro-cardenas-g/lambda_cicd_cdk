import { z } from "zod";

export class ConfigurationService {
  public readonly reservationQueue: string;

  constructor() {
    const validator = z.object({
      reservationQueue: z.url(),
    });

    const validatedInputs = validator.parse({
      reservationQueue: process.env.SQS_RESERVATION_QUEUE,
    });

    this.reservationQueue = validatedInputs.reservationQueue;
  }
}
