---
name: db-migration
description: Use when adding, renaming, or removing fields from a Mongoose schema to safely evolve the data model without breaking existing data.
---

# DB Migration Skill

LinguaFlow uses MongoDB with Mongoose. There are no automatic migration runners — changes must be made carefully with backward compatibility in mind.

## The 3-Layer Rule (non-negotiable)

Never flatten the vocabulary chain. The structure `vocabularyItem → meaning → occurrence` must always be preserved. If you are tempted to add a field to `occurrence` that should belong to `meaning`, or vice versa, refer to `@docs/DATA-SCHEMA.md` for the canonical responsibility of each layer.

---

## 1. Decide: Additive vs. Breaking

| Change type | Strategy |
|---|---|
| Add optional field | Safe — Mongoose returns `undefined` for missing fields on old docs |
| Add required field with default | Safe — set `default:` in schema; old docs get the default on next read |
| Rename a field | Breaking — requires a migration script |
| Remove a field | Breaking — requires a migration script + verify no code still reads it |
| Change field type | Breaking — requires a migration script |

---

## 2. Adding a Field (Safe Path)

Update the schema in `@docs/DATA-SCHEMA.md` first, then update the Mongoose schema file.

Always provide a `default` for new fields on existing collections so old documents are valid without a backfill:

```ts
// In OccurrenceSchema
easeFactor: { type: Number, default: 2.5 },
intervalDays: { type: Number, default: 1 },
```

Soft-delete fields (`isDeleted`, `deletedAt`) are already in all collections — never add a hard-delete.

---

## 3. Breaking Changes — Migration Script Pattern

Create a one-off script in `apps/backend/src/scripts/migrations/`:

```ts
// apps/backend/src/scripts/migrations/YYYYMMDD-rename-field.ts
import mongoose from 'mongoose';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await mongoose.connection.collection('occurrences').updateMany(
    { oldFieldName: { $exists: true } },
    { $rename: { oldFieldName: 'newFieldName' } },
  );

  console.log(`Migrated ${result.modifiedCount} documents`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
```

Run manually: `npx ts-node apps/backend/src/scripts/migrations/YYYYMMDD-rename-field.ts`

Rules:
- Run migrations against a **backup** first, never directly on production.
- Log the count of modified documents — if it's 0, something is wrong.
- After running, verify a sample document looks correct before deploying the new schema code.
- Add an entry to `@docs/CHANGELOG.md` documenting the migration.

---

## 4. Index Changes

If adding a new index, define it in the schema and in `DATA-SCHEMA.md`:

```ts
OccurrenceSchema.index({ userId: 1, dueDate: 1 }); // for GET /review/due
```

MongoDB creates indexes in the background on existing collections — no data loss risk, but monitor performance on large collections.

---

## 5. Checklist

- [ ] `DATA-SCHEMA.md` updated with the new/changed field
- [ ] Mongoose schema updated with `default:` for new fields
- [ ] If breaking: migration script written, tested on backup, and run
- [ ] No code path skips the 3-layer vocabulary chain after the change
- [ ] `CHANGELOG.md` entry added
