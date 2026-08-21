import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { handler } from "./index.js";
import { SQSEvent } from "aws-lambda";

describe("service A test suite", () => {
  it("get at least one resource", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({}),
        },
      ],
    } as SQSEvent;

    const result = await handler(event);
    console.log(result.batchItemFailures.length === 0);
  });
});
