---
name: Firestore list validation budget
description: Why bounded lists of structured maps need maximum-size emulator tests.
---

Firestore Security Rules evaluate against a 1,000-expression ceiling. Repeating
full map-key and field validation across a list can exceed that ceiling even
when the list is explicitly bounded.

**Why:** Social-link validation compiled successfully but denied valid writes at
the maximum list size until the bound was reduced. Syntax validation alone did
not reveal the runtime expression-budget failure.

**How to apply:** Whenever rules validate each entry of a structured list,
include an emulator test with the list filled to its allowed maximum. Prefer a
smaller fully validated bound over a larger list whose valid writes fail at
runtime.