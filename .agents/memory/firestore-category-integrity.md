---
name: Firestore category integrity
description: The consistency rule for custom content categories and their linked items.
---

Maintain each category's linked-item membership in the same Firestore transaction that creates, moves, or deletes an item. Category deletion must read that membership in its own transaction and reject non-empty categories.

**Why:** A separate “check for linked items, then delete” flow has a race: another admin can link an item between those operations, leaving content assigned to a category that no longer exists.

**How to apply:** Any future write path that changes an item's custom category must update the source and destination category membership within the same transaction. Do not overwrite membership during category metadata edits.