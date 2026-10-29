# Watch Studio

A standalone student watch-design review website. No connection, shared data, or dependencies on Project Showcase. Requires Node.js 24+; no npm packages or build step.

## Run

```sh
git clone https://github.com/wpywyd/watchRating.git
cd watchRating
npm start
```

Open http://localhost:3100 in your browser after starting the server. In VS Code, use File → Open Folder to open the cloned watchRating folder, then Terminal → New Terminal to run npm start.

Default: port 3100, loopback interface. `PORT` and `HOST` can override these. Camera capture requires HTTPS or localhost; upload works without camera permissions. Browser images are validated, resized to 1800px maximum, and converted to JPEG before submission. The UI accepts JPG, PNG, and WebP files up to 10 MB.

## Connect real AI scoring

For local use, copy `.env.example` to `.env` in the project folder, then enter your API key in that local file. `npm start` and `npm run dev` load it automatically, so you do not need to re-enter the key each time. In Windows PowerShell, use `npm.cmd start` if script execution is restricted.

`.env` is excluded from Git and is never served by the website. It stores the key as plain text on your computer: keep it private, and never upload it or include it in screenshots. Only `.env.example`, which contains no key, belongs in GitHub. Replace any key you have shared publicly or in chat.

Environment variables already set in your terminal take precedence over `.env`. If you previously entered an old key with `$env:WATCH_AI_KEY`, open a fresh terminal or run `Remove-Item Env:WATCH_AI_KEY -ErrorAction SilentlyContinue` before restarting.

Configuration options:

- `WATCH_AI_KEY`: API credential. Never put this in frontend code or commit it.
- `WATCH_AI_BASE_URL`: optional HTTPS OpenAI-compatible base URL, default `https://api.openai.com/v1`.
- `WATCH_AI_MODEL`: optional image-capable model supporting strict JSON-schema structured output, default `gpt-4.1-mini`.

The provider must implement `/chat/completions` with image input and strict `json_schema` response formatting. Allow the provider host (default `api.openai.com`) in environment network settings. The start scripts enable Node’s environment proxy support so inherited HTTPS proxy and CA settings are respected. The supplied key stays server-side. Without a key, upload and camera capture remain available and scoring is explicitly disabled; no fake ratings are generated.

The AI identifies the stage (sketch, model/prototype, or apparently finished watch) from the photo; students do not select it. The detected stage and visual reasoning appear in the review and downloaded feedback. If the stage cannot be determined, the AI reports uncertainty instead of forcing a choice. Stage detection and scoring share one AI request.

The four criteria contribute equally. A strict rubric breaks each criterion into four visible indicators, each earning 0–5 points; the server computes its score as `max(1, sum(points) * 5)`. The overall score is the rounded mean of the four criterion scores. A provider-supplied total cannot override this calculation. Competent (3/5) work earns 60, strong evidence is needed for 70+, and 90–100 is exceptional. The scoring instructions include criterion-specific indicators and require feedback to justify marks using visible evidence, without an arbitrary downward adjustment. Notes can clarify intent but do not earn credit for unsupported claims or writing quality. Obscured indicators use a provisional 2/5 with an explanation; an overall unjudgeable photo should be declined rather than scored.

The score bands are: 1–39 needs substantial development, 40–59 developing, 60–69 competent, 70–79 strong, 80–89 excellent, 90–100 exceptional. These calibrate AI judgement; live model accuracy and consistency still need evaluation against teacher-rated examples. Automated tests use a mocked provider and verify calculation and validation, not real-world model calibration. Non-watch submissions receive a request for a different photo instead of a score. Feedback highlights uncertainty; photos cannot establish comfort, durability, or functioning mechanisms. AI feedback is advisory, not a formal grade.

Photos and notes are processed in memory and are not saved by this app. On submission, they are sent to the configured AI provider, whose retention policy applies. Avoid student names and faces. Uploaded image metadata is not copied into the re-encoded JPEG.

## Validation

```sh
npm test
```

Tests cover API configuration, provider payloads with a mocked provider, equal weighting, invalid images and scores, cross-origin protection, non-watch handling, and safe provider errors. Real AI assessment requires a configured credential and is not verified by the mocked tests.

## Before public deployment

Use HTTPS and set appropriate access restrictions. This initial version is for a supervised classroom or local development: it has no accounts or persistent history. It limits simultaneous reviews, but is not a public quota-management system. Add authenticated access and durable per-user quotas before exposing a paid API to unrestricted traffic. No relation to the existing CEP repository; run it as its own Node process and deployment.
