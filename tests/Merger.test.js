const Merger = require("../build/Merger").Merger;

test("Basic sanity check", () => {
  const fake_data = {
    source_a: ["1", "2", "3"],
    source_b: ["4", "5", "6"],
    source_c: ["7", "8", "9"],
  };
  const merger = new Merger();
  const result = merger.run(fake_data, 5);
  expect(Array.isArray(result)).toBeTruthy();
  expect(result.length).toEqual(5);
  for (const i of result) {
    expect(typeof i).toEqual("string");
    expect(Number(i)).toBeGreaterThan(0);
    expect(Number(i)).toBeLessThan(10);
  }
});
