const request = require("supertest");
const app = require("../src/server");

describe("Report endpoints", () => {
  test("GET /api/reports/weekly-revenue returns success and array", async () => {
    const res = await request(app).get("/api/reports/weekly-revenue");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/reports/sales-by-species returns success and array", async () => {
    const res = await request(app).get("/api/reports/sales-by-species?limit=3");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/reports/summary without params returns 400", async () => {
    const res = await request(app).get("/api/reports/summary");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });
});
