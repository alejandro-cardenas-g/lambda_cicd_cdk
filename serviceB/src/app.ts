import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";

import { Container, Reservation } from "./type.js";

const ReservationValidator = z.object({
  roomId: z.uuidv4(),
  userId: z.uuidv4(),
});

const ReservationsValidator = z
  .array(ReservationValidator)
  .min(1, "At least one reservation is required")
  .max(10, "Maximum 10 reservations per request");

export const createHandler = (container: Container): APIGatewayProxyHandler => {
  return async (event) => {
    const route = `${event.httpMethod} ${event.path}`;

    try {
      switch (route) {
        case "GET /users": {
          const users = await container.userService.getUsers();

          return {
            statusCode: 200,
            body: JSON.stringify({
              users,
            }),
          };
        }

        case "GET /rooms": {
          const rooms = await container.roomService.getRooms();

          return {
            statusCode: 200,
            body: JSON.stringify({
              rooms,
            }),
          };
        }

        case "POST /book": {
          const body = parseBody(event.body);

          const reservation: Reservation = ReservationValidator.parse(body);

          await container.reservationService.createReservation(reservation);

          return {
            statusCode: 201,
            body: JSON.stringify({}),
          };
        }

        case "POST /book-massive": {
          const body = parseBody(event.body) as Record<string, unknown>;

          const reservations: Reservation[] = ReservationsValidator.parse(
            body?.reservations,
          );

          await container.reservationService.createMassiveReservation(
            reservations,
          );

          return {
            statusCode: 201,
            body: JSON.stringify({}),
          };
        }

        default:
          return {
            statusCode: 404,
            body: JSON.stringify({
              message: "Route not found",
            }),
          };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid request",
            errors: error.issues,
          }),
        };
      }

      if (error instanceof SyntaxError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid JSON body",
          }),
        };
      }

      console.error("Unexpected error:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Unexpected error",
        }),
      };
    }
  };
};

function parseBody(body: string | null): unknown {
  if (!body) {
    throw new SyntaxError("Request body is required");
  }

  return JSON.parse(body);
}
