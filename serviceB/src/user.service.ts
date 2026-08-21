import { v4 } from "uuid";
import { User } from "./type.js";

export class UserService {
  private users: User[];

  constructor() {
    const users: User[] = Array.from({ length: 10 }).map((_, index) => ({
      id: v4(),
      email: `email${index + 1}@example.com`,
      name: `persona${index + 1}`,
    }));
    this.users = users;
  }

  getUsers(): User[] {
    return this.users;
  }
}
