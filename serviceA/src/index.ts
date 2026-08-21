import type { SQSEvent, SQSBatchResponse } from "aws-lambda";

import { serviceA } from "./service.js";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  console.log(`Processing ${event.Records.length} messages`);

  const failedMessageIds: string[] = [];

  for (const record of event.Records) {
    try {
      console.log("Message:", record.body);

      const resource = serviceA.getResources();

      console.log({
        messageId: record.messageId,
        resource,
      });
    } catch (error) {
      console.error({
        messageId: record.messageId,
        error,
      });

      // Fallará solamente este mensaje
      failedMessageIds.push(record.messageId);
    }
  }

  return {
    batchItemFailures: failedMessageIds.map((messageId) => ({
      itemIdentifier: messageId,
    })),
  };
};
