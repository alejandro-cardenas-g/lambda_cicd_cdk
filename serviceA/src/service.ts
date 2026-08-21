import { v7 } from "uuid";
import { Resource } from "./type.js";

class ServiceA {
  getResources(): Resource[] {
    return [
      {
        id: v7(),
        name: "item one",
        value: 12,
      },
    ];
  }
}

export const serviceA = new ServiceA();
