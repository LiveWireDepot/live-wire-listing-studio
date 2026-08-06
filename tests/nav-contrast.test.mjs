import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("active studio navigation stays visible in dark mode",async()=>{
  const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8");
  const css=await readFile(new URL("../app/nav-contrast.css",import.meta.url),"utf8");
  assert.match(layout,/nav-contrast\.css/);
  assert.match(css,/\.navlinks a\.active/);
  assert.match(css,/background:#f28a42/);
  assert.match(css,/color:#17110d/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/html\[data-theme="dark"\]/);
});
