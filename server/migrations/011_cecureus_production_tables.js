/**
 * CECUREUS Database Migration 011 — CecureUs Production Schema Tables (Local Test)
 *
 * Why this file was created:
 * Per the 19th Sep meeting, Shiva shared the production CecureUs database structure.
 * The allowed tables from the production REST API are:
 *   employee_list, doctor_list, doctor_category, booking_appointment
 *
 * This migration creates LOCAL versions of these tables with fake test data
 * so we can develop and test without touching the production DB at https://eap.cecureus.com/api/
 *
 * Production REST API reference (for future sync):
 *   GET/POST/PUT/DELETE https://eap.cecureus.com/api/{table_name}/{id}
 */

const { v4: uuidv4 } = require('uuid');

exports.up = async function (conn) {

  // ── 1. DOCTOR CATEGORY ──────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS doctor_category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL,
      description TEXT DEFAULT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      KEY idx_doctor_category_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── 2. DOCTOR LIST ──────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS doctor_list (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_name VARCHAR(150) NOT NULL,
      email VARCHAR(200) DEFAULT NULL,
      mobile VARCHAR(20) DEFAULT NULL,
      qualification VARCHAR(255) DEFAULT NULL,
      specialization VARCHAR(255) DEFAULT NULL,
      experience_years INT NOT NULL DEFAULT 0,
      category_id INT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      profile_photo VARCHAR(500) DEFAULT NULL,
      languages VARCHAR(255) DEFAULT 'English',
      rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
      total_sessions INT NOT NULL DEFAULT 0,
      available_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
      available_from TIME DEFAULT '09:00:00',
      available_to TIME DEFAULT '18:00:00',
      consultation_fee DECIMAL(10,2) DEFAULT 0.00,
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      status ENUM('active', 'inactive', 'on_leave') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      KEY idx_doctor_list_category (category_id),
      KEY idx_doctor_list_status (status),
      KEY idx_doctor_list_active (is_active),
      KEY idx_doctor_list_rating (rating),
      CONSTRAINT fk_doctor_category FOREIGN KEY (category_id) REFERENCES doctor_category(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── 3. EMPLOYEE LIST ────────────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS employee_list (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(50) NOT NULL,
      employee_name VARCHAR(150) NOT NULL,
      email VARCHAR(200) DEFAULT NULL,
      mobile VARCHAR(20) DEFAULT NULL,
      department VARCHAR(100) DEFAULT NULL,
      designation VARCHAR(100) DEFAULT NULL,
      company_name VARCHAR(200) DEFAULT NULL,
      company_code VARCHAR(50) DEFAULT NULL,
      date_of_joining DATE DEFAULT NULL,
      gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
      date_of_birth DATE DEFAULT NULL,
      address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      country VARCHAR(100) DEFAULT 'India',
      pincode VARCHAR(10) DEFAULT NULL,
      emergency_contact VARCHAR(20) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      status ENUM('active', 'inactive', 'terminated') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uq_employee_id (employee_id),
      KEY idx_employee_company (company_code),
      KEY idx_employee_status (status),
      KEY idx_employee_dept (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── 4. BOOKING APPOINTMENT ──────────────────────────────────
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS booking_appointment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_ref VARCHAR(50) NOT NULL,
      employee_id INT DEFAULT NULL,
      doctor_id INT DEFAULT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 45,
      session_type ENUM('video_call', 'phone_call', 'chat', 'in_person') NOT NULL DEFAULT 'video_call',
      status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending',
      meeting_link VARCHAR(500) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      reason_for_visit TEXT DEFAULT NULL,
      is_anonymous TINYINT(1) NOT NULL DEFAULT 1,
      is_paid TINYINT(1) NOT NULL DEFAULT 0,
      payment_amount DECIMAL(10,2) DEFAULT 0.00,
      cancelled_at TIMESTAMP NULL DEFAULT NULL,
      cancel_reason VARCHAR(255) DEFAULT NULL,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      feedback_rating INT DEFAULT NULL,
      feedback_comment TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uq_booking_ref (booking_ref),
      KEY idx_booking_employee (employee_id),
      KEY idx_booking_doctor (doctor_id),
      KEY idx_booking_status (status),
      KEY idx_booking_date (appointment_date),
      CONSTRAINT fk_booking_employee FOREIGN KEY (employee_id) REFERENCES employee_list(id) ON DELETE SET NULL,
      CONSTRAINT fk_booking_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_list(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── SEED: DOCTOR CATEGORIES ─────────────────────────────────
  const categories = [
    { name: 'Clinical Psychologist', desc: 'Licensed professionals for assessment, diagnosis, and treatment of mental health disorders.' },
    { name: 'Counselling Psychologist', desc: 'Specialists in talk therapy, stress management, and personal development.' },
    { name: 'Psychiatrist', desc: 'Medical doctors specializing in mental health, including medication management.' },
    { name: 'Psychotherapist', desc: 'Trained therapists using evidence-based techniques like CBT, DBT, and EMDR.' },
  ];

  for (const cat of categories) {
    await conn.execute(
      `INSERT INTO doctor_category (category_name, description) VALUES (?, ?)`,
      [cat.name, cat.desc]
    );
  }

  // ── SEED: DOCTORS ───────────────────────────────────────────
  const doctors = [
    {
      name: 'Dr. Neha Sharma',
      email: 'neha.sharma@cecureus.com',
      mobile: '9876543210',
      qual: 'Ph.D. Clinical Psychology, NIMHANS',
      spec: 'Anxiety, Stress, Depression, Trauma',
      exp: 8, catId: 1,
      bio: 'Dr. Neha Sharma is a licensed clinical psychologist with over 8 years of experience specializing in anxiety disorders, stress management, depression, and trauma recovery.',
      lang: 'English, Hindi', rating: 4.9, sessions: 412,
    },
    {
      name: 'Mr. Rohan Verma',
      email: 'rohan.verma@cecureus.com',
      mobile: '9876543211',
      qual: 'M.A. Counselling Psychology',
      spec: 'Stress, Work Stress, Anxiety, Career',
      exp: 6, catId: 2,
      bio: 'Mr. Rohan Verma specializes in workplace stress, career-related anxiety, and professional burnout.',
      lang: 'English, Hindi, Marathi', rating: 4.8, sessions: 298,
    },
    {
      name: 'Dr. Ayesha Khan',
      email: 'ayesha.khan@cecureus.com',
      mobile: '9876543212',
      qual: 'M.D. Psychiatry, AIIMS Delhi',
      spec: 'Depression, Bipolar Disorder, Sleep Disorders, OCD',
      exp: 12, catId: 3,
      bio: 'Dr. Ayesha Khan is a board-certified psychiatrist with 12 years of clinical experience in mood disorders and sleep disturbances.',
      lang: 'English, Hindi, Urdu', rating: 4.9, sessions: 687,
    },
    {
      name: 'Ms. Priya Menon',
      email: 'priya.menon@cecureus.com',
      mobile: '9876543213',
      qual: 'M.Sc. Psychotherapy',
      spec: 'Relationship Issues, Self Esteem, Grief, Anxiety',
      exp: 5, catId: 4,
      bio: 'Ms. Priya Menon is a licensed psychotherapist specializing in relationship dynamics, self-esteem building, and grief counselling.',
      lang: 'English, Malayalam, Tamil', rating: 4.7, sessions: 189,
    },
    {
      name: 'Dr. Arjun Patel',
      email: 'arjun.patel@cecureus.com',
      mobile: '9876543214',
      qual: 'Ph.D. Clinical Psychology',
      spec: 'Addiction, Anger Management, Depression, PTSD',
      exp: 10, catId: 1,
      bio: 'Dr. Arjun Patel is a clinical psychologist with a decade of experience in addiction recovery, anger management, and trauma-focused therapy.',
      lang: 'English, Gujarati, Hindi', rating: 4.8, sessions: 534,
    },
  ];

  for (const d of doctors) {
    await conn.execute(
      `INSERT INTO doctor_list (doctor_name, email, mobile, qualification, specialization, experience_years, category_id, bio, languages, rating, total_sessions, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [d.name, d.email, d.mobile, d.qual, d.spec, d.exp, d.catId, d.bio, d.lang, d.rating, d.sessions]
    );
  }

  // ── SEED: EMPLOYEES ─────────────────────────────────────────
  const employees = [
    { empId: 'EMP001', name: 'Sai Nimal', email: 'sainimal1ba@gmail.com', mobile: '9876500001', dept: 'Engineering', desig: 'Software Engineer', company: 'CecureUs', code: 'CECU01' },
    { empId: 'EMP002', name: 'Arun Kumar', email: 'arun.kumar@test.com', mobile: '9876500002', dept: 'HR', desig: 'HR Manager', company: 'CecureUs', code: 'CECU01' },
    { empId: 'EMP003', name: 'Deepa R', email: 'deepa.r@test.com', mobile: '9876500003', dept: 'Marketing', desig: 'Marketing Lead', company: 'CecureUs', code: 'CECU01' },
    { empId: 'EMP004', name: 'Vikram S', email: 'vikram.s@test.com', mobile: '9876500004', dept: 'Sales', desig: 'Sales Executive', company: 'CecureUs', code: 'CECU01' },
    { empId: 'EMP005', name: 'Kavya M', email: 'kavya.m@test.com', mobile: '9876500005', dept: 'Design', desig: 'UI/UX Designer', company: 'CecureUs', code: 'CECU01' },
  ];

  for (const e of employees) {
    await conn.execute(
      `INSERT INTO employee_list (employee_id, employee_name, email, mobile, department, designation, company_name, company_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.empId, e.name, e.email, e.mobile, e.dept, e.desig, e.company, e.code]
    );
  }

  // ── SEED: SAMPLE BOOKINGS ───────────────────────────────────
  const bookings = [
    { ref: 'CE-10001', empId: 1, docId: 1, date: '2026-09-25', time: '10:00:00', dur: 45, type: 'video_call', status: 'confirmed', link: 'https://abc.com/zoom-ce10001' },
    { ref: 'CE-10002', empId: 2, docId: 3, date: '2026-09-26', time: '14:30:00', dur: 30, type: 'phone_call', status: 'confirmed', link: 'https://abc.com/zoom-ce10002' },
    { ref: 'CE-10003', empId: 3, docId: 2, date: '2026-09-24', time: '11:00:00', dur: 60, type: 'chat', status: 'completed', link: 'https://abc.com/zoom-ce10003' },
  ];

  for (const b of bookings) {
    await conn.execute(
      `INSERT INTO booking_appointment (booking_ref, employee_id, doctor_id, appointment_date, appointment_time, duration_minutes, session_type, status, meeting_link, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [b.ref, b.empId, b.docId, b.date, b.time, b.dur, b.type, b.status, b.link]
    );
  }
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS booking_appointment');
  await conn.execute('DROP TABLE IF EXISTS employee_list');
  await conn.execute('DROP TABLE IF EXISTS doctor_list');
  await conn.execute('DROP TABLE IF EXISTS doctor_category');
};
