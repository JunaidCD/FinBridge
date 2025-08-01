import { User, InsertUser } from "@shared/schema.js";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export class IStorage {
  async getUser(id) {}
  async getUserByUsername(username) {}
  async createUser(user) {}
}

export class MemStorage extends IStorage {
  constructor() {
    super();
    this.users = new Map();
  }



  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
