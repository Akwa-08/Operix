// backend/src/server.js
require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const multer         = require('multer');
const XLSX           = require('xlsx');
const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.originalname.match(/\.(xls|xlsx)$/i)) cb(null, true);
    else cb(new Error('Only .xls or .xlsx files are accepted'));
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  req.adminUser = user;
  next();
}

app.get('/health', (_, res) =>
  res.json({ status: 'OK', purpose: 'Admin auth + payroll file upload' })
);

// USER MANAGEMENT
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, username, contact_number } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: (role || 'customer').toLowerCase(), first_name: first_name || '', last_name: last_name || '', contact_number: contact_number || '' },
    });
    if (authErr) return res.status(authErr.message.includes('already') ? 409 : 400).json({ error: authErr.message });
    if (authData.user) {
      await supabase.from('users').update({ username: username || null, role: (role || 'customer').toLowerCase(), contact_number: contact_number || null }).eq('id', authData.user.id);
    }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    res.status(201).json({ success: true, data: profile });
  } catch (err) { console.error('Create user error:', err); res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, first_name, last_name, contact_number, address, is_active } = req.body;
    const authPayload = {}; const metadata = {};
    if (email) authPayload.email = email;
    if (password) authPayload.password = password;
    if (role) metadata.role = role.toLowerCase();
    if (first_name !== undefined) metadata.first_name = first_name;
    if (last_name !== undefined) metadata.last_name = last_name;
    if (Object.keys(metadata).length) authPayload.user_metadata = metadata;
    if (Object.keys(authPayload).length) {
      const { error } = await supabase.auth.admin.updateUserById(id, authPayload);
      if (error) return res.status(400).json({ error: error.message });
    }
    const dbPayload = {};
    if (first_name !== undefined) dbPayload.first_name = first_name;
    if (last_name !== undefined) dbPayload.last_name = last_name;
    if (email) dbPayload.email = email;
    if (role) dbPayload.role = role.toLowerCase();
    if (contact_number !== undefined) dbPayload.contact_number = contact_number;
    if (address !== undefined) dbPayload.address = address;
    if (is_active !== undefined) dbPayload.is_active = is_active;
    if (Object.keys(dbPayload).length) await supabase.from('users').update(dbPayload).eq('id', id);
    const { data: profile } = await supabase.from('users').select('*').eq('id', id).single();
    res.json({ success: true, data: profile });
  } catch (err) { console.error('Update user error:', err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PAYROLL HELPERS

function parsePeriodString(raw) {
  if (!raw) throw new Error('Period string missing from file');
  const dateMatch = raw.match(/(\d{4})\/(\d{2})\/(\d{2})\s*~\s*(\d{2})\/(\d{2})/);
  if (!dateMatch) throw new Error(`Cannot parse period dates from: "${raw}"`);
  const [, year, startMonth, startDay, endMonth, endDay] = dateMatch;
  const companyMatch = raw.match(/\(\s*([^)]+?)\s*\)/);
  return {
    periodStart: `${year}-${startMonth}-${startDay}`,
    periodEnd:   `${year}-${endMonth}-${endDay}`,
    company:     companyMatch ? companyMatch[1].trim() : 'UNKNOWN',
  };
}

function parseAttend(val) {
  if (!val || typeof val !== 'string') return { required: null, actual: null };
  const [req, act] = val.split('/').map(s => parseInt(s, 10));
  return { required: isNaN(req) ? null : req, actual: isNaN(act) ? null : act };
}

// Biometric HH.MM format → decimal hours
// e.g. 88.44 = 88h 44m = 88.733 decimal hours
function parseHHMM(val) {
  if (val === null || val === undefined) return 0;
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return 0;
  const hours = Math.floor(n);
  const minutesPart = Math.round((n - hours) * 100);
  return parseFloat((hours + minutesPart / 60).toFixed(4));
}

function safeNum(val) {
  if (val === null || val === undefined) return null;
  const n = parseFloat(val); return isNaN(n) ? null : n;
}

function safeInt(val) {
  if (val === null || val === undefined) return null;
  const n = parseInt(val, 10); return isNaN(n) ? null : n;
}

function parseAttendanceXLS(buffer, originalName) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  if (rows.length < 5) throw new Error('File too short');

  const { periodStart, periodEnd, company } = parsePeriodString(
    rows[1]?.[1] ? String(rows[1][1]) : ''
  );

  const records = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const employeeNo = safeInt(row[0]);
    if (!employeeNo) continue;
    const name = row[1] ? String(row[1]).trim() : '';
    if (!name) continue;

    const attendStr = row[11] ? String(row[11]) : '';
    const { required: attendReq, actual: attendAct } = parseAttend(attendStr);

    records.push({
      employee_no:          employeeNo,
      employee_name:        name,
      department:           row[2] ? String(row[2]).trim() : null,
      // HH.MM → decimal hours
      required_hours:       parseHHMM(row[3]),
      actual_hours:         parseHHMM(row[4]),
      overtime_regular:     parseHHMM(row[9]),
      overtime_special:     parseHHMM(row[10]),
      // Late/Early: stored as count of timeslots + total minutes
      late_times:           safeInt(row[5])  ?? 0,
      late_minutes:         safeInt(row[6])  ?? 0,
      early_leave_times:    safeInt(row[7])  ?? 0,
      early_leave_minutes:  safeInt(row[8])  ?? 0,
      attend_required:      attendReq,
      attend_actual:        attendAct,
      business_trip:        safeInt(row[12]) ?? 0,
      absences:             safeInt(row[13]) ?? 0,
      on_leave:             safeInt(row[14]) ?? 0,
      bonus_note:           row[15] ? String(row[15]).trim() : null,
      ot_allowance:         safeNum(row[16]),
      allowance:            safeNum(row[17]),
      deduction_late_early: safeNum(row[18]),
      deduction_on_leave:   safeNum(row[19]),
      deduction_other:      safeNum(row[20]),
      actual_pay:           safeNum(row[21]),
      remark:               row[22] ? String(row[22]).trim() : null,
    });
  }
  if (records.length === 0) throw new Error('No employee data rows found');
  return { periodStart, periodEnd, company, records, sourceFile: originalName };
}

