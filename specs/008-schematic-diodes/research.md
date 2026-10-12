# Research

- Decision: one optional diode on Key; rationale: one-per-switch invariant is structural. Alternative: independent diode collection needs dangling-reference checks.
- Decision: polarity relative to the switch, not screen coordinates. Current flows anode to cathode (docs/zmk/kscan.md). Away-switch: opposite pin → diode pin; toward-switch: diode pin → opposite pin. Row/column names do not exist yet.
- Decision: unchanged external nets and wire endpoints. Diode is in series with the switch, not a conductive junction between nets.
- Decision: schema v4; v3 migration changes the version only. Nested strict parsing rejects malformed diode values. Existing migrations remain unchanged.
- Decision: canvas toggles use native foreignObject buttons, table supplies keyboard path at all zooms. Same minimum zoom and screen size pattern as crossing buttons.
