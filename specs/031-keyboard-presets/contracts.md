# Preset creation contract

New → select preset → geometry/count/structure/limitations → QWERTY or empty → Create project from preset. Until Create, Project and history are unchanged. Save to file and Cancel remain available. Escape closes and focus returns to New. Creation resets history like existing New.

Preset data is trusted bundled data, not stored in Project. It contains stable id/name/description, split topology, ordered geometry keys and optional standard keycodes. Domain accepts data, controllerId and bindingMode; returns fresh schema-v11 Project. No parsing boundary is added. Empty mode has no binding entries; QWERTY uses kp with empty modifiers, one Base layer. New projects reset advanced collections, wires, diodes and firmware. Split includes topology metadata with empty terminals and explicit left/right keys; unibody omits wiring. Existing complete starter remains unchanged.

Preview has an accessible name and geometry details list, preserving key order, dimensions, origins, rotations and halves. Invalid project ZIP stays blocked by existing validation.
