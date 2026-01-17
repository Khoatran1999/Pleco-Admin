const base = "http://localhost:5000/api/reports";

async function check(url) {
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json || !json.success) {
      console.error("FAIL:", url, "response:", json);
      return false;
    }
    console.log("OK:", url);
    return true;
  } catch (err) {
    console.error("ERROR:", url, err.message);
    return false;
  }
}

(async () => {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 30);
  const start = startDate.toISOString().split("T")[0];

  const tests = [
    `${base}/summary?date_from=${start}&date_to=${end}`,
    `${base}/weekly-revenue`,
    `${base}/sales-by-species?limit=4`,
  ];

  let allOk = true;
  for (const t of tests) {
    const ok = await check(t);
    allOk = allOk && ok;
  }

  if (!allOk) process.exit(1);
  console.log("All smoke tests passed.");
})();
