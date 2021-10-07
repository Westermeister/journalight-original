const Scraper = require("../build/Scraper").Scraper;

test("Scrape all sites within worst-case time limit", async () => {
  const scraper = new Scraper({ pbs: true, npr: true, upi: true });
  const data = await scraper.run();

  expect(Object.keys(data)).toHaveLength(3);

  expect(data).toHaveProperty("pbs");
  expect(data).toHaveProperty("npr");
  expect(data).toHaveProperty("upi");

  expect(Array.isArray(data.pbs)).toBeTruthy();
  expect(Array.isArray(data.npr)).toBeTruthy();
  expect(Array.isArray(data.upi)).toBeTruthy();

  expect(data.pbs.length).toBeGreaterThan(0);
  expect(data.npr.length).toBeGreaterThan(0);
  expect(data.upi.length).toBeGreaterThan(0);

  for (const site in data) {
    for (const obj of data[site]) {
      expect(Object.keys(obj)).toHaveLength(3);

      expect(obj).toHaveProperty("text");
      expect(typeof obj.text === "string").toBeTruthy();
      expect(obj.text.length).toBeGreaterThan(0);

      expect(obj).toHaveProperty("needs_summary");
      expect(typeof obj.needs_summary === "boolean").toBeTruthy();

      expect(obj).toHaveProperty("url");
      expect(typeof obj.url === "string").toBeTruthy();
      expect(obj.url).toContain(site);
    }
  }
}, 240e3);
/*
All the sites are scraped concurrently, so if they take times x_i, y_i, and z_i, we should have a runtime of max(i),
plus a constant for overhead cost. Right now, because of some randomness that the algorithm uses, the times can vary a
bit, so the total runtime will also vary. Currently, NPR takes the longest: in the worst case, about 220 seconds or so.
We'll give an extra 20 seconds just for good measure. If we take longer than that, something is likely wrong.
*/
