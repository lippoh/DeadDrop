// __tests__/room.controller.test.ts
import request from "supertest";
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
 
describe("Room Controller", () => {
  let authToken: string;
  let userId: string;
 
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("testpass", 12);
    const user = await prisma.user.create({
      data: { username: 'testuser', email: 'test@example.com', password: passwordHash }
    });
    userId = user.id;
    authToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });
 
  afterAll(async () => {
    await prisma.$disconnect();
  });
 
  it("should create a new room and return 201", async () => {
    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Test Room" });
 
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Room");
    expect(res.body.members).toContain(userId);
  });
 
  it("should list rooms the user belongs to", async () => {
    const res = await request(app)
      .get("/api/rooms")
      .set("Authorization", `Bearer ${authToken}`);
 
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
