"""UTC appointment timestamps and one active booking per slot.

Existing databases require -x legacy_timezone=<IANA zone>. No timezone is
guessed because older browser submissions omitted their offsets.
"""
from alembic import context, op
import sqlalchemy as sa

revision = "20260925_booking_safety"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        raise RuntimeError("This data migration requires PostgreSQL")
    inspector = sa.inspect(bind)
    if not {"bookings", "availability_slots"}.issubset(inspector.get_table_names()):
        raise RuntimeError("Initialize the application tables before running this migration")
    # Prevent writes between the integrity checks and schema changes.
    op.execute("LOCK TABLE bookings, availability_slots IN ACCESS EXCLUSIVE MODE")
    duplicate = bind.execute(sa.text("""
        SELECT slot_id FROM bookings WHERE status IN ('PENDING', 'APPROVED')
        GROUP BY slot_id HAVING count(*) > 1 LIMIT 1
    """)).first()
    if duplicate:
        raise RuntimeError("Resolve duplicate active bookings before migrating; no bookings were removed")
    overlap = bind.execute(sa.text("""
        SELECT a.id FROM availability_slots a JOIN availability_slots b
          ON a.counselor_id = b.counselor_id AND a.id < b.id
         AND a.start_time < b.end_time AND a.end_time > b.start_time
        WHERE a.status IN ('AVAILABLE', 'BOOKED') AND b.status IN ('AVAILABLE', 'BOOKED')
        LIMIT 1
    """)).first()
    if overlap:
        raise RuntimeError("Resolve overlapping active availability before migrating; no slots were removed")

    zone = context.get_x_argument(as_dictionary=True).get("legacy_timezone")
    if zone and not bind.execute(sa.text("SELECT 1 FROM pg_timezone_names WHERE name=:zone"), {"zone": zone}).first():
        raise RuntimeError("legacy_timezone must be a valid PostgreSQL/IANA timezone")
    for table, schedule_columns in (("availability_slots", {"start_time", "end_time"}),
                                    ("bookings", {"scheduled_for"})):
        for column in inspector.get_columns(table):
            name = column["name"]
            if name not in schedule_columns | {"created_at", "updated_at"} or column["type"].timezone:
                continue
            source_zone = "UTC"
            if name in schedule_columns:
                if not zone and bind.execute(sa.text(f"SELECT 1 FROM {table} LIMIT 1")).first():
                    raise RuntimeError("Pass -x legacy_timezone=<original appointment timezone> to migrate existing times")
                source_zone = zone or "UTC"
            literal = str(sa.literal(source_zone).compile(dialect=bind.dialect, compile_kwargs={"literal_binds": True}))
            op.alter_column(table, name, type_=sa.DateTime(timezone=True),
                            postgresql_using=f"{name} AT TIME ZONE {literal}")
    indexes = {index["name"] for index in inspector.get_indexes("bookings")}
    if "uq_bookings_active_slot" not in indexes:
        op.create_index("uq_bookings_active_slot", "bookings", ["slot_id"], unique=True,
                        postgresql_where=sa.text("status IN ('PENDING', 'APPROVED')"))


def downgrade():
    # Dropping offsets silently would restore ambiguous appointment data.
    raise RuntimeError("Automatic downgrade is disabled; restore a verified pre-migration backup")
