# Sportz dummy data

`matches.json` contains fixture-level seed data.

`football/` and `cricket/` contain match-specific event timelines.

`startOffsetMinutes` is relative to seed execution:
- negative = started in the past
- positive = starts in the future

The importer should convert offsets to actual timestamps before inserting into PostgreSQL.

The live scores are the initial runtime state. The simulator should continue from them and update PostgreSQL plus WebSocket events.
