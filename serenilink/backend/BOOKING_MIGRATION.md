# Booking timezone and concurrency migration

New appointment API inputs require an explicit timezone offset (or `Z`). The
browser sends `Date.toISOString()` and displays responses in local time.
PostgreSQL stores appointment timestamps as `timestamptz`; application values
and comparisons use UTC. Audit creation/update timestamps were already UTC.

## Existing PostgreSQL databases

Stop the backend while applying the migration and take a database backup first.
Confirm the timezone in which existing counselors entered their appointment
times. The old API discarded offsets, so this cannot be recovered from the
stored timestamps. If historical appointments span multiple input timezones,
reconcile their original zones before using this single-zone migration.

From the backend directory, using the existing virtual environment:

```powershell
# Example ONLY when historical appointment inputs used Libya local time:
.\venv\Scripts\alembic.exe -x legacy_timezone=Africa/Tripoli upgrade head
```

Use `legacy_timezone=UTC` only if those inputs were UTC. The migration refuses
to guess when existing naive appointment data is present. It converts slot
start/end and booking scheduled times using the specified zone, converts
creation/update timestamps from UTC, and adds the unique partial index
`uq_bookings_active_slot` for PENDING/APPROVED reservations. Cancelled and
declined booking history does not prevent rebooking.

The migration checks for duplicate active reservations and overlapping active
slots before changing the schema. Conflicts must be reconciled deliberately;
it never deletes bookings or chooses which appointment to keep. Run during a
maintenance window because it locks both scheduling tables. Restart the backend
after a successful migration. `create_all()` alone cannot update existing columns
or add the index to an existing table.

Fresh databases created by the current application's existing `create_all()`
startup already receive the timezone-aware columns and unique index. Run
`alembic upgrade head` afterward to record the revision; no legacy timezone is
needed when the columns are already timezone-aware.

## Validation

```powershell
.\venv\Scripts\python.exe -B -m unittest discover -s tests -v
```

Tests use isolated SQLite databases, including a two-connection simultaneous
reservation test. PostgreSQL row locks serialize all availability writers for a
counselor, while the conditional slot claim and unique index protect reservation
creation. Production PostgreSQL migration/locking must also be checked in your
deployment environment.
