# LiveWire controlled release ledger — 2026-08-04

## Verdict

**FAIL — stopped safely before Production.** The exact flag-free release artifact was rejected by the Sites deployment transformation with the same message previously returned for an artifact that explicitly contained `nodejs_compat`.

No eBay mutation was attempted. Production remains on its prior operationally degraded release.

## Frozen candidate

| Evidence | Result |
| --- | --- |
| Source commit | `17362a3061e17048439ca9b5966683410db75be4` |
| Branch source pushed | Sites `main` and GitHub `main` |
| Clean checkout | Detached worktree; `git status --porcelain=v1` empty before build and packaging |
| Build | `npm.cmd run build` — PASS |
| Automated tests | `node --test tests/*.test.mjs` — 34 passed, 0 failed |
| Generated compatibility date | `2026-05-15` |
| Generated JSON | Valid UTF-8, no BOM |
| Generated compatibility metadata | No `nodejs_compat`; no `compatibility_flags` property |
| Official packaging | Sites `package-site.sh` — PASS |
| Package required entries | `dist/server/index.js` and `dist/.openai/hosting.json` present |
| Full staged-package scan | No `nodejs_compat` or `compatibility_flags` match |
| Local package SHA-256 | `38503A55E43E59B4DC73F30139BDB4EF8B519ADEA70BA733FD452371D4958EA8` |
| Sites stored content hash | `sha256:ac46ea333b82a263a5bb74e3393ade2e78cb8b28461fb2dc974057be476f4e2d` |
| Saved Sites version | Version 51, `appgprj_6a68edb61e308191b8abd4ff66ee5660~appgver_e97642836cd881918dbd5ee5463f743f` |
| Deployment | `appgdep_6a71378e62f88191873315155b30c5cc` — FAILED |
| Environment revision | `5` |
| Failure time | `2026-08-04T00:51:36.890563+00:00` |
| Exact failure | `The compatibility flag nodejs_compat became the default as of 2026-08-04 so does not need to be specified anymore.` |

## Paired validator evidence

### Case A — explicit flag, expected rejection

- Source commit: `6b00f319233a2d9edfa1d242b9b3a12a320d32d1`
- Local package SHA-256: `338982E9758AE73B987CF96F967809190D8E95B5D82CE0121BDCD72A497B9B0C`
- Generated JSON: valid UTF-8, no BOM
- Compatibility date: `2026-05-15`
- Compatibility flags: `nodejs_compat`
- Saved Sites version: version 48, `appgprj_6a68edb61e308191b8abd4ff66ee5660~appgver_70186dcde35c81918b08cd2a433c7990`
- Deployment: `appgdep_6a712c2f74c48191bc3de86a05644546`
- Environment revision: `5`
- Failed at `2026-08-04T00:03:04.000274+00:00`
- Validator message: identical to the version 51 failure

### Case B — flag-free artifact, incorrect rejection

- Source commit, generated configuration, package hash, saved version, deployment, environment revision, timestamp, and exact failure are recorded in the frozen-candidate table above.
- The clean build initially emitted an empty `compatibility_flags: []` property. The release build now removes only that empty property deterministically, fails rather than erasing any non-empty flags, emits BOM-free UTF-8, and verifies the result before packaging.
- The official package was created after that verification and was not edited afterward.

## Exposed Sites project metadata

- Project: `appgprj_6a68edb61e308191b8abd4ff66ee5660`
- Status: active
- Access: custom; current user is owner
- Live URL: `https://live-wire-listing-studio.thewiresarealive.chatgpt.site`
- Runtime environment revision: `5`, last updated `2026-08-02T20:40:41.800061+00:00`
- Runtime keys are present for eBay client ID, client secret, environment, marketplace, RuName, and OpenAI API key. Secret values were not read or recorded.

## Advancement gates

| Gate | State |
| --- | --- |
| Built | PASS |
| Automated tests | PASS |
| Package verified | PASS |
| Deployment succeeded | **FAIL** |
| Intended version confirmed in Production | NOT RUN |
| Signed-in visual QA | NOT RUN |
| Non-publishing workflow | NOT RUN |
| Canary | NOT RUN — requires explicit user approval |
| Batch readiness | NOT EARNED |

## Stop conditions and next action

- Do not retry version 51 or any earlier failed saved version.
- Do not modify or publish an eBay offer while deployment is blocked.
- Escalate to the Sites deployment owner with this ledger and the two paired cases.
- After the deployment transformation is corrected, save a new version from a newly frozen exact commit and resume at the deployment gate.
- Browser-based Release Steward qualification, fresh-batch testing, rollback/schema verification, signed-in Production QA, and the canary remain mandatory after deployment succeeds.

## Support escalation

- Submitted through authenticated OpenAI Help Center support with the project, saved version, deployment, environment revision, exact validator error, paired explicit-flag/flag-free evidence, and this ledger.
- Support status: escalated to a support specialist.
- Support expectation: a response in the coming days; replies will also be sent by email.
- Deployment retries remain stopped while the specialist case is pending.
