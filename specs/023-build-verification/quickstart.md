# Validation

`make install`, then `make zmk-build`. Docker downloads the digest-pinned official environment; west initializes an isolated cached workspace. Eight generated configs compile sequentially, then a malformed connector copy must fail with its missing-label diagnostic. Artifacts and environment/frozen manifest are in .zmk-build/artifacts; logs in .zmk-build/logs. `make check` validates the existing application. No browser or in-product firmware build is involved.

## Verified locally

`make zmk-build`: PASS, 8/8 exports compiled; intentional `audit_missing_connector` rejected by Devicetree. `make check`: PASS, 138 files / 859 tests, coverage floors unchanged. CI workflow is configured; no remote CI run is claimed. Logs and build artifacts are under ignored `.zmk-build/logs` and `.zmk-build/artifacts`.
