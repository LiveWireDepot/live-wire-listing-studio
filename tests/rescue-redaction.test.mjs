import test from "node:test";
import assert from "node:assert/strict";
import {redact} from "../lib/rescue-redaction.mjs";
test("secret-shaped fields are redacted recursively",()=>assert.deepEqual(redact({clientSecret:"x",nested:{access_token:"y"},safe:"z"}),{clientSecret:"[REDACTED]",nested:{access_token:"[REDACTED]"},safe:"z"}));
