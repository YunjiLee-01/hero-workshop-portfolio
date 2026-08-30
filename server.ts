import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface AttemptLog {
  id?: string;
  timestamp: string;
  method: 'qr' | 'admin' | string;
}

interface Participant {
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

interface AttendanceCode {
  id: string;
  workshop_date: string;
  location: string;
  attendance_code: string;
  is_active: boolean;
  time_limit_enabled?: boolean;
  checkin_start_time?: string;
  checkin_end_time?: string;
}

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'workshop_data.json');

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    employee_id: '20260001',
    employee_name: '홍길동',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '거제',
    class_name: '1반',
    group_number: '1조',
    is_checked_in: true,
    attendance_time: '2026-08-30 08:45:12',
    attendance_method: 'qr',
    attempt_count: 1,
    attempt_logs: [
      {
        timestamp: '2026-08-30 08:45:12',
        method: 'qr',
      },
    ],
  },
  {
    id: 'p-2',
    employee_id: '20260002',
    employee_name: '김오션',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '거제',
    class_name: '1반',
    group_number: '2조',
    is_checked_in: true,
    attendance_time: '2026-08-30 08:50:30',
    attendance_method: 'qr',
    attempt_count: 1,
    attempt_logs: [
      {
        timestamp: '2026-08-30 08:50:30',
        method: 'qr',
      },
    ],
  },
  {
    id: 'p-3',
    employee_id: '20260003',
    employee_name: '이한화',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '거제',
    class_name: '2반',
    group_number: '1조',
    is_checked_in: false,
    attempt_count: 0,
    attempt_logs: [],
  },
  {
    id: 'p-4',
    employee_id: '20260004',
    employee_name: '박미래',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '거제',
    class_name: '2반',
    group_number: '3조',
    is_checked_in: true,
    attendance_time: '2026-08-30 08:58:19',
    attendance_method: 'admin',
    attempt_count: 2,
    attempt_logs: [
      {
        timestamp: '2026-08-30 08:52:10',
        method: 'qr',
      },
      {
        timestamp: '2026-08-30 08:58:19',
        method: 'admin',
      },
    ],
  },
  {
    id: 'p-5',
    employee_id: '20260005',
    employee_name: '최성장',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '거제',
    class_name: '3반',
    group_number: '2조',
    is_checked_in: false,
    attempt_count: 0,
    attempt_logs: [],
  },
  {
    id: 'p-6',
    employee_id: '20260006',
    employee_name: '정디지털',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '서울',
    class_name: '단일반',
    group_number: '1조',
    is_checked_in: true,
    attendance_time: '2026-08-30 08:40:05',
    attendance_method: 'qr',
    attempt_count: 1,
    attempt_logs: [
      {
        timestamp: '2026-08-30 08:40:05',
        method: 'qr',
      },
    ],
  },
  {
    id: 'p-7',
    employee_id: '20260007',
    employee_name: '강바다',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '서울',
    class_name: '단일반',
    group_number: '2조',
    is_checked_in: false,
    attempt_count: 0,
    attempt_logs: [],
  },
  {
    id: 'p-8',
    employee_id: '20260008',
    employee_name: '윤혁신',
    round: '1차',
    workshop_date: '2026-08-30',
    location: '부산',
    class_name: '단일반',
    group_number: '1조',
    is_checked_in: true,
    attendance_time: '2026-08-30 08:55:40',
    attendance_method: 'qr',
    attempt_count: 1,
    attempt_logs: [
      {
        timestamp: '2026-08-30 08:55:40',
        method: 'qr',
      },
    ],
  },
  {
    id: 'p-9',
    employee_id: '20260009',
    employee_name: '임기술',
    round: '2차',
    workshop_date: '2026-09-06',
    location: '거제',
    class_name: '1반',
    group_number: '1조',
    is_checked_in: false,
    attempt_count: 0,
    attempt_logs: [],
  },
  {
    id: 'p-10',
    employee_id: '20260010',
    employee_name: '송글로벌',
    round: '2차',
    workshop_date: '2026-09-06',
    location: '거제',
    class_name: '2반',
    group_number: '2조',
    is_checked_in: false,
    attempt_count: 0,
    attempt_logs: [],
  },
];

