# Research

Official v0.3 reusable workflow uses zmk-build-arm and west build with ZMK_CONFIG and ZMK_EXTRA_MODULES for root zephyr/module.yml: https://github.com/zmkfirmware/zmk/blob/v0.3.0/.github/workflows/build-user-config.yml.
Pinned app/west.yml selects Zephyr v3.5.0+zmk-fixes: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/west.yml.
`docker buildx imagetools inspect zmkfirmware/zmk-build-arm:3.5`: multiarch digest sha256:0979a8de325e3d822e48bd8d1d9efaee2984ad3750253119f920a342f0ce5cde. Local image inspection: arm64; west 1.2.0; /opt/zephyr-sdk-0.16.3. Target image pin, not stable floating tag, controls CI environment.
Local existing workspace has exactly pinned ZMK SHA. Any seed is copied from a read-only mount into the new feature's own workspace, then verified/refreshed; another project's workspace is never mutated.

## Results

Local pinned run passed all eight actual generated exports and the intentional undefined connector failure. Zephyr commit dacab4875df72109b96cc8977547a0dc04875bcd; artifacts include frozen active dependency SHAs, SDK version, .config, zephyr.dts and firmware. No generator modifications were required.

The active resolved west manifest is committed as scripts/zmk-west.yml: every dependency including Zephyr uses its full commit SHA. Runner verifies both ZMK and Zephyr revisions; the manifest joins the CI cache key. This avoids relying on a mutable v3.5.0+zmk-fixes branch.
