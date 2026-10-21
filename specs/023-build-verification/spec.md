# Feature 023: Build verification

## User story (P1)

Разработчик запускает make zmk-build локально и получает доказательство, что фактический export текущих generators собирается upstream ZMK v0.3 без ручных правок. По решению владельца от 2026-10-21 сборка прошивки выполняется только локально, вне CI и обязательных GitHub checks. Для изменений generators/export результат локального make zmk-build записывается в evidence.

## Requirements and acceptance

- Генерировать реальные repository files из UNIBODY_PRESET, вариаций всех четырёх current controller targets и обеих diode directions. USB-only variants явно заменяют неподдерживаемый BT binding; геометрия и custom tap-dance/mod-morph остаются.
- Компилировать matrix из восьми targets без правок generated files. Применять config и zephyr/module.yml из фактического export.
- Pin ZMK commit edf5c0814fd3ea202e43aad2d68fd32e882a518c, Zephyr из pinned manifest, SDK/build image digest; record frozen west manifest/environment.
- Отдельная negative copy меняет connector на отсутствующий label. Проверка обязана подтвердить именно Devicetree rejection, а не произвольный nonzero exit.
- Logs, .config, zephyr.dts, firmware сохраняются как локальные developer artifacts. Окружение фиксируется image/manifest/tooling pins. Generated workspace/artifacts не коммитятся.
- Нет изменений browser product и новых runtime dependencies. Golden/upstream fixtures не редактируются.

## Success criteria

Восемь actual output builds проходят; malformed connector отклоняется ожидаемой диагностикой; make check проходит. Работа закрывает A09 audit 024, не расширяет generator features.
