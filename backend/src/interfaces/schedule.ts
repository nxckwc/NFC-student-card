export interface ScheduleEntryResponse {
  id: number;
  weekday: number;
  period: number;
  subject: string;
  className: string;
  roomId: string;
  startTime: string;
  endTime: string;
}