/**
 * Debug Report Summary
 */

const Report = require("./src/models/report.model.supabase");

async function debugSummary() {
  console.log("🔍 Debugging Report Summary...\n");

  try {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    console.log(`Date range: ${startDate} to ${today}\n`);

    const result = await Report.getReportSummaryWithComparison(
      startDate,
      today,
    );

    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
    console.error(error.stack);
  }
}

debugSummary()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
