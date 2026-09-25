"""Run against a disposable database with the repository migrations applied.

ANALYTICS_TEST_DATABASE_URL must name a database ending in _test. Fixtures are
inserted inside a transaction and rolled back; no existing records are deleted.
"""
import os
import unittest
from datetime import date
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

import main


class ReportRulesTest(unittest.TestCase):
    def test_prisma_url(self):
        value = main.database_url("postgresql://u:password@localhost/school?schema=public&sslmode=require")
        self.assertNotIn("schema=", value)
        self.assertIn("sslmode=require", value)

    def test_date_boundaries(self):
        self.assertEqual(main.date_range(date(2024, 1, 1), date(2024, 12, 31), date.today()),
                         (date(2024, 1, 1), date(2024, 12, 31)))
        for start, end in [(date(2024, 1, 2), date(2024, 1, 1)), (date(2024, 1, 1), date(2025, 1, 1))]:
            with self.assertRaises(HTTPException):
                main.date_range(start, end, date.today())

    def test_internal_auth(self):
        with patch.dict(os.environ, {"ANALYTICS_SERVICE_TOKEN": "test-only"}):
            main.require_service_token("test-only")
            with self.assertRaises(HTTPException):
                main.require_service_token("wrong")

    def test_csv_formula_protection(self):
        self.assertEqual(main.csv_cell("=1+1"), "'=1+1")
        self.assertEqual(main.csv_cell("Science"), "Science")


@unittest.skipUnless(os.environ.get("ANALYTICS_TEST_DATABASE_URL"), "Disposable PostgreSQL URL not supplied")
class ReportDatabaseTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        url = main.database_url(os.environ["ANALYTICS_TEST_DATABASE_URL"])
        if not (make_url(url).database or "").endswith("_test"):
            raise RuntimeError("Use a disposable database whose name ends in _test")
        cls.engine = create_engine(url)

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        self.connection = self.engine.connect()
        self.transaction = self.connection.begin()
        self.student = str(uuid4())
        self.reader = str(uuid4())
        self.connection.execute(text('''
            INSERT INTO "Student" (id, "firstName", "lastName", "classSection", "updatedAt")
            VALUES (:id, 'Report', 'Fixture', 'M.5/3', NOW())
        '''), {"id": self.student})
        self.connection.execute(text('''
            INSERT INTO "Reader" (id, name, "deviceToken", "updatedAt")
            VALUES (:id, 'Test reader', :token, NOW())
        '''), {"id": self.reader, "token": str(uuid4())})
        self.connection.execute(text('''
            INSERT INTO "SchoolSettings" (id, timezone, "lateCutoff", "updatedAt")
            VALUES (1, 'Asia/Bangkok', '08:00', NOW())
            ON CONFLICT (id) DO UPDATE SET timezone = 'Asia/Bangkok', "lateCutoff" = '08:00'
        '''))
        for day, first, latest in [('2026-09-01', '00:30', '06:00'), ('2026-09-02', '01:00', '01:00')]:
            self.connection.execute(text('''
                INSERT INTO "GateLog" (id, "studentId", "readerId", date, state, "inStatus", "firstInAt", "inAt", "updatedAt")
                VALUES (:id, :student, :reader, :day, 'IN', 'LATE', :first, :latest, NOW())
            '''), {"id": str(uuid4()), "student": self.student, "reader": self.reader,
                   "day": day, "first": f"{day} {first}:00", "latest": f"{day} {latest}:00"})
        self.connection.execute(text('''
            INSERT INTO "RoomLog" (id, "studentId", date, weekday, period, subject, "className", "roomId", status, "presentAt")
            VALUES (:id, :student, '2026-09-02', 3, 1, '=Formula', 'M.5/3', '101', 'LATE', '2026-09-02 02:05:00')
        '''), {"id": str(uuid4()), "student": self.student})

        # Let production queries share this uncommitted fixture transaction.
        connection = self.connection
        class BorrowedConnection:
            def __enter__(self):
                return connection
            def __exit__(self, *_args):
                return False
        self.mock = patch.object(main.engine, "connect", return_value=BorrowedConnection())
        self.mock.start()

    def tearDown(self):
        self.mock.stop()
        self.transaction.rollback()
        self.connection.close()

    def test_combined_report_and_first_arrival_lateness(self):
        report = main.build_report(self.student, date(2026, 9, 1), date(2026, 9, 2), "all")
        self.assertEqual(len(report["records"]), 3)
        self.assertEqual(report["summary"]["gateDays"], 2)
        self.assertEqual(report["summary"]["lateGateDays"], 1)
        self.assertEqual(report["summary"]["gateLateRate"], 50)
        self.assertEqual(report["summary"]["lateRoomSessions"], 1)
        first = next(row for row in report["records"] if row["date"] == '2026-09-01')
        self.assertEqual(first["status"], 'ON_TIME')
        self.assertTrue(first["arrivalAt"].endswith('+00:00'))

    def test_inclusive_dates_and_kind_filters(self):
        report = main.build_report(self.student, date(2026, 9, 2), date(2026, 9, 2), "gate")
        self.assertEqual(len(report["records"]), 1)
        self.assertEqual(report["summary"]["roomSessions"], 0)
        report = main.build_report(self.student, date(2026, 9, 1), date(2026, 9, 2), "room")
        self.assertEqual(len(report["records"]), 1)
        self.assertEqual(report["records"][0]["status"], 'LATE')

    def test_empty_report_is_not_missing_student(self):
        report = main.build_report(self.student, date(2026, 8, 1), date(2026, 8, 31), "all")
        self.assertEqual(report["records"], [])
        self.assertIsNone(report["summary"]["gateLateRate"])
        with self.assertRaises(HTTPException) as error:
            main.build_report(str(uuid4()), date(2026, 8, 1), date(2026, 8, 31), "all")
        self.assertEqual(error.exception.status_code, 404)

    def test_csv_and_summary_routes(self):
        response = main.download_student_csv(self.student, date(2026, 9, 1), date(2026, 9, 2), "all")
        self.assertIn("'=Formula", response.body.decode('utf-8-sig'))
        report = main.get_student_analysis(self.student, date(2026, 9, 1), date(2026, 9, 2), "all")
        self.assertNotIn('records', report)
        self.assertEqual(report['summary']['gateDays'], 2)


if __name__ == '__main__':
    unittest.main()
