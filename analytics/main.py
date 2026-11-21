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
from fastapi import Depends, FastAPI, Header, HTTPException, Query
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


def clock_minutes(value: str) -> int:
    hour, minute = map(int, value.split(":"))
    return hour * 60 + minute


def local_minutes(instant: datetime, zone: ZoneInfo) -> int:
    local = utc_datetime(instant).astimezone(zone)
    return local.hour * 60 + local.minute


def is_late_arrival(first_arrival: datetime, zone: ZoneInfo, late_cutoff: str) -> bool:
    # Late means the first arrival is at or after the cutoff in school time.
    return local_minutes(first_arrival, zone) >= clock_minutes(late_cutoff)


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


def student_profile(student: dict) -> dict:
    return {key: student[key] for key in ("id", "studentId", "firstName", "lastName")}


def late_rate(late: int, total: int) -> float | None:
    return round(late / total * 100, 1) if total else None


def summarize_class(students: list[dict], gate_rows: list[dict], room_rows: list[dict],
                    zone: ZoneInfo, late_cutoff: str) -> tuple[list[dict], dict]:
    """One row per student with their gate and classroom counts, plus class totals."""
    rows = {s["id"]: {"student": student_profile(s), "gateDays": 0, "lateGateDays": 0,
                      "roomSessions": 0, "presentRoomSessions": 0, "lateRoomSessions": 0} for s in students}
    for gate in gate_rows:
        row = rows.get(gate["studentId"])
        if row is not None:
            row["gateDays"] += 1
            row["lateGateDays"] += is_late_arrival(gate["firstInAt"], zone, late_cutoff)
    for room in room_rows:
        row = rows.get(room["studentId"])
        if row is not None:
            row["roomSessions"] += 1
            row["presentRoomSessions"] += room["status"] == "PRESENT"
            row["lateRoomSessions"] += room["status"] == "LATE"
    ordered = list(rows.values())
    total = lambda key: sum(row[key] for row in ordered)  # noqa: E731
    return ordered, {
        "students": len(ordered), "gateDays": total("gateDays"), "lateGateDays": total("lateGateDays"),
        "gateLateRate": late_rate(total("lateGateDays"), total("gateDays")),
        "roomSessions": total("roomSessions"), "presentRoomSessions": total("presentRoomSessions"),
        "lateRoomSessions": total("lateRoomSessions"),
    }


def summarize_subject(students: list[dict], room_rows: list[dict]) -> tuple[list[dict], dict]:
    """Per-student present/late counts for one subject.

    Absences are not stored (marking a student absent removes the row), so a session is
    any date+period with at least one record, and a student's gap in those is "no record".
    """
    sessions = {(row["date"], row["period"]) for row in room_rows}
    rows = {s["id"]: {"student": student_profile(s), "present": 0, "late": 0} for s in students}
    for room in room_rows:
        row = rows.get(room["studentId"])
        if row is not None:
            row["present"] += room["status"] == "PRESENT"
            row["late"] += room["status"] == "LATE"
    ordered = list(rows.values())
    for row in ordered:
        row["attended"] = row["present"] + row["late"]
        row["noRecord"] = len(sessions) - row["attended"]
    return ordered, {
        "students": len(ordered), "sessions": len(sessions),
        "presentRecords": sum(row["present"] for row in ordered),
        "lateRecords": sum(row["late"] for row in ordered),
    }


