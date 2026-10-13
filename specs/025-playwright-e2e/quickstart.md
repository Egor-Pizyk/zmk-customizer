# Validation

`make test-e2e` builds production and runs Chromium plus focused Firefox/WebKit in the dedicated browser container. `npm run test:e2e -- --project=chromium` works after `npm ci` and `npx playwright install --with-deps` on supported hosts. `npm run test:e2e:types` checks browser test types. `make test-e2e-mutations` runs controlled regressions alone. Inspect `playwright-report/` and `test-results/`, or `npx playwright show-trace <trace.zip>`. Never refresh references without inspecting why paint changed. Finish with make check, production build and repeated E2E.
