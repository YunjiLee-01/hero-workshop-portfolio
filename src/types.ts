export interface AttemptLog {
  id?: string;
  timestamp: string;
  method: 'qr' | 'admin' | string;
}

export interface Participant {
  id: string;
  employee_id: string;
  employee_name: string;
  round: string;
  workshop_date: string;
  workshop_start_time?: string;
  workshop_end_time?: string;
  location: string;
  class_name: string;
  group_number: string;
  is_checked_in: boolean;
  attendance_time?: string;
  attendance_method?: 'qr' | 'admin' | string;
  attempt_count?: number;
  attempt_logs?: AttemptLog[];
}

export interface AttendanceCode {
  id: string;
  workshop_date: string;
  location: string;
  attendance_code: string;
  is_active: boolean;
  time_limit_enabled?: boolean;
  checkin_start_time?: string;
  checkin_end_time?: string;
}

export interface LocationStat {
  location: string;
  total: number;
  checked_in: number;
  rate: number;
}

export interface OverviewStats {
  total_participants: number;
  checked_in_count: number;
  unchecked_count: number;
  attendance_rate: number;
  location_breakdown: LocationStat[];
}

export type ViewMode = 'PARTICIPANT' | 'ADMIN' | 'QR_BANNER';