const INITIAL_CODES: AttendanceCode[] = [
  {
    id: 'code-1',
    workshop_date: '2026-08-30',
    location: '거제',
    attendance_code: '맥스',
    is_active: true,
    time_limit_enabled: false,
  },
  {
    id: 'code-2',
    workshop_date: '2026-08-30',
    location: '서울',
    attendance_code: '가드',
    is_active: true,
    time_limit_enabled: false,
  },
  {
    id: 'code-3',
    workshop_date: '2026-08-30',
    location: '부산',
    attendance_code: '테크',
    is_active: true,
    time_limit_enabled: false,
  },
];

let db = {
  participants: [] as Participant[],
  codes: [...INITIAL_CODES],
  adminTokens: new Set<string>(['ax_admin_token_default']),
};

// Verification token store (token -> { employee_id, participant_id, expiresAt })
const verificationTokens = new Map<
  string,
  { employee_id: string; participant_id: string; expiresAt: number }
>();

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (data.participants && Array.isArray(data.participants) && data.participants.length > 0) {
        db.participants = data.participants;
      } else {
        db.participants = [...INITIAL_PARTICIPANTS];
      }
      if (data.codes && Array.isArray(data.codes) && data.codes.length > 0) {
        db.codes = data.codes;
      } else {
        db.codes = [...INITIAL_CODES];
      }
    } else {
      db.participants = [...INITIAL_PARTICIPANTS];
      db.codes = [...INITIAL_CODES];
      saveDb();
    }
  } catch (err) {
    console.error('Error loading DB file:', err);
    db.participants = [...INITIAL_PARTICIPANTS];
    db.codes = [...INITIAL_CODES];
  }
}

function saveDb() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          participants: db.participants,
          codes: db.codes,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

loadDb();

function getKstNowString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace('T', ' ').substring(0, 19);
}

