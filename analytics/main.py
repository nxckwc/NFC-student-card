import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, JSONResponse
from sqlalchemy import create_engine

DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/student_id_card"
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
app = FastAPI(title="Attendance Analytics API")

def get_student_logs(student_id: str) -> pd.DataFrame:
    query = """
    SELECT 
        s."firstName", 
        s."lastName", 
        a.timestamp, 
        a.status 
    FROM "AttendanceLog" a
    JOIN "Student" s ON a."studentId" = s.id
    WHERE s.id = %(student_id)s
    ORDER BY a.timestamp ASC
    """
    df = pd.read_sql_query(query, engine, params={"student_id": student_id})
    if df.empty:
        raise HTTPException(status_code=404, detail="Student not found")
    return df

@app.get("/api/reports/student/{student_id}/history")
def get_student_history(student_id: str):
    df = get_student_logs(student_id)
    df['timestamp'] = df['timestamp'].dt.isoformat()
    return JSONResponse(content=df.to_dict(orient="records"))

@app.get("/api/reports/student/{student_id}/analysis")
def get_student_analysis(student_id: str):
    df = get_student_logs(student_id)
    
    total_swipes = len(df)
    in_swipes = df[df['status'].isin(['IN', 'LATE'])]
    out_swipes = df[df['status'] == 'OUT']
    
    total_lates = len(df[df['status'] == 'LATE'])
    total_on_time = len(df[df['status'] == 'IN'])
    
    risk_score = 0
    if len(in_swipes) > 0:
        late_percentage = total_lates / len(in_swipes)
        risk_score = min(100, int(late_percentage * 100))

    out_hours = out_swipes['timestamp'].dt.hour
    most_common_leave_hour = None
    if not out_hours.empty:
        most_common_leave_hour = int(out_hours.mode().iloc[0])

    analysis = {
        "studentName": f"{df.iloc[0]['firstName']} {df.iloc[0]['lastName']}",
        "totalSwipes": total_swipes,
        "lates": total_lates,
        "onTime": total_on_time,
        "riskScore": risk_score,
        "mostCommonLeaveHour": most_common_leave_hour,
        "notes": "High risk" if risk_score > 30 else "Good"
    }
    
    return JSONResponse(content=analysis)

@app.get("/api/reports/student/{student_id}/csv")
def download_student_csv(student_id: str):
    df = get_student_logs(student_id)
    
    df = df.rename(columns={
        "firstName": "First Name",
        "lastName": "Last Name",
        "timestamp": "Time Logged",
        "status": "Event Type"
    })
    
    csv_data = df.to_csv(index=False)
    file_name = f"attendance_{df.iloc[0]['First Name']}_{df.iloc[0]['Last Name']}.csv"
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={file_name}"}
    )

@app.get("/api/students")
def get_all_students():
    query = 'SELECT id, "firstName", "lastName" FROM "Student" ORDER BY "lastName" ASC'
    df = pd.read_sql_query(query, engine)
    return JSONResponse(content=df.to_dict(orient="records"))