def clock_text(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def summarize_arrivals(students: list[dict], gate_rows: list[dict],
                       zone: ZoneInfo, late_cutoff: str) -> tuple[list[dict], list[dict], dict]:
    """Per-student first-arrival lateness and times (school time), plus a per-day breakdown."""
    arrivals: dict[str, list[tuple[int, bool]]] = {s["id"]: [] for s in students}
    daily: dict[str, dict] = {}
    for gate in gate_rows:
        if gate["studentId"] not in arrivals:
            continue
        late = is_late_arrival(gate["firstInAt"], zone, late_cutoff)
        arrivals[gate["studentId"]].append((local_minutes(gate["firstInAt"], zone), late))
        day = daily.setdefault(gate["date"], {"date": gate["date"], "arrived": 0, "late": 0})
        day["arrived"] += 1
        day["late"] += late
    rows = []
    for s in students:
        times = arrivals[s["id"]]
        rows.append({
            "student": student_profile(s), "gateDays": len(times), "lateGateDays": sum(late for _, late in times),
            "averageArrival": clock_text(round(sum(m for m, _ in times) / len(times))) if times else None,
            "latestArrival": clock_text(max(m for m, _ in times)) if times else None,
        })
    gate_days = sum(row["gateDays"] for row in rows)
    late_days = sum(row["lateGateDays"] for row in rows)
    return rows, sorted(daily.values(), key=lambda day: day["date"]), {
        "students": len(rows), "gateDays": gate_days, "onTimeGateDays": gate_days - late_days,
        "lateGateDays": late_days, "gateLateRate": late_rate(late_days, gate_days),
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
            for row in gates:
                first_arrival = utc_datetime(row["firstInAt"])
                records.append({
                    "id": row["id"], "type": "GATE", "date": row["date"].date().isoformat(),
                    "status": "LATE" if is_late_arrival(first_arrival, zone, late_cutoff) else "ON_TIME", "state": row["state"],
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


# --- Class, subject and arrival reports -------------------------------------------------
# `scope` fragments below are fixed strings chosen in this file, never user input;
# every user-supplied value goes through bound parameters.

def load_school(connection) -> tuple[str, str]:
    settings = connection.execute(text('''
        SELECT timezone, "lateCutoff" FROM "SchoolSettings" WHERE id = 1
    ''')).mappings().first()
    return (settings["timezone"], settings["lateCutoff"]) if settings else ("Asia/Bangkok", "08:00")


def report_window(start: date | None, end: date | None, zone: ZoneInfo) -> tuple[date, date, dict]:
    start, end = date_range(start, end, datetime.now(zone).date())
    return start, end, {
        "start": datetime.combine(start, time.min),
        "end": datetime.combine(end + timedelta(days=1), time.min),
    }


def envelope(report_type: str, school_timezone: str, late_cutoff: str, start: date, end: date, **fields) -> dict:
    return {
        "type": report_type, **fields, "start": start.isoformat(), "end": end.isoformat(),
        "timezone": school_timezone, "lateCutoff": late_cutoff,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def fetch_students(connection, scope: str, params: dict) -> list[dict]:
    return [dict(row) for row in connection.execute(text(f'''
        SELECT id, "studentId", "firstName", "lastName", "classSection" FROM "Student"
        WHERE {scope} ORDER BY "classSection", "firstName", "lastName", id
    '''), params).mappings()]


def fetch_gate_rows(connection, scope: str, params: dict) -> list[dict]:
    rows = connection.execute(text(f'''
        SELECT "studentId", date, "firstInAt" FROM "GateLog"
        WHERE "studentId" IN (SELECT id FROM "Student" WHERE {scope}) AND date >= :start AND date < :end
    '''), params).mappings()
    return [{"studentId": row["studentId"], "date": row["date"].date().isoformat(), "firstInAt": row["firstInAt"]} for row in rows]


def fetch_room_rows(connection, scope: str, params: dict, extra: str = "") -> list[dict]:
    rows = connection.execute(text(f'''
        SELECT "studentId", date, period, status FROM "RoomLog"
        WHERE "studentId" IN (SELECT id FROM "Student" WHERE {scope}) AND date >= :start AND date < :end {extra}
    '''), params).mappings()
    return [{"studentId": row["studentId"], "date": row["date"].date().isoformat(), "period": row["period"], "status": row["status"]} for row in rows]


@app.get("/analytics/reports/class")
def get_class_report(class_name: str = Query(alias="className", min_length=1), start: date | None = None, end: date | None = None):
    with engine.connect() as connection:
        school_timezone, late_cutoff = load_school(connection)
        zone = ZoneInfo(school_timezone)
        start, end, window = report_window(start, end, zone)
        params, scope = {"class_name": class_name, **window}, '"classSection" = :class_name'
        rows, summary = summarize_class(
            fetch_students(connection, scope, params), fetch_gate_rows(connection, scope, params),
            fetch_room_rows(connection, scope, params), zone, late_cutoff)
    return envelope("class", school_timezone, late_cutoff, start, end, className=class_name, summary=summary, rows=rows)


@app.get("/analytics/reports/subject")
def get_subject_report(class_name: str = Query(alias="className", min_length=1), subject: str = Query(min_length=1),
                       start: date | None = None, end: date | None = None):
    with engine.connect() as connection:
        school_timezone, late_cutoff = load_school(connection)
        zone = ZoneInfo(school_timezone)
        start, end, window = report_window(start, end, zone)
        params, scope = {"class_name": class_name, "subject": subject, **window}, '"classSection" = :class_name'
        rows, summary = summarize_subject(
            fetch_students(connection, scope, params),
            fetch_room_rows(connection, scope, params, 'AND "className" = :class_name AND subject = :subject'))
    return envelope("subject", school_timezone, late_cutoff, start, end, className=class_name, subject=subject, summary=summary, rows=rows)


@app.get("/analytics/reports/arrival")
def get_arrival_report(classes: list[str] | None = Query(default=None), start: date | None = None, end: date | None = None):
    # classes=None means the whole school (administrators only; Express enforces that).
    with engine.connect() as connection:
        school_timezone, late_cutoff = load_school(connection)
        zone = ZoneInfo(school_timezone)
        start, end, window = report_window(start, end, zone)
        params, scope = ({**window}, "TRUE") if classes is None else ({"classes": classes, **window}, '"classSection" = ANY(:classes)')
        rows, daily, summary = summarize_arrivals(
            fetch_students(connection, scope, params), fetch_gate_rows(connection, scope, params), zone, late_cutoff)
    return envelope("arrival", school_timezone, late_cutoff, start, end, classes=classes, summary=summary, daily=daily, rows=rows)
