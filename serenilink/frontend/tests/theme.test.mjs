import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { applyTheme, readTheme } from "../src/utils/theme.js";

function browser(saved) {
  const values = new Map(saved === undefined ? [] : [["theme", saved]]);
  const classes = new Set(["other-page-class"]);
  return {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    document: {
      body: { classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) } },
      documentElement: { style: {} },
    },
    classes,
  };
}

test("light selection survives reload and only an explicit dark selection replaces it", () => {
  const env = browser();
  globalThis.localStorage = env.localStorage;
  globalThis.document = env.document;
  assert.equal(readTheme(), "dark");
  applyTheme("light");
  assert.equal(readTheme(), "light");
  applyTheme(readTheme());
  assert.deepEqual([...env.classes], ["other-page-class", "light"]);
  assert.equal(env.document.documentElement.style.colorScheme, "light");
  applyTheme("invalid");
  assert.equal(readTheme(), "light");
  applyTheme("dark");
  assert.equal(readTheme(), "dark");
  assert.deepEqual([...env.classes], ["other-page-class", "dark"]);
});

test("invalid or blocked storage cannot crash theme initialization or switching", () => {
  const env = browser("unexpected-value");
  globalThis.document = env.document;
  globalThis.localStorage = env.localStorage;
  assert.equal(readTheme(), "dark");
  globalThis.localStorage = {
    getItem() { throw new Error("Storage blocked"); },
    setItem() { throw new Error("Storage blocked"); },
  };
  assert.equal(readTheme(), "dark");
  assert.doesNotThrow(() => applyTheme("light"));
  assert.ok(env.classes.has("light"));
});

test("HTML bootstrap restores the saved theme before React, including direct page loads", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.ok(html.indexOf(script) < html.indexOf('id="root"'));
  for (const saved of ["light", "dark", undefined, "invalid"]) {
    const env = browser(saved);
    runInNewContext(script, env);
    const expected = saved === "light" ? "light" : "dark";
    assert.ok(env.classes.has(expected));
    assert.equal(env.document.documentElement.style.colorScheme, expected);
  }
  const env = browser();
  Object.defineProperty(env, "localStorage", { get() { throw new Error("Storage blocked"); } });
  assert.doesNotThrow(() => runInNewContext(script, env));
  assert.ok(env.classes.has("dark"));
});
