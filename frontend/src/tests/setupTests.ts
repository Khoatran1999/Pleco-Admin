import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll } from "vitest";

// MSW setup
import { setupServer } from "msw/node";
import { rest } from "msw";

const server = setupServer(
  // default handlers for report endpoints
  rest.get(
    "http://localhost:5000/api/reports/weekly-revenue",
    (req, res, ctx) => {
      return res(ctx.json({ success: true, data: [] }));
    },
  ),
  rest.get(
    "http://localhost:5000/api/reports/sales-by-species",
    (req, res, ctx) => {
      return res(ctx.json({ success: true, data: [] }));
    },
  ),
  rest.get("http://localhost:5000/api/reports/summary", (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({ success: false, message: "Date range is required" }),
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
