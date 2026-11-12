export type Role = 'student' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type SkillType = 'teach' | 'learn';
export type SessionMode = 'Online (Meet)' | 'Campus Library' | 'Lab Room' | 'Study Commons';
export type SessionStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type TransactionType = 'earned' | 'spent' | 'bonus' | 'refund';

export interface User {
  id: number;
  name: string;
  email: string;
  enrollment_no: string;
  department: string;
  semester: number;
  role: Role;
  credit_balance: number;
  average_rating: number;
  total_reviews: number;
  bio: string;
  availability: string;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
}

export interface Skill {
  id: number;
  subject_name: string;
  department: string;
  code: string;
}

export interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  skill_type: SkillType;
}

export interface StudySession {
  id: number;
  learner_id: number;
  tutor_id: number;
  subject_id: number;
  topic: string;
  session_date: string;
  duration_minutes: number;
  mode: SessionMode;
  meeting_details: string;
  status: SessionStatus;
  credit_cost: number;
  created_at: string;
  // Join fields for frontend display
  learner_name?: string;
  tutor_name?: string;
  subject_name?: string;
}

export interface CreditLedger {
  id: number;
  user_id: number;
  session_id: number | null;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  user_name?: string;
}

export interface PeerSearchResult {
  id: number;
  name: string;
  department: string;
  semester: number;
  average_rating: number;
  total_reviews: number;
  availability: string;
  teachable_subjects: string; // comma-separated like SQL GROUP_CONCAT
  bio?: string;
  email?: string;
}
