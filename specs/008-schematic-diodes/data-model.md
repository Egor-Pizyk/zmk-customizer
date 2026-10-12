# Data model

Project.schemaVersion = 4. Key.diode is optional, absent means no diode.
Diode = { pin: 1 | 2, cathode: 'toward-switch' | 'away-switch' }.
Transitions: absent → selected pin/away-switch; same pin → absent; other pin → unchanged; reverse → opposite cathode. Wires, layers and key identity unchanged.
