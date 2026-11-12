import { User, Skill, UserSkill, StudySession, CreditLedger } from '../types';

export const INITIAL_SKILLS: Skill[] = [
  { id: 1, subject_name: 'Data Structures & Algorithms', department: 'Computer Science', code: 'CS-201' },
  { id: 2, subject_name: 'Database Management Systems (SQL)', department: 'Computer Science', code: 'CS-302' },
  { id: 3, subject_name: 'Web Technologies (PHP & Full Stack)', department: 'Computer Science', code: 'CS-405' },
  { id: 4, subject_name: 'Operating Systems & Linux Kernel', department: 'Computer Science', code: 'CS-304' },
  { id: 5, subject_name: 'Machine Learning & Python', department: 'Data Science', code: 'DS-301' },
  { id: 6, subject_name: 'Probability & Applied Statistics', department: 'Data Science', code: 'DS-202' },
  { id: 7, subject_name: 'Digital Signal Processing', department: 'Electrical Engineering', code: 'EE-310' },
  { id: 8, subject_name: 'Microprocessors & Microcontrollers', department: 'Electrical Engineering', code: 'EE-205' },
  { id: 9, subject_name: 'Thermodynamics & Heat Transfer', department: 'Mechanical Engineering', code: 'ME-201' },
  { id: 10, subject_name: 'Fluid Mechanics & CAD Modeling', department: 'Mechanical Engineering', code: 'ME-303' },
  { id: 11, subject_name: 'Linear Algebra & Discrete Math', department: 'Mathematics', code: 'MA-101' },
  { id: 12, subject_name: 'Financial Accounting & Economics', department: 'Business & Management', code: 'BM-204' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    enrollment_no: 'CS2023-0182',
    department: 'Computer Science',
    semester: 5,
    role: 'student',
    credit_balance: 30,
    average_rating: 4.95,
    total_reviews: 14,
    bio: 'Junior CS student passionate about backend systems, distributed databases, and competitive programming. TA for CS-201.',
    availability: 'Weekday Evenings (6 PM - 9 PM) & Saturdays',
    status: 'active',
    created_at: '2026-09-01 10:00:00',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@campus.edu',
    enrollment_no: 'DS2023-0491',
    department: 'Data Science',
    semester: 4,
    role: 'student',
    credit_balance: 40,
    average_rating: 4.88,
    total_reviews: 19,
    bio: 'Data Science major researching computer vision. Skilled in pandas, scikit-learn, and statistical inference.',
    availability: 'Monday, Wednesday, Friday afternoons & Sunday mornings',
    status: 'active',
    created_at: '2026-09-02 11:30:00',
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'marcus.v@campus.edu',
    enrollment_no: 'ME2022-0099',
    department: 'Mechanical Engineering',
    semester: 6,
    role: 'student',
    credit_balance: 15,
    average_rating: 4.75,
    total_reviews: 8,
    bio: 'Formula Student powertrain lead. Happy to help with fluid mechanics, SolidWorks 3D, and thermodynamic cycles.',
    availability: 'Tuesdays & Thursdays (4 PM - 8 PM)',
    status: 'active',
    created_at: '2026-09-03 09:15:00',
  },
  {
    id: 4,
    name: 'Elena Rostova',
    email: 'elena.rostova@campus.edu',
    enrollment_no: 'EE2021-0312',
    department: 'Electrical Engineering',
    semester: 7,
    role: 'student',
    credit_balance: 55,
    average_rating: 4.98,
    total_reviews: 26,
    bio: 'Senior EE specializing in embedded hardware, FPGA programming, and analog circuitry. High distinction.',
    availability: 'Flexible on Weekends & Monday evenings',
    status: 'active',
    created_at: '2026-08-28 14:20:00',
  },
  {
    id: 5,
    name: 'Devin Kowalski',
    email: 'devin.k@campus.edu',
    enrollment_no: 'CS2024-0814',
    department: 'Computer Science',
    semester: 3,
    role: 'student',
    credit_balance: 20,
    average_rating: 4.60,
    total_reviews: 5,
    bio: 'Sophomore learning web engineering and Linux server administration. Great at breaking down complex topics.',
    availability: 'Weekdays after 5 PM',
    status: 'active',
    created_at: '2026-09-10 16:45:00',
  },
  {
    id: 6,
    name: 'Sophia Martinez',
    email: 'sophia.m@campus.edu',
    enrollment_no: 'MA2023-0105',
    department: 'Mathematics',
    semester: 5,
    role: 'student',
    credit_balance: 35,
    average_rating: 4.90,
    total_reviews: 12,
    bio: 'Applied math enthusiast. Love mentoring students in linear algebra, matrix decomposition, and proofs.',
    availability: 'Wednesday & Saturday mornings',
    status: 'active',
    created_at: '2026-09-05 13:00:00',
  },
];

