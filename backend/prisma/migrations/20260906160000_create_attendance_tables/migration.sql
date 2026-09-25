-- Earlier migrations assumed these attendance tables already existed. Create
-- the baseline before the later classSection/status alterations on fresh installs.
-- IF NOT EXISTS preserves databases where the tables were created previously.
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "uid_card" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Reader" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GATE',
    "deviceToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reader_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReaderTeacher" (
    "readerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReaderTeacher_pkey" PRIMARY KEY ("readerId", "userId"),
    CONSTRAINT "ReaderTeacher_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReaderTeacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SchoolSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lateCutoff" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GateLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "inStatus" TEXT NOT NULL,
    "inAt" TIMESTAMP(3) NOT NULL,
    "outAt" TIMESTAMP(3),
    "firstInAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GateLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GateLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GateLog_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RoomLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weekday" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "presentAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoomLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RoomLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomLog_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Student_studentId_key" ON "Student"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_uid_card_key" ON "Student"("uid_card");
CREATE UNIQUE INDEX IF NOT EXISTS "Reader_deviceToken_key" ON "Reader"("deviceToken");
CREATE UNIQUE INDEX IF NOT EXISTS "GateLog_studentId_date_key" ON "GateLog"("studentId", "date");
CREATE INDEX IF NOT EXISTS "GateLog_date_idx" ON "GateLog"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "RoomLog_studentId_roomId_subject_period_date_key" ON "RoomLog"("studentId", "roomId", "subject", "period", "date");
CREATE INDEX IF NOT EXISTS "RoomLog_date_idx" ON "RoomLog"("date");
