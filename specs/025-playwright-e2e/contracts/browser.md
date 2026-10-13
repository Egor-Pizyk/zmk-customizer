# Browser test contract

All operations use roles/names or screen positions derived from actual displayed geometry. Gestures use mouse.move/down/intermediate moves/up. evaluate only observes geometry, computed paint, focus and saved data. No force, sleeps, mocks, event dispatch or direct state mutation. Fixture import uses file chooser/input boundary. Downloads are actual browser downloads. Pixel references are explicitly reviewed; failed references are not silently updated. Regression seeds run alone and restore original bytes in finally; a user assertion failure is required.