export const INITIAL_USER_SKILLS: UserSkill[] = [
  // Alex (id: 1)
  { id: 1, user_id: 1, skill_id: 1, skill_type: 'teach' }, // DSA
  { id: 2, user_id: 1, skill_id: 2, skill_type: 'teach' }, // DBMS
  { id: 3, user_id: 1, skill_id: 3, skill_type: 'teach' }, // Web Tech (PHP)
  { id: 4, user_id: 1, skill_id: 5, skill_type: 'learn' }, // Machine Learning

  // Priya (id: 2)
  { id: 5, user_id: 2, skill_id: 5, skill_type: 'teach' }, // Machine Learning
  { id: 6, user_id: 2, skill_id: 6, skill_type: 'teach' }, // Statistics
  { id: 7, user_id: 2, skill_id: 11, skill_type: 'teach' }, // Linear Algebra
  { id: 8, user_id: 2, skill_id: 4, skill_type: 'learn' }, // Operating Systems

  // Marcus (id: 3)
  { id: 9, user_id: 3, skill_id: 9, skill_type: 'teach' }, // Thermodynamics
  { id: 10, user_id: 3, skill_id: 10, skill_type: 'teach' }, // Fluid Mechanics
  { id: 11, user_id: 3, skill_id: 2, skill_type: 'learn' }, // SQL

  // Elena (id: 4)
  { id: 12, user_id: 4, skill_id: 7, skill_type: 'teach' }, // Signal Processing
  { id: 13, user_id: 4, skill_id: 8, skill_type: 'teach' }, // Microprocessors
  { id: 14, user_id: 4, skill_id: 1, skill_type: 'learn' }, // DSA

  // Devin (id: 5)
  { id: 15, user_id: 5, skill_id: 3, skill_type: 'teach' }, // Web Tech (PHP)
  { id: 16, user_id: 5, skill_id: 4, skill_type: 'teach' }, // Linux & OS
  { id: 17, user_id: 5, skill_id: 5, skill_type: 'learn' }, // ML

  // Sophia (id: 6)
  { id: 18, user_id: 6, skill_id: 11, skill_type: 'teach' }, // Linear Algebra
  { id: 19, user_id: 6, skill_id: 6, skill_type: 'teach' }, // Probability & Stats
  { id: 20, user_id: 6, skill_id: 1, skill_type: 'learn' }, // DSA
];

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 101,
    learner_id: 1, // Alex Chen
    tutor_id: 2,   // Priya Sharma
    subject_id: 5, // Machine Learning
    topic: 'Gradient Descent Optimization & Cross-Entropy Loss derivation',
    session_date: '2026-11-12 17:00:00',
    duration_minutes: 60,
    mode: 'Campus Library',
    meeting_details: '2nd Floor Study Room B4 (Quiet Zone)',
    status: 'accepted',
    credit_cost: 10,
    created_at: '2026-11-10 14:10:00',
    learner_name: 'Alex Chen',
    tutor_name: 'Priya Sharma',
    subject_name: 'Machine Learning & Python',
  },
  {
    id: 102,
    learner_id: 3, // Marcus Vance
    tutor_id: 1,   // Alex Chen
    subject_id: 2, // DBMS
    topic: 'Relational Normalization (3NF & BCNF) and indexing strategies',
    session_date: '2026-11-13 18:30:00',
    duration_minutes: 60,
    mode: 'Online (Meet)',
    meeting_details: 'https://meet.google.com/sb-alex-marcus',
    status: 'accepted',
    credit_cost: 10,
    created_at: '2026-11-10 16:20:00',
    learner_name: 'Marcus Vance',
    tutor_name: 'Alex Chen',
    subject_name: 'Database Management Systems (SQL)',
  },
  {
    id: 103,
    learner_id: 4, // Elena Rostova
    tutor_id: 1,   // Alex Chen
    subject_id: 1, // DSA
    topic: 'Dynamic Programming on Trees & Bitmask DP',
    session_date: '2026-11-08 19:00:00',
    duration_minutes: 60,
    mode: 'Lab Room',
    meeting_details: 'Turing Computer Lab 304',
    status: 'completed',
    credit_cost: 10,
    created_at: '2026-11-06 11:00:00',
    learner_name: 'Elena Rostova',
    tutor_name: 'Alex Chen',
    subject_name: 'Data Structures & Algorithms',
  },
  {
    id: 104,
    learner_id: 2, // Priya Sharma
    tutor_id: 4,   // Elena Rostova
    subject_id: 8, // Microprocessors
    topic: 'ARM Assembly & Interrupt Vector Table setup',
    session_date: '2026-11-14 15:00:00',
    duration_minutes: 60,
    mode: 'Study Commons',
    meeting_details: 'Engineering Commons Whiteboard Pod #3',
    status: 'pending',
    credit_cost: 10,
    created_at: '2026-11-11 08:30:00',
    learner_name: 'Priya Sharma',
    tutor_name: 'Elena Rostova',
    subject_name: 'Microprocessors & Microcontrollers',
  },
];

export const INITIAL_LEDGER: CreditLedger[] = [
  {
    id: 1,
    user_id: 1,
    session_id: null,
    transaction_type: 'bonus',
    amount: 20,
    balance_after: 20,
    description: 'Welcome onboarding bonus credits upon enrollment verification',
    created_at: '2026-09-01 10:00:00',
    user_name: 'Alex Chen',
  },
  {
    id: 2,
    user_id: 2,
    session_id: null,
    transaction_type: 'bonus',
    amount: 20,
    balance_after: 20,
    description: 'Welcome onboarding bonus credits upon enrollment verification',
    created_at: '2026-09-02 11:30:00',
    user_name: 'Priya Sharma',
  },
  {
    id: 3,
    user_id: 4,
    session_id: null,
    transaction_type: 'bonus',
    amount: 20,
    balance_after: 20,
    description: 'Welcome onboarding bonus credits upon enrollment verification',
    created_at: '2026-08-28 14:20:00',
    user_name: 'Elena Rostova',
  },
  {
    id: 4,
    user_id: 4,
    session_id: 103,
    transaction_type: 'spent',
    amount: 10,
    balance_after: 55,
    description: 'Attended peer study session #103 (Data Structures & Algorithms)',
    created_at: '2026-11-08 20:00:00',
    user_name: 'Elena Rostova',
  },
  {
    id: 5,
    user_id: 1,
    session_id: 103,
    transaction_type: 'earned',
    amount: 10,
    balance_after: 30,
    description: 'Conducted peer study session #103 (Data Structures & Algorithms)',
    created_at: '2026-11-08 20:00:00',
    user_name: 'Alex Chen',
  },
];
