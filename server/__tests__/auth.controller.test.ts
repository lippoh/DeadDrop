// __tests__/auth.controller.test.ts
import request from "supertest";
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import bcrypt from "bcryptjs";

describe("Auth Controller", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user and return 201", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "StrongPassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.username).toBe("testuser");
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "testuser" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 409 for duplicate username", async () => {
      await prisma.user.create({
        data: {
          username: "existinguser",
          email: "existing@example.com",
          password: await bcrypt.hash("SomePassword123!", 12),
        },
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "existinguser",
          email: "new@example.com",
          password: "StrongPassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 with tokens on valid credentials", async () => {
      await prisma.user.create({
        data: {
          username: "logintest",
          email: "login@example.com",
          password: await bcrypt.hash("correctpass", 12),
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "logintest", password: "correctpass" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should return 401 for wrong password", async () => {
      await prisma.user.create({
        data: {
          username: "logintest2",
          email: "login2@example.com",
          password: await bcrypt.hash("correctpass", 12),
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "logintest2", password: "wrongpass" });

      expect(res.status).toBe(401);
    });

    it("should return 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "ghost", password: "anypass" });

      expect(res.status).toBe(401);
    });
  });
});