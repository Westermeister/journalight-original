const fs = require("fs");

const Archiver = require("../build/Archiver").Archiver;

test("Add posts to archive", () => {
  if (fs.existsSync("./.archive.sqlite")) {
    fs.rmSync("./.archive.sqlite");
  }

  const a = new Archiver();
  const fake_feed = ["a", "b", "c", "d"];
  const result = a.run(fake_feed);
  expect(result).toEqual(fake_feed);

  fs.rmSync("./.archive.sqlite");
});

test("Detect posts already in archive", () => {
  if (fs.existsSync("./.archive.sqlite")) {
    fs.rmSync("./.archive.sqlite");
  }

  const a = new Archiver();
  let fake_feed = ["a", "b", "c", "d"];
  a.run(fake_feed);

  fake_feed = ["e", "f", "c", "d"];
  const result = a.run(fake_feed);
  expect(result).toEqual(["e", "f"]);

  fs.rmSync("./.archive.sqlite");
});

test("Repeatedly add lots of batches of posts", () => {
  if (fs.existsSync("./.archive.sqlite")) {
    fs.rmSync("./.archive.sqlite");
  }

  const a = new Archiver();
  for (let i = 0; i < 10; ++i) {
    const fake_feed = [];
    for (let j = i * 100; j < i * 100 + 100; ++j) {
      fake_feed.push(j.toString());
    }
    a.run(fake_feed);
  }

  const extra_data = ["1", "2", "1000", "1001", "1002", "1003"];
  const result = a.run(extra_data);
  expect(result).toEqual(["1000", "1001", "1002", "1003"]);
  fs.rmSync("./.archive.sqlite");
});
