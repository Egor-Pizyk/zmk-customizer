# Data model

Persistent Project/Wiring/Wire unchanged. Route tree wire starts at a key-pin and ends at another key-pin, except exactly one output lead per used terminal with a free terminalId endpoint. Terminal order continues to define electrical row/column indices. Temporary routing context: contact positions, intended net label per wire, candidate path/cost. No retained caches or schema version changes.
