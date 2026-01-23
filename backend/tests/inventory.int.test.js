const request = require("supertest");
const app = require("../src/server");

describe("Inventory endpoints", () => {
  test("GET /api/inventory returns success and array", async () => {
    const res = await request(app).get("/api/inventory");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.meta) {
      expect(typeof res.body.meta.total).toBe("number");
    }
  });

  test("GET /api/inventory/logs returns success and array", async () => {
    const res = await request(app).get("/api/inventory/logs?limit=5");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/inventory/total returns summary object", async () => {
    const res = await request(app).get("/api/inventory/total");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });
});

