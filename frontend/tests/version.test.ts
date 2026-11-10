import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { APP_VERSION } from "../src/lib/version.ts";
import { CHANGELOG, getCurrentRelease } from "../src/config/changelog.ts";

test("version matches package.json dynamically and changelog provides release notes", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(APP_VERSION, pkg.version, "APP_VERSION must match package.json version");

  assert.ok(CHANGELOG.length > 0, "CHANGELOG must have entries");
  const current = getCurrentRelease();
  assert.equal(current.version, APP_VERSION, "current release must match active version");
  assert.ok(current.title.length > 0, "current release must have a title");
  assert.ok(current.sections.length > 0, "current release must have sections");
  assert.ok(current.sections[0].items.length > 0, "current section must have items");

  // Fallback test for unknown / future version
  const fallback = getCurrentRelease("9.9.9");
  assert.equal(fallback.version, "9.9.9");
  assert.ok(fallback.sections.length > 0);
  assert.ok(fallback.sections[0].items.length > 0);
});
