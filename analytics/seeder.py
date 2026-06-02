import os
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/student_id_card"
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
fake = Faker()

def seed_data(num_students=50, days=30):
    with engine.begin() as conn:
        conn.execute(text('TRUNCATE TABLE "AttendanceLog" CASCADE;'))
        conn.execute(text('TRUNCATE TABLE "Student" CASCADE;'))

        students = []
        for _ in range(num_students):
            student_id = str(uuid.uuid4())
            nfc_id = "".join([random.choice("0123456789ABCDEF") for _ in range(8)])
            
            conn.execute(
                text('INSERT INTO "Student" (id, "nfcTagId", "firstName", "lastName", "createdAt", "updatedAt") '
                     'VALUES (:id, :nfcTagId, :firstName, :lastName, :createdAt, :updatedAt)'),
                {
                    "id": student_id,
                    "nfcTagId": nfc_id,
                    "firstName": fake.first_name(),
                    "lastName": fake.last_name(),
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            )
            students.append(student_id)

        now = datetime.utcnow()
        for day in range(days):
            current_date = now - timedelta(days=days-day)
            if current_date.weekday() >= 5:
                continue
            
            for student_id in students:
                if random.random() < 0.90:
                    arrival_hour = 7 if random.random() < 0.7 else 8
                    arrival_minute = random.randint(30, 59) if arrival_hour == 7 else random.randint(0, 30)
                    arrival_time = current_date.replace(hour=arrival_hour, minute=arrival_minute)
                    
                    status = "IN" if arrival_time.hour == 7 or (arrival_time.hour == 8 and arrival_time.minute <= 0) else "LATE"
                    
                    conn.execute(
                        text('INSERT INTO "AttendanceLog" (id, "studentId", timestamp, status) '
                             'VALUES (:id, :studentId, :timestamp, :status)'),
                        {
                            "id": str(uuid.uuid4()),
                            "studentId": student_id,
                            "timestamp": arrival_time,
                            "status": status
                        }
                    )

                    leave_hour = 15
                    leave_minute = random.randint(0, 30)
                    if random.random() < 0.05:
                        leave_hour = random.randint(10, 14)
                        
                    leave_time = current_date.replace(hour=leave_hour, minute=leave_minute)
                    conn.execute(
                        text('INSERT INTO "AttendanceLog" (id, "studentId", timestamp, status) '
                             'VALUES (:id, :studentId, :timestamp, :status)'),
                        {
                            "id": str(uuid.uuid4()),
                            "studentId": student_id,
                            "timestamp": leave_time,
                            "status": "OUT"
                        }
                    )

if __name__ == "__main__":
    seed_data()
