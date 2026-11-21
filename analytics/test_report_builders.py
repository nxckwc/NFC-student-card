"""Pure report builders for class, subject and arrival reports. No database needed.

Run: python -m unittest -v test_report_builders
"""
import unittest
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import main

BANGKOK = ZoneInfo("Asia/Bangkok")


def utc(text: str) -> datetime:
    return datetime.fromisoformat(text).replace(tzinfo=timezone.utc)


class LatenessTest(unittest.TestCase):
    def test_cutoff_is_judged_in_school_time(self):
        # Bangkok is UTC+7, so 00:59Z is 07:59 locally and 01:00Z is exactly 08:00.
        self.assertFalse(main.is_late_arrival(utc("2026-11-02T00:59:00"), BANGKOK, "08:00"))
        self.assertTrue(main.is_late_arrival(utc("2026-11-02T01:00:00"), BANGKOK, "08:00"))

    def test_naive_timestamps_are_utc(self):
        # Prisma stores UTC instants in timestamp-without-time-zone columns.
        self.assertTrue(main.is_late_arrival(datetime(2026, 11, 2, 1, 30), BANGKOK, "08:00"))


def student(key: str, number: str, first: str, section: str = "5/1") -> dict:
    return {"id": key, "studentId": number, "firstName": first, "lastName": "Test", "classSection": section}


ANN = student("a", "1001", "Ann")
BEN = student("b", "1002", "Ben")
PROFILE = lambda row: {key: row[key] for key in ("id", "studentId", "firstName", "lastName")}  # noqa: E731


class ClassSummaryTest(unittest.TestCase):
    def test_counts_each_students_gate_and_room_records(self):
        gates = [
            {"studentId": "a", "date": "2026-11-02", "firstInAt": utc("2026-11-02T00:30:00")},  # 07:30 on time
            {"studentId": "a", "date": "2026-11-03", "firstInAt": utc("2026-11-03T01:30:00")},  # 08:30 late
        ]
        rooms = [
            {"studentId": "a", "date": "2026-11-02", "period": 1, "status": "PRESENT"},
            {"studentId": "a", "date": "2026-11-03", "period": 2, "status": "LATE"},
        ]
        rows, summary = main.summarize_class([ANN, BEN], gates, rooms, BANGKOK, "08:00")
        self.assertEqual(rows, [
            {"student": PROFILE(ANN), "gateDays": 2, "lateGateDays": 1,
             "roomSessions": 2, "presentRoomSessions": 1, "lateRoomSessions": 1},
            {"student": PROFILE(BEN), "gateDays": 0, "lateGateDays": 0,
             "roomSessions": 0, "presentRoomSessions": 0, "lateRoomSessions": 0},
        ])
        self.assertEqual(summary, {
            "students": 2, "gateDays": 2, "lateGateDays": 1, "gateLateRate": 50.0,
            "roomSessions": 2, "presentRoomSessions": 1, "lateRoomSessions": 1,
        })

    def test_late_rate_is_unknown_without_gate_days(self):
        _, summary = main.summarize_class([ANN], [], [], BANGKOK, "08:00")
        self.assertIsNone(summary["gateLateRate"])
        self.assertEqual(summary["students"], 1)


CAT = student("c", "1003", "Cat")


class SubjectSummaryTest(unittest.TestCase):
    def test_sessions_are_those_with_any_record_and_gaps_count_as_no_record(self):
        rooms = [
            {"studentId": "a", "date": "2026-11-02", "period": 1, "status": "PRESENT"},
            {"studentId": "b", "date": "2026-11-02", "period": 1, "status": "LATE"},
            {"studentId": "a", "date": "2026-11-03", "period": 1, "status": "PRESENT"},
        ]
        rows, summary = main.summarize_subject([ANN, BEN, CAT], rooms)
        self.assertEqual(rows, [
            {"student": PROFILE(ANN), "present": 2, "late": 0, "attended": 2, "noRecord": 0},
            {"student": PROFILE(BEN), "present": 0, "late": 1, "attended": 1, "noRecord": 1},
            {"student": PROFILE(CAT), "present": 0, "late": 0, "attended": 0, "noRecord": 2},
        ])
        self.assertEqual(summary, {"students": 3, "sessions": 2, "presentRecords": 2, "lateRecords": 1})

    def test_no_records_means_no_sessions_and_no_gaps(self):
        rows, summary = main.summarize_subject([ANN], [])
        self.assertEqual(summary["sessions"], 0)
        self.assertEqual(rows[0]["noRecord"], 0)


class ArrivalSummaryTest(unittest.TestCase):
    def test_arrival_times_are_school_local_and_daily_counts_are_grouped(self):
        gates = [
            {"studentId": "a", "date": "2026-11-02", "firstInAt": utc("2026-11-02T00:30:00")},  # 07:30
            {"studentId": "a", "date": "2026-11-03", "firstInAt": utc("2026-11-03T01:30:00")},  # 08:30, late
            {"studentId": "b", "date": "2026-11-02", "firstInAt": utc("2026-11-02T00:50:00")},  # 07:50
        ]
        rows, daily, summary = main.summarize_arrivals([ANN, BEN], gates, BANGKOK, "08:00")
        self.assertEqual(rows, [
            {"student": PROFILE(ANN), "gateDays": 2, "lateGateDays": 1, "averageArrival": "08:00", "latestArrival": "08:30"},
            {"student": PROFILE(BEN), "gateDays": 1, "lateGateDays": 0, "averageArrival": "07:50", "latestArrival": "07:50"},
        ])
        self.assertEqual(daily, [
            {"date": "2026-11-02", "arrived": 2, "late": 0},
            {"date": "2026-11-03", "arrived": 1, "late": 1},
        ])
        self.assertEqual(summary, {"students": 2, "gateDays": 3, "onTimeGateDays": 2, "lateGateDays": 1, "gateLateRate": 33.3})

    def test_students_who_never_arrived_have_no_times(self):
        rows, daily, summary = main.summarize_arrivals([ANN], [], BANGKOK, "08:00")
        self.assertIsNone(rows[0]["averageArrival"])
        self.assertIsNone(rows[0]["latestArrival"])
        self.assertEqual(daily, [])
        self.assertIsNone(summary["gateLateRate"])


if __name__ == "__main__":
    unittest.main()
