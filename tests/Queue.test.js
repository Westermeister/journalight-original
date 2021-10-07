const Queue = require("../build/Queue").Queue;

test("Add items to queue", () => {
  const q = new Queue();
  q.enqueue("a");
  q.enqueue("b");
  q.enqueue("c");

  expect(q.storage.size).toBe(3);
  let has_a = false;
  let has_b = false;
  let has_c = false;
  for (let value of q.storage.values()) {
    if (value === "a") has_a = true;
    if (value === "b") has_b = true;
    if (value === "c") has_c = true;
  }
  expect(has_a).toBeTruthy();
  expect(has_b).toBeTruthy();
  expect(has_c).toBeTruthy();
});

test("Remove items from queue", () => {
  const q = new Queue();
  q.enqueue("a");
  q.enqueue("b");
  q.enqueue("c");

  let values = [];
  q.dequeue();
  expect(q.storage.size).toBe(2);
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeFalsy();
  expect(values.includes("b")).toBeTruthy();
  expect(values.includes("c")).toBeTruthy();

  values = [];
  q.dequeue();
  expect(q.storage.size).toBe(1);
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeFalsy();
  expect(values.includes("b")).toBeFalsy();
  expect(values.includes("c")).toBeTruthy();

  values = [];
  q.dequeue();
  expect(q.empty()).toBeTruthy;
});

test("Handle edge case with max possible index", () => {
  const q = new Queue();
  q.storage.set(Number.MAX_SAFE_INTEGER - 2, "a");
  q.head = Number.MAX_SAFE_INTEGER - 2;
  q.tail = Number.MAX_SAFE_INTEGER - 1;

  q.enqueue("b");
  q.enqueue("c");
  q.enqueue("d");
  expect(q.storage.size).toBe(4);

  let values = [];
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeTruthy();
  expect(values.includes("b")).toBeTruthy();
  expect(values.includes("c")).toBeTruthy();
  expect(values.includes("d")).toBeTruthy();

  values = [];
  q.dequeue();
  expect(q.storage.size).toBe(3);
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeFalsy();
  expect(values.includes("b")).toBeTruthy();
  expect(values.includes("c")).toBeTruthy();
  expect(values.includes("d")).toBeTruthy();

  values = [];
  q.dequeue();
  expect(q.storage.size).toBe(2);
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeFalsy();
  expect(values.includes("b")).toBeFalsy();
  expect(values.includes("c")).toBeTruthy();
  expect(values.includes("d")).toBeTruthy();

  values = [];
  q.dequeue();
  expect(q.storage.size).toBe(1);
  for (let value of q.storage.values()) values.push(value);
  expect(values.includes("a")).toBeFalsy();
  expect(values.includes("b")).toBeFalsy();
  expect(values.includes("c")).toBeFalsy();
  expect(values.includes("d")).toBeTruthy();

  q.dequeue();
  expect(q.empty()).toBeTruthy;
  expect(q.head).toBe(Number.MIN_SAFE_INTEGER + 2);
  expect(q.tail).toBe(Number.MIN_SAFE_INTEGER + 2);
});
