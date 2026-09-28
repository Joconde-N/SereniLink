import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatApiError, normalizeApiError } from "../src/api/errors.js";
import { passwordError } from "../src/utils/password.js";
import api from "../src/api/axios.js";

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};

test("FastAPI validation objects render safely as readable form errors", () => {
  const detail = [{ type: "string_too_short", loc: ["body", "nickname"], msg: "Use at least 3 characters", input: "ab" }];
  const error = { response: { data: { detail }, status: 422 } };
  normalizeApiError(error);
  assert.equal(error.response.data.detail, "nickname: Use at least 3 characters");
  assert.equal(error.validationDetails, detail);
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement("p", null, error.response.data.detail)));
});

test("ordinary API errors remain readable; unexpected payloads get safe fallbacks", () => {
  assert.equal(formatApiError("Incorrect password"), "Incorrect password");
  assert.equal(formatApiError({ message: "Unavailable" }), "Unavailable");
  for (const value of [undefined, null, 42, {}, [{ input: { secret: "private" } }]]) {
    assert.equal(formatApiError(value), "Request failed. Please try again.");
  }
  assert.doesNotThrow(() => normalizeApiError(new Error("Network error")));
});

test("password UI uses the server strength rules", () => {
  for (const weak of ["Short1!", "lowercase9!", "MissingNumber!", "MissingSymbol9", " A1! "]) {
    assert.ok(passwordError(weak));
  }
  assert.equal(passwordError("Replacement9!"), "");
});

test("Axios catches validation arrays before an existing form renders them", async () => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  await assert.rejects(api.post("/auth/register", {}, { adapter: async (config) => {
    throw { config, response: { status: 422, data: { detail: [{ loc: ["body", "nickname"], msg: "Too short" }] } } };
  } }), (error) => {
    assert.equal(error.response.data.detail, "nickname: Too short");
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement("p", null, error.response.data.detail)));
    return true;
  });
});

test("Password change replaces tokens before the next request, preserving remember-me", async () => {
  for (const remember of [true, false]) {
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    const chosen = remember ? localStorage : sessionStorage;
    chosen.setItem("token", "old-token");
    await api.post("/auth/change-password", {}, { adapter: async (config) => ({
      config, status: 200, data: { access_token: "replacement" }, headers: {},
    }) });
    assert.equal(chosen.getItem("token"), "replacement");
    assert.equal((remember ? sessionStorage : localStorage).getItem("token"), null);
    await api.get("/auth/me", { adapter: async (config) => {
      assert.equal(config.headers.Authorization, "Bearer replacement");
      return { config, status: 200, data: {}, headers: {} };
    } });
  }
});
