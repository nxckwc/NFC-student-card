export interface CreateStudentRequestBody {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  classSection?: string;
}

export interface UpdateStudentRequestBody {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  classSection?: string;
}

export interface RegisterCardRequestBody {
  studentId?: string;
  cardUid?: string;
}
