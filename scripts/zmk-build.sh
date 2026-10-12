#!/usr/bin/env bash
set -euo pipefail
mkdir -p /logs /artifacts /workspace/manifest
[ "${ZEPHYR_VERSION}" = "${ZMK_BUILD_ZEPHYR_VERSION}" ]
[ -d "/opt/zephyr-sdk-${ZMK_BUILD_SDK_VERSION}" ]
cp /zmk-west.yml /workspace/manifest/west.yml
if [ ! -d .west ]; then west init -l manifest; fi
west config manifest.path manifest
west update --fetch-opt=--filter=tree:0 2>&1 | tee /logs/west-update.log
[ "$(git -C zmk rev-parse HEAD)" = "${ZMK_BUILD_REVISION}" ]
[ "$(git -C zephyr rev-parse HEAD)" = "${ZMK_BUILD_ZEPHYR_REVISION}" ]
west zephyr-export
python3 - <<'PYFREEZE' > /artifacts/west-frozen.yml
from west.manifest import Manifest
import yaml
manifest = Manifest.from_file()
data = manifest.as_dict()
data['manifest']['projects'] = [dict(p.as_dict(), revision=p.sha('HEAD')) for p in manifest.projects[1:] if manifest.is_active(p)]
print(yaml.safe_dump(data, sort_keys=False))
PYFREEZE
{
  git -C zmk rev-parse HEAD
  git -C zephyr rev-parse HEAD
  west --version
  cat "/opt/zephyr-sdk-${ZMK_BUILD_SDK_VERSION}/sdk_version"
  env | sort | grep '^ZMK_BUILD_\|^ZEPHYR_VERSION='
} > /artifacts/environment.txt
python3 - <<'PY' > /workspace/targets.tsv
import json
for target in json.load(open('/exports/targets.json')):
    print(target['id'], target['board'], target['shield'], sep='\t')
PY
while IFS=$'\t' read -r target board shield; do
  export_path="/exports/${target}"
  build_path="/workspace/build/${target}"
  west build -p always -s zmk/app -d "${build_path}" -b "${board}" -- \
    "-DSHIELD=${shield}" "-DZMK_CONFIG=${export_path}/config" "-DZMK_EXTRA_MODULES=${export_path}" \
    2>&1 | tee "/logs/${target}.log"
  mkdir -p "/artifacts/${target}"
  for file in .config zephyr.dts zmk.uf2 zmk.bin; do
    if [ -f "${build_path}/zephyr/${file}" ]; then cp "${build_path}/zephyr/${file}" "/artifacts/${target}/${file}"; fi
  done
done < /workspace/targets.tsv
read -r target board shield < <(head -n 1 /workspace/targets.tsv)
rm -rf /workspace/negative-export
cp -R "/exports/${target}" /workspace/negative-export
python3 - <<'PY'
from pathlib import Path
path = next(Path('/workspace/negative-export/boards/shields').glob('*/*.overlay'))
text = path.read_text()
assert '&pro_micro' in text
path.write_text(text.replace('&pro_micro', '&audit_missing_connector', 1))
PY
if west build -p always -s zmk/app -d /workspace/build/negative -b "${board}" -- \
  "-DSHIELD=${shield}" -DZMK_CONFIG=/workspace/negative-export/config -DZMK_EXTRA_MODULES=/workspace/negative-export \
  > /logs/negative-connector.log 2>&1; then
  echo 'ERROR: invalid connector unexpectedly compiled' >&2
  exit 1
fi
if ! grep -q 'audit_missing_connector' /logs/negative-connector.log; then
  cat /logs/negative-connector.log >&2
  echo 'ERROR: negative build failed without the intended connector diagnostic' >&2
  exit 1
fi
echo 'PASS: eight actual-export builds and intentional connector rejection'
