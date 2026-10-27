"""Attendance reports over the application's GateLog and RoomLog tables.

The browser uses Express /analytics routes. This service accepts only the
internal token supplied by Express after staff/student authorization.
"""
import csv
import hmac
import io
import os
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import Response
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

load_dotenv(Path(__file__).resolve().parents[1] / "backend" / ".env")


def database_url(value: str) -> str:
    # Prisma's ?schema=public is not a psycopg2 connection parameter.
    url = make_url(value.replace("postgres://", "postgresql://", 1))
    schema = url.query.get("schema", "public")
    if schema != "public":
        raise ValueError("Analytics currently requires the public database schema")
    return url.difference_update_query(["schema"]).render_as_string(hide_password=False)


engine = create_engine(
    database_url(os.environ.get("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/student_id_db")),
    pool_pre_ping=True,
    connect_args={"options": "-c statement_timeout=12000"},
)


def require_service_token(x_analytics_token: str = Header(default="")) -> None:
    expected = os.environ.get("ANALYTICS_SERVICE_TOKEN") or os.environ.get("JWT_SECRET")
    if not expected or not hmac.compare_digest(x_analytics_token.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid analytics service token")


app = FastAPI(title="Attendance Analytics API", dependencies=[Depends(require_service_token)])
ReportKind = Literal["all", "gate", "room"]


def utc_datetime(value: datetime) -> datetime:
    # Prisma stores UTC instants in PostgreSQL timestamp-without-time-zone columns.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def iso_datetime(value: datetime | None) -> str | None:
    return utc_datetime(value).isoformat() if value is not None else None


def date_range(start: date | None, end: date | None, today: date) -> tuple[date, date]:
    end = end or today
    start = start or end.replace(day=1)
    if start > end or (end - start).days >= 366:
        raise HTTPException(status_code=422, detail="Choose a date range of 1 to 366 days")
    return start, end


def summarize(records: list[dict]) -> dict:
    gates = [row for row in records if row["type"] == "GATE"]
    rooms = [row for row in records if row["type"] == "ROOM"]
    late_gates = sum(row["status"] == "LATE" for row in gates)
    late_rooms = sum(row["status"] == "LATE" for row in rooms)
    return {
        "gateDays": len(gates),
        "onTimeGateDays": len(gates) - late_gates,
        "lateGateDays": late_gates,
        "gateLateRate": round(late_gates / len(gates) * 100, 1) if gates else None,
        "roomSessions": len(rooms),
        "presentRoomSessions": sum(row["status"] == "PRESENT" for row in rooms),
        "lateRoomSessions": late_rooms,
    }


def build_report(student_id: str, start: date | None, end: date | None, kind: ReportKind) -> dict:
    with engine.connect() as connection:
        student = connection.execute(text('''
            SELECT id, "studentId", "firstName", "lastName", "classSection"
            FROM "Student" WHERE id = :student_id
        '''), {"student_id": student_id}).mappings().first()
        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")
        settings = connection.execute(text('''
            SELECT timezone, "lateCutoff" FROM "SchoolSettings" WHERE id = 1
        ''')).mappings().first()
        school_timezone = settings["timezone"] if settings else "Asia/Bangkok"
        late_cutoff = settings["lateCutoff"] if settings else "08:00"
        zone = ZoneInfo(school_timezone)
        start, end = date_range(start, end, datetime.now(zone).date())
        params = {
            "student_id": student_id,
            "start": datetime.combine(start, time.min),
            "end": datetime.combine(end + timedelta(days=1), time.min),
        }
        records = []
        if kind in ("all", "gate"):
            gates = connection.execute(text('''
                SELECT id, date, "firstInAt", "outAt", state
                FROM "GateLog"
                WHERE "studentId" = :student_id AND date >= :start AND date < :end
                ORDER BY date DESC
            '''), params).mappings()
            cutoff_hour, cutoff_minute = map(int, late_cutoff.split(":"))
            for row in gates:
                first_arrival = utc_datetime(row["firstInAt"])
                local_arrival = first_arrival.astimezone(zone)
                is_late = local_arrival.hour * 60 + local_arrival.minute >= cutoff_hour * 60 + cutoff_minute
                records.append({
                    "id": row["id"], "type": "GATE", "date": row["date"].date().isoformat(),
                    "status": "LATE" if is_late else "ON_TIME", "state": row["state"],
                    "arrivalAt": first_arrival.isoformat(), "departureAt": iso_datetime(row["outAt"]),
                    "subject": None, "className": None, "roomId": None, "period": None,
                })
        if kind in ("all", "room"):
            rooms = connection.execute(text('''
                SELECT id, date, status, "presentAt", subject, "className", "roomId", period
                FROM "RoomLog"
                WHERE "studentId" = :student_id AND date >= :start AND date < :end
                ORDER BY date DESC, period ASC
            '''), params).mappings()
            for row in rooms:
                records.append({
                    "id": row["id"], "type": "ROOM", "date": row["date"].date().isoformat(),
                    "status": row["status"], "state": None,
                    "arrivalAt": iso_datetime(row["presentAt"]), "departureAt": None,
                    "subject": row["subject"], "className": row["className"],
                    "roomId": row["roomId"], "period": row["period"],
                })
    records.sort(key=lambda row: (row["date"], row["arrivalAt"], row["id"]), reverse=True)
    return {
        "student": dict(student),
        "start": start.isoformat(), "end": end.isoformat(), "kind": kind,
        "timezone": school_timezone, "lateCutoff": late_cutoff,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": summarize(records), "records": records,
    }


@app.get("/analytics/reports/student/{student_id}")
def get_student_report(student_id: str, start: date | None = None, end: date | None = None, kind: ReportKind = "all"):
    return build_report(student_id, start, end, kind)


@app.get("/analytics/reports/student/{student_id}/history")
def get_student_history(student_id: str, start: date | None = None, end: date | None = None, kind: ReportKind = "all"):
    return build_report(student_id, start, end, kind)["records"]


@app.get("/analytics/reports/student/{student_id}/analysis")
def get_student_analysis(student_id: str, start: date | None = None, end: date | None = None, kind: ReportKind = "all"):
    report = build_report(student_id, start, end, kind)
    return {key: value for key, value in report.items() if key != "records"}


def csv_cell(value):
    # Keep user-provided class/subject names from becoming spreadsheet formulas.
    if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


@app.get("/analytics/reports/student/{student_id}/csv")
def download_student_csv(student_id: str, start: date | None = None, end: date | None = None, kind: ReportKind = "all"):
    report = build_report(student_id, start, end, kind)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Status", "First arrival / Present at (UTC)", "Last exit (UTC)", "Subject", "Class", "Room", "Period"])
    for row in report["records"]:
        writer.writerow([csv_cell(row[key]) for key in ("date", "type", "status", "arrivalAt", "departureAt", "subject", "className", "roomId", "period")])
    return Response(content="\ufeff" + output.getvalue(), media_type="text/csv", headers={
        "Content-Disposition": 'attachment; filename="attendance-report.csv"',
        "Cache-Control": "no-store",
    })