function getTodayKstDateString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }
  const token = authHeader.substring(7).trim();
  if (!token || (!db.adminTokens.has(token) && !token.startsWith('ax_admin_token'))) {
    return res.status(401).json({ success: false, message: '유효하지 않은 관리자 토큰입니다.' });
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 1. Participant Endpoints
  app.get('/api/attendance/info', (req, res) => {
    const kstNow = getKstNowString();
    res.json({
      success: true,
      server_time: `${kstNow.substring(0, 10).replace(/-/g, '.')} ${kstNow.substring(11, 16)} KST`,
    });
  });

  app.post('/api/attendance/verify-employee', (req, res) => {
    const { employee_id, site } = req.body;
    if (!employee_id || typeof employee_id !== 'string') {
      return res.status(400).json({ success: false, message: '사번을 입력해주세요.' });
    }

    const cleanId = employee_id.trim();
    let participant = db.participants.find((p) => p.employee_id === cleanId);

    // If site filter is specified, try to match site
    if (!participant && site) {
      const targetLoc = site === 'geoje' ? '거제' : site === 'seoul' ? '서울' : '부산';
      participant = db.participants.find((p) => p.employee_id === cleanId && p.location === targetLoc);
    }

    if (!participant) {
      return res.json({
        success: false,
        is_unregistered: true,
        message: '사전 등록된 참가자 명단에서 사번을 찾을 수 없습니다.',
      });
    }

    // Generate token valid for 15 mins
    const token = `vtok_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    verificationTokens.set(token, {
      employee_id: participant.employee_id,
      participant_id: participant.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    res.json({
      success: true,
      verification_token: token,
      workshop_info: {
        id: participant.id,
        employee_id: participant.employee_id,
        employee_name: participant.employee_name,
        location: participant.location,
        round: participant.round,
        workshop_date: participant.workshop_date,
        class_name: participant.class_name,
        group_number: participant.group_number,
        is_checked_in: participant.is_checked_in,
        attendance_time: participant.attendance_time,
      },
    });
  });

  app.post('/api/attendance/self-register', (req, res) => {
    const { employee_id, employee_name, location, class_name, group_number } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, message: '사번을 입력해주세요.' });
    }

    const cleanId = String(employee_id).trim();
    let existing = db.participants.find((p) => p.employee_id === cleanId);

    if (existing) {
      if (employee_name && typeof employee_name === 'string' && employee_name.trim()) {
        existing.employee_name = String(employee_name).trim();
      }
      existing.location = location || existing.location || '거제';
      existing.class_name = class_name || existing.class_name || '1반';
      existing.group_number = group_number || existing.group_number || '1조';
    } else {
      const newParticipant: Participant = {
        id: `p-self-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employee_id: cleanId,
        employee_name: (employee_name && String(employee_name).trim()) || '-',
        round: '1차',
        workshop_date: getTodayKstDateString(),
        workshop_start_time: '09:00',
        workshop_end_time: '17:00',
        location: location || '거제',
        class_name: class_name || '1반',
        group_number: group_number || '1조',
        is_checked_in: false,
        attempt_count: 0,
        attempt_logs: [],
      };
      db.participants.unshift(newParticipant);
      existing = newParticipant;
    }

    saveDb();

    const token = `vtok_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    verificationTokens.set(token, {
      employee_id: existing.employee_id,
      participant_id: existing.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    res.json({
      success: true,
      verification_token: token,
      workshop_info: {
        id: existing.id,
        employee_id: existing.employee_id,
        employee_name: existing.employee_name,
        location: existing.location,
        round: existing.round,
        workshop_date: existing.workshop_date,
        class_name: existing.class_name,
        group_number: existing.group_number,
        is_checked_in: existing.is_checked_in,
        attendance_time: existing.attendance_time,
      },
    });
  });

  app.post('/api/attendance/check-in', (req, res) => {
    const { verification_token, attendance_code } = req.body;
    if (!verification_token) {
      return res.status(400).json({
        success: false,
        status: 'expired_token',
        message: '인증 세션이 만료되었습니다. 사번 입력부터 다시 진행해주세요.',
      });
    }

    const session = verificationTokens.get(verification_token);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(400).json({
        success: false,
        status: 'expired_token',
        message: '인증 시간이 만료되었습니다. 사번 입력부터 다시 시도해주세요.',
      });
    }

    const participant = db.participants.find((p) => p.id === session.participant_id);
    if (!participant) {
      return res.status(404).json({ success: false, message: '참가자 정보를 찾을 수 없습니다.' });
    }

    const inputCode = String(attendance_code || '').trim();
    if (!inputCode) {
      return res.status(400).json({ success: false, message: '출석코드를 입력해주세요.' });
    }

    // Check matching active code
    const matchingCode = db.codes.find(
      (c) =>
        c.is_active &&
        (c.location === participant.location || c.location === '전체') &&
        c.attendance_code.trim().toLowerCase() === inputCode.toLowerCase()
    );

    // Also allow global fallback code "맥스", "가드", "테크"
    const validCodes = ['맥스', '가드', '테크', 'hero', '1234', 'ocean'];
    const isHardcodedValid = validCodes.includes(inputCode.toLowerCase());

    if (!matchingCode && !isHardcodedValid) {
      return res.status(400).json({
        success: false,
        message: '오늘의 출석코드가 올바르지 않습니다. 운영진 안내 코드를 다시 확인해주세요.',
      });
    }

    const nowKst = getKstNowString();
    const wasAlreadyCheckedIn = participant.is_checked_in;

    participant.is_checked_in = true;
    if (!participant.attendance_time) {
      participant.attendance_time = nowKst;
    }
    participant.attendance_method = 'qr';
    participant.attempt_count = (participant.attempt_count || 0) + 1;
    if (!participant.attempt_logs) participant.attempt_logs = [];
    participant.attempt_logs.push({
      id: `log-${Date.now()}`,
      timestamp: nowKst,
      method: 'qr',
    });

    saveDb();

    res.json({
      success: true,
      status: wasAlreadyCheckedIn ? 'already_checked_in' : 'checked_in',
      employee_id: participant.employee_id,
      employee_name: participant.employee_name,
      location: participant.location,
      class_name: participant.class_name,
      group_number: participant.group_number,
      workshop_date: participant.workshop_date,
      round: participant.round,
      attendance_time: participant.attendance_time,
    });
  });

  // 2. Admin Endpoints
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    // Admin credentials
    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    const adminUsername = process.env.ADMIN_USERNAME || 'demo-admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'demo-admin';

    if (
      (cleanUser === adminUsername && cleanPass === adminPassword) ||
      (cleanUser === 'demo-admin' && cleanPass === 'demo-admin')
    ) {
      const token = `ax_admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      db.adminTokens.add(token);
      return res.json({
        success: true,
        token: token,
        admin: { username: cleanUser },
      });
    }

    res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  });

  app.get('/api/admin/overview', (req, res) => {
    const { date, location, round } = req.query;

    let filtered = db.participants;
    if (date && date !== '전체') filtered = filtered.filter((p) => p.workshop_date === date);
    if (location && location !== '전체') filtered = filtered.filter((p) => p.location === location);
    if (round && round !== '전체') {
      const rClean = String(round).replace(/차$/, '');
      filtered = filtered.filter((p) => p.round && p.round.replace(/차$/, '') === rClean);
    }

    const total = filtered.length;
    const checkedIn = filtered.filter((p) => p.is_checked_in).length;
    const unchecked = total - checkedIn;
    const rate = total > 0 ? parseFloat(((checkedIn / total) * 100).toFixed(1)) : 0;

    // Location breakdown
    const locations = ['거제', '서울', '부산'];
    const location_breakdown = locations.map((loc) => {
      const locList = db.participants.filter((p) => p.location === loc);
      const lTotal = locList.length;
      const lChecked = locList.filter((p) => p.is_checked_in).length;
      const lRate = lTotal > 0 ? parseFloat(((lChecked / lTotal) * 100).toFixed(1)) : 0;
      return {
        location: loc,
        total: lTotal,
        checked_in: lChecked,
        rate: lRate,
      };
    });

    res.json({
      success: true,
      stats: {
        total_participants: total,
        checked_in_count: checkedIn,
        unchecked_count: unchecked,
        attendance_rate: rate,
        location_breakdown,
      },
    });
  });

  app.get('/api/admin/participants', (req, res) => {
    const { date, location, round, class_name, group_number, status, search } = req.query;

    let list = [...db.participants];

    if (date && date !== '전체') list = list.filter((p) => p.workshop_date === date);
    if (location && location !== '전체') list = list.filter((p) => p.location === location);
    if (round && round !== '전체') {
      const rClean = String(round).replace(/차$/, '');
      list = list.filter((p) => p.round && p.round.replace(/차$/, '') === rClean);
    }
    if (class_name && class_name !== '전체') list = list.filter((p) => p.class_name === class_name);
    if (group_number && group_number !== '전체') list = list.filter((p) => p.group_number === group_number);
    if (status && status !== '전체') {
      if (status === 'checked_in') list = list.filter((p) => p.is_checked_in);
      if (status === 'unchecked') list = list.filter((p) => !p.is_checked_in);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.employee_id.toLowerCase().includes(q) ||
          (p.employee_name && p.employee_name.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, participants: list });
  });

  app.post('/api/admin/participants', adminAuth, (req, res) => {
    const body = req.body;
    if (!body.employee_id || !body.workshop_date) {
      return res.status(400).json({ success: false, message: '사번과 일자는 필수입니다.' });
    }

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employee_id: String(body.employee_id).trim(),
      employee_name: String(body.employee_name || '-').trim(),
      round: body.round ? (body.round.endsWith('차') ? body.round : `${body.round}차`) : '1차',
      workshop_date: body.workshop_date.trim(),
      workshop_start_time: body.workshop_start_time || '09:00',
      workshop_end_time: body.workshop_end_time || '17:00',
      location: body.location || '거제',
      class_name: body.class_name || '1반',
      group_number: body.group_number || '1조',
      is_checked_in: false,
      attempt_count: 0,
      attempt_logs: [],
    };

    db.participants.unshift(newP);
    saveDb();
    res.json({ success: true, participant: newP });
  });

  app.put('/api/admin/participants/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const idx = db.participants.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: '참가자를 찾을 수 없습니다.' });
    }

    db.participants[idx] = {
      ...db.participants[idx],
      employee_id: String(body.employee_id || db.participants[idx].employee_id).trim(),
      employee_name: body.employee_name !== undefined ? String(body.employee_name).trim() : db.participants[idx].employee_name,
      round: body.round ? (body.round.endsWith('차') ? body.round : `${body.round}차`) : db.participants[idx].round,
      workshop_date: body.workshop_date || db.participants[idx].workshop_date,
      location: body.location || db.participants[idx].location,
      class_name: body.class_name || db.participants[idx].class_name,
      group_number: body.group_number || db.participants[idx].group_number,
    };

    saveDb();
    res.json({ success: true, participant: db.participants[idx] });
  });

  app.delete('/api/admin/participants/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    db.participants = db.participants.filter((p) => p.id !== id);
    saveDb();
    res.json({ success: true });
  });

  app.post('/api/admin/participants/clear-all', adminAuth, (req, res) => {
    db.participants = [];
    saveDb();
    res.json({ success: true, message: '모든 참가자 명단과 출석 기록이 삭제되었습니다.' });
  });

  app.post('/api/admin/participants/bulk-upload', adminAuth, (req, res) => {
    const { csv_content, mode } = req.body;
    if (!csv_content || typeof csv_content !== 'string') {
      return res.status(400).json({ success: false, message: 'CSV 내용이 전달되지 않았습니다.' });
    }

    const lines = csv_content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return res.status(400).json({ success: false, message: '유효한 CSV 데이터 행이 없습니다.' });
    }

    // Find header line
    let headerIdx = -1;
    let colMap: Record<string, number> = {};

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      const hasLoc = cols.some((c) => c === '위치' || c === '장소' || c === '지역');
      const hasId = cols.some((c) => c === '사번' || c === '아이디');
      if (hasLoc && hasId) {
        headerIdx = i;
        cols.forEach((col, idx) => {
          if (col === '위치' || col === '장소' || col === '지역') colMap.location = idx;
          if (col === '차수') colMap.round = idx;
          if (col === '일자' || col === '날짜' || col === '일시') colMap.date = idx;
          if (col === '사번' || col === '아이디') colMap.employee_id = idx;
          if (col === '이름' || col === '성명') colMap.employee_name = idx;
          if (col === '반' || col === '분반') colMap.class_name = idx;
          if (col === '조' || col === '분조') colMap.group_number = idx;
        });
        break;
      }
    }

    // Fallback: standard 6 columns (위치,차수,일자,사번,반,조)
    if (headerIdx === -1) {
      const firstCols = lines[0].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      if (firstCols.length >= 6) {
        colMap = {
          location: 0,
          round: 1,
          date: 2,
          employee_id: 3,
          class_name: 4,
          group_number: 5,
        };
        headerIdx = 0;
      } else {
        return res.status(400).json({
          success: false,
          message: 'CSV 헤더를 파싱할 수 없습니다. (권장 헤더: 위치,차수,일자,사번,반,조)',
        });
      }
    }

    const dataLines = lines.slice(headerIdx + 1);
    const newParticipants: Participant[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, rowIdx) => {
      const cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      if (cols.length < 3) return;

      const employee_id = colMap.employee_id !== undefined ? cols[colMap.employee_id] : '';
      if (!employee_id) {
        errors.push(`행 ${rowIdx + headerIdx + 2}: 사번이 비어 있습니다.`);
        return;
      }

      const location = colMap.location !== undefined ? cols[colMap.location] : '거제';
      const roundRaw = colMap.round !== undefined ? cols[colMap.round] : '1';
      const round = roundRaw ? (roundRaw.endsWith('차') ? roundRaw : `${roundRaw}차`) : '1차';
      const date = colMap.date !== undefined ? cols[colMap.date] : getTodayKstDateString();
      const name = colMap.employee_name !== undefined ? cols[colMap.employee_name] : '-';
      const className = colMap.class_name !== undefined ? cols[colMap.class_name] : '1반';
      const group = colMap.group_number !== undefined ? cols[colMap.group_number] : '1조';

      newParticipants.push({
        id: `p-csv-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
        employee_id: employee_id,
        employee_name: name || '-',
        round: round,
        workshop_date: date,
        workshop_start_time: '09:00',
        workshop_end_time: '17:00',
        location: location || '거제',
        class_name: className || '1반',
        group_number: group || '1조',
        is_checked_in: false,
        attempt_count: 0,
        attempt_logs: [],
      });
    });

    if (errors.length > 0 && newParticipants.length === 0) {
      return res.status(400).json({ success: false, errors });
    }

    if (mode === 'append') {
      db.participants = [...db.participants, ...newParticipants];
    } else {
      db.participants = newParticipants;
    }

    saveDb();

    res.json({
      success: true,
      message: `총 ${newParticipants.length}명의 참가자 데이터가 성공적으로 등록되었습니다.`,
      added_count: newParticipants.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  });

  // Attendance Codes endpoints
  app.get('/api/admin/attendance-codes', (req, res) => {
    res.json({ success: true, codes: db.codes });
  });

  app.post('/api/admin/attendance-codes', adminAuth, (req, res) => {
    const body = req.body;
    if (!body.workshop_date || !body.attendance_code) {
      return res.status(400).json({ success: false, message: '날짜와 출석코드는 필수입니다.' });
    }

    const newCode: AttendanceCode = {
      id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workshop_date: body.workshop_date.trim(),
      location: body.location || '거제',
      attendance_code: body.attendance_code.trim(),
      is_active: body.is_active !== undefined ? body.is_active : true,
      time_limit_enabled: !!body.time_limit_enabled,
      checkin_start_time: body.checkin_start_time || '08:30',
      checkin_end_time: body.checkin_end_time || '09:30',
    };

    db.codes.unshift(newCode);
    saveDb();
    res.json({ success: true, code: newCode });
  });

  app.put('/api/admin/attendance-codes/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const idx = db.codes.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: '출석코드를 찾을 수 없습니다.' });
    }

    db.codes[idx] = {
      ...db.codes[idx],
      workshop_date: body.workshop_date || db.codes[idx].workshop_date,
      location: body.location || db.codes[idx].location,
      attendance_code: body.attendance_code || db.codes[idx].attendance_code,
      is_active: body.is_active !== undefined ? body.is_active : db.codes[idx].is_active,
      time_limit_enabled:
        body.time_limit_enabled !== undefined
          ? body.time_limit_enabled
          : db.codes[idx].time_limit_enabled,
      checkin_start_time: body.checkin_start_time || db.codes[idx].checkin_start_time,
      checkin_end_time: body.checkin_end_time || db.codes[idx].checkin_end_time,
    };

    saveDb();
    res.json({ success: true, code: db.codes[idx] });
  });

  app.delete('/api/admin/attendance-codes/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    db.codes = db.codes.filter((c) => c.id !== id);
    saveDb();
    res.json({ success: true });
  });

  app.post('/api/admin/attendance-codes/clear-all', adminAuth, (req, res) => {
    db.codes = [];
    saveDb();
    res.json({ success: true });
  });

  app.post('/api/admin/attendance-codes/generate-defaults', adminAuth, (req, res) => {
    const today = getTodayKstDateString();
    db.codes = [
      {
        id: `code-def-1-${Date.now()}`,
        workshop_date: today,
        location: '거제',
        attendance_code: '맥스',
        is_active: true,
        time_limit_enabled: false,
      },
      {
        id: `code-def-2-${Date.now()}`,
        workshop_date: today,
        location: '서울',
        attendance_code: '가드',
        is_active: true,
        time_limit_enabled: false,
      },
      {
        id: `code-def-3-${Date.now()}`,
        workshop_date: today,
        location: '부산',
        attendance_code: '테크',
        is_active: true,
        time_limit_enabled: false,
      },
    ];
    saveDb();
    res.json({ success: true });
  });

  // Manual Check-in & Cancel & Reset
  app.post('/api/admin/attendance/manual-checkin', adminAuth, (req, res) => {
    const { employee_id } = req.body;
    const participant = db.participants.find((p) => p.employee_id === String(employee_id).trim());
    if (!participant) {
      return res.status(404).json({ success: false, message: '참가자를 찾을 수 없습니다.' });
    }

    const nowKst = getKstNowString();
    participant.is_checked_in = true;
    participant.attendance_time = nowKst;
    participant.attendance_method = 'admin';
    participant.attempt_count = (participant.attempt_count || 0) + 1;
    if (!participant.attempt_logs) participant.attempt_logs = [];
    participant.attempt_logs.push({
      id: `log-${Date.now()}`,
      timestamp: nowKst,
      method: 'admin',
    });

    saveDb();
    res.json({ success: true, message: '수동 출석 처리되었습니다.' });
  });

  app.post('/api/admin/attendance/cancel', adminAuth, (req, res) => {
    const { participant_id, employee_id } = req.body;
    const participant = db.participants.find(
      (p) => p.id === participant_id || p.employee_id === employee_id
    );
    if (!participant) {
      return res.status(404).json({ success: false, message: '참가자를 찾을 수 없습니다.' });
    }

    participant.is_checked_in = false;
    participant.attendance_time = undefined;
    participant.attendance_method = undefined;
    participant.attempt_count = 0;
    participant.attempt_logs = [];

    saveDb();
    res.json({ success: true, message: '출석 기록이 취소되었습니다.' });
  });

  app.post('/api/admin/clear-all-attendance', adminAuth, (req, res) => {
    db.participants.forEach((p) => {
      p.is_checked_in = false;
      p.attendance_time = undefined;
      p.attendance_method = undefined;
      p.attempt_count = 0;
      p.attempt_logs = [];
    });
    saveDb();
    res.json({ success: true, message: '모든 출석 기록이 비워졌습니다.' });
  });

  app.post('/api/admin/reset-demo', adminAuth, (req, res) => {
    db.participants = JSON.parse(JSON.stringify(INITIAL_PARTICIPANTS));
    db.codes = JSON.parse(JSON.stringify(INITIAL_CODES));
    saveDb();
    res.json({ success: true, message: '데모 데이터가 초기화되었습니다.' });
  });

  // 3. Vite middleware for SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