// NAME-BASED matching (not employee_no)
async function resolveEmployeesByName(employeeNames) {
  const { data, error } = await supabase.from('employees').select('id, full_name');
  if (error) throw error;

  const dbMap = new Map();
  for (const emp of data || []) {
    dbMap.set(emp.full_name.toLowerCase().trim(), emp.id);
  }

  const matchMap = new Map();
  const unmatchedNames = [];
  for (const name of employeeNames) {
    const id = dbMap.get(name.toLowerCase().trim());
    if (id) matchMap.set(name, id);
    else unmatchedNames.push(name);
  }

  console.log(`[name-match] Matched: ${matchMap.size}, Unmatched: ${unmatchedNames.length}`);
  if (unmatchedNames.length) console.log('[name-match] Unmatched:', unmatchedNames);
  return { matchMap, unmatchedNames };
}

async function findOrCreatePayrollPeriod(periodStart, periodEnd, userId) {
  const { data: existing } = await supabase
    .from('payroll_periods').select('id')
    .eq('period_start', periodStart).eq('period_end', periodEnd).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('payroll_periods')
    .insert([{ period_start: periodStart, period_end: periodEnd, status: 'draft', created_by: userId }])
    .select('id').single();
  if (error) throw error;
  return created.id;
}

// Helper: build one attendance sync row from an import row + ratio
function buildSyncRow(r, periodId, ratio) {
  const splitInt  = (n) => Math.round((n ?? 0) * ratio);
  const splitDec  = (n) => Math.round((n ?? 0) * ratio * 100) / 100;
  return {
    employee_id:            r.employee_id,
    payroll_period_id:      periodId,
    worked_hours:           splitDec(r.actual_hours),
    required_hours:         splitInt(r.required_hours),
    days_present:           splitInt(r.attend_actual),
    late_timeslots:         splitInt(r.late_minutes > 0 ? Math.round(r.late_minutes / 30) : 0),
    early_leave_timeslots:  splitInt(r.early_leave_minutes > 0 ? Math.round(r.early_leave_minutes / 30) : 0),
    regular_overtime_hours: splitDec(r.overtime_regular),
    holiday_overtime_hours: 0,
    special_overtime_hours: splitDec(r.overtime_special),
    business_trip_days:     splitInt(r.business_trip),
    absences:               splitInt(r.absences),
    on_leave_days:          splitInt(r.on_leave),
    additional_pay:         splitDec(r.allowance),
    deduction_amount:       splitDec((r.deduction_late_early ?? 0) + (r.deduction_on_leave ?? 0) + (r.deduction_other ?? 0)),
  };
}

