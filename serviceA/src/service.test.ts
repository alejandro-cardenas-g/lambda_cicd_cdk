import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { serviceA } from "./service.js";

describe("service A test suite", () => {
  it("get at least one resource", () => {
    const resources = serviceA.getResources();
    assert.ok(resources.length > 0);
  });
});