// POST /api/payroll/upload-attendance
app.post('/api/payroll/upload-attendance', requireAdmin, upload.single('attendance_file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { periodStart, periodEnd, company, records, sourceFile } =
      parseAttendanceXLS(req.file.buffer, req.file.originalname);

    console.log(`[upload] ${records.length} rows | ${periodStart} ~ ${periodEnd}`);

    const uniqueNames = [...new Set(records.map(r => r.employee_name))];
    const { matchMap, unmatchedNames } = await resolveEmployeesByName(uniqueNames);

    // ── Detect monthly data and auto-split into two 15-day periods ──────────
    const startDate  = new Date(periodStart);
    const endDate    = new Date(periodEnd);
    const totalDays  = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const isMonthly  = totalDays > 16;

    let periodsCreated = [];

    if (isMonthly) {
      // Period 1: day 1 → day 15
      const p1End = new Date(startDate);
      p1End.setDate(startDate.getDate() + 14);
      const p1EndStr = p1End.toISOString().split('T')[0];

      // Period 2: day 16 → last day
      const p2Start = new Date(p1End);
      p2Start.setDate(p1End.getDate() + 1);
      const p2StartStr = p2Start.toISOString().split('T')[0];

      const ratio1 = 15 / totalDays;
      const ratio2 = (totalDays - 15) / totalDays;

      const period1Id = await findOrCreatePayrollPeriod(periodStart, p1EndStr, req.adminUser.id);
      const period2Id = await findOrCreatePayrollPeriod(p2StartStr, periodEnd, req.adminUser.id);

      const batchId = randomUUID();

      // Raw import archive (use full period as before)
      const importRows = records.map(r => ({
        import_batch_id: batchId, source_file: sourceFile, company,
        period_start: periodStart, period_end: periodEnd,
        employee_no: r.employee_no, employee_name: r.employee_name, department: r.department,
        required_hours: r.required_hours, actual_hours: r.actual_hours,
        late_times: r.late_times, late_minutes: r.late_minutes,
        early_leave_times: r.early_leave_times, early_leave_minutes: r.early_leave_minutes,
        overtime_regular: r.overtime_regular, overtime_special: r.overtime_special,
        attend_required: r.attend_required, attend_actual: r.attend_actual,
        business_trip: r.business_trip, absences: r.absences, on_leave: r.on_leave,
        bonus_note: r.bonus_note, ot_allowance: r.ot_allowance, allowance: r.allowance,
        deduction_late_early: r.deduction_late_early, deduction_on_leave: r.deduction_on_leave,
        deduction_other: r.deduction_other, actual_pay: r.actual_pay, remark: r.remark,
        payroll_period_id: period1Id,
        employee_id: matchMap.get(r.employee_name) ?? null,
        synced_to_attendance: false, imported_by: req.adminUser.id,
      }));

      const { error: importErr } = await supabase.from('attendance_summary_imports').insert(importRows);
      if (importErr) throw importErr;

      const matchedRows = importRows.filter(r => r.employee_id !== null);
      const syncRows1 = matchedRows.map(r => buildSyncRow(r, period1Id, ratio1));
      const syncRows2 = matchedRows.map(r => buildSyncRow(r, period2Id, ratio2));

      if (syncRows1.length > 0) {
        const { error: e1 } = await supabase.from('attendance_logs').upsert(syncRows1, { onConflict: 'employee_id,payroll_period_id' });
        if (e1) throw e1;
      }
      if (syncRows2.length > 0) {
        const { error: e2 } = await supabase.from('attendance_logs').upsert(syncRows2, { onConflict: 'employee_id,payroll_period_id' });
        if (e2) throw e2;
      }

      periodsCreated = [
        { id: period1Id, start: periodStart, end: p1EndStr, label: 'Period 1 (Days 1–15)' },
        { id: period2Id, start: p2StartStr, end: periodEnd, label: 'Period 2 (Days 16–end)' },
      ];

      return res.status(200).json({
        success: true, batchId,
        isMonthly: true,
        periods: periodsCreated,
        period: { start: periodStart, end: periodEnd },
        company,
        summary: {
          totalRows: records.length, matched: matchedRows.length,
          unmatched: unmatchedNames.length, unmatchedNames,
          syncedToAttendance: matchedRows.length * 2,
          note: `Monthly data auto-split into 2 × 15-day periods (${ratio1.toFixed(0)*100|0}% / ${Math.round(ratio2*100)}%)`,
        },
      });
    }

    // ── Single period (≤ 16 days) — original logic ───────────────────────────
    const payrollPeriodId = await findOrCreatePayrollPeriod(periodStart, periodEnd, req.adminUser.id);
    const batchId = randomUUID();

    const importRows = records.map(r => ({
      import_batch_id: batchId, source_file: sourceFile, company,
      period_start: periodStart, period_end: periodEnd,
      employee_no: r.employee_no, employee_name: r.employee_name, department: r.department,
      required_hours: r.required_hours, actual_hours: r.actual_hours,
      late_times: r.late_times, late_minutes: r.late_minutes,
      early_leave_times: r.early_leave_times, early_leave_minutes: r.early_leave_minutes,
      overtime_regular: r.overtime_regular, overtime_special: r.overtime_special,
      attend_required: r.attend_required, attend_actual: r.attend_actual,
      business_trip: r.business_trip, absences: r.absences, on_leave: r.on_leave,
      bonus_note: r.bonus_note, ot_allowance: r.ot_allowance, allowance: r.allowance,
      deduction_late_early: r.deduction_late_early, deduction_on_leave: r.deduction_on_leave,
      deduction_other: r.deduction_other, actual_pay: r.actual_pay, remark: r.remark,
      payroll_period_id: payrollPeriodId,
      employee_id: matchMap.get(r.employee_name) ?? null,
      synced_to_attendance: false, imported_by: req.adminUser.id,
    }));

    const { error: importErr } = await supabase.from('attendance_summary_imports').insert(importRows);
    if (importErr) throw importErr;

    const attendanceSyncRows = importRows.filter(r => r.employee_id !== null).map(r =>
      buildSyncRow(r, payrollPeriodId, 1.0)
    );

    if (attendanceSyncRows.length > 0) {
      const { error: syncErr } = await supabase.from('attendance_logs')
        .upsert(attendanceSyncRows, { onConflict: 'employee_id,payroll_period_id' });
      if (syncErr) throw syncErr;
      await supabase.from('attendance_summary_imports')
        .update({ synced_to_attendance: true })
        .eq('import_batch_id', batchId).not('employee_id', 'is', null);
    }

    res.status(200).json({
      success: true, batchId,
      period: { start: periodStart, end: periodEnd },
      company, payrollPeriodId,
      summary: {
        totalRows: records.length, matched: attendanceSyncRows.length,
        unmatched: unmatchedNames.length, unmatchedNames, syncedToAttendance: attendanceSyncRows.length,
      },
    });
  } catch (err) {
    console.error('[upload-attendance] Error:', err);
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// Start
// ═════════════════════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  OPERIX ADMIN API | Port ${PORT} | 3 routes: create / update / delete user\n`);
  });
}

module.exports = app;
