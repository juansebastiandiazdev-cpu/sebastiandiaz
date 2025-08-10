


import React from 'react';

export type View = 'dashboard' | 'accounts' | 'team' | 'tasks' | 'leaderboard' | 'my-week' | 'knowledge-center' | 'performance' | 'reports' | 'datamanagement' | 'leave';

export type TaskFilter = {
  status?: TaskStatus | 'Overdue';
  priority?: TaskPriority;
  weeklyGoalCategory?: string;
  assigneeId?: string;
}

export type AccountFilter = {
    status?: ClientStatus;
}

export interface Notification {
    id: string;
    type: 'alert' | 'info' | 'success';
    message: string;
    timestamp: string;
    read: boolean;
    link?: {
        view: View;
        itemId: string;
    };
}

export interface AIInsight {
    id: string;
    text: string;
    type: 'risk' | 'opportunity' | 'info';
    urgency: 'low' | 'medium' | 'high';
    action?: {
        label: string;
        handler: () => void;
    };
}

export interface AICommand {
    action: 'navigate' | 'answer' | 'clarify';
    view?: View;
    filter?: Record<string, unknown>;
    itemId?: string;
    text?: string;
}


// Base Enums
export enum ClientStatus {
  Healthy = 'Healthy',
  AtRisk = 'At-Risk',
  Critical = 'Critical',
}

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Overdue = 'Overdue',
  Completed = 'Completed',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent' // Retaining for compatibility, though new data may not use it
}

// Gamification
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.FC<{className?: string}>;
    level?: 'Bronze' | 'Silver' | 'Gold';
    rarity?: number;
}

export interface UserAchievement extends Achievement {
    earnedOn: string; // ISO date string
}

export interface ShoutOut {
  id: string;
  from: {
    name: string;
    avatarInitials: string;
  };
  to: {
    name: string;
    avatarInitials: string;
  };
  message: string;
  date: string; // ISO String
}

export interface DepartmentalRanking {
  department: string;
  averageScore: number;
  memberCount: number;
  rank: number;
}

// --- PTL & Coaching Interfaces ---
export interface ActionItem {
    id:string;
    text: string;
    completed: boolean;
}

export interface CoachingFeedForward {
    id: string;
    sessionDate: string; // ISO String
    leaderActions: ActionItem[];
    employeeActions: ActionItem[];
    summary: string;
}

export interface BusinessReview {
    id: string;
    sessionDate: string; // ISO String
    leaderActions: ActionItem[];
    clientActions: ActionItem[];
    summary: string;
    followUpEmailDraft?: string;
}

export interface PtlFactor {
    name: 'Performance' | 'Tenure' | 'Client Health' | 'Workload' | 'Trend' | 'Status Notes' | 'Medical Leaves (YTD)' | 'Permissions (YTD)';
    value: string | number;
    impact: 'Positive' | 'Neutral' | 'Negative';
    description: string;
}

export interface PtlReport {
    riskScore: number; // 0-100, lower is better
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: PtlFactor[];
    summary: string; // AI generated summary
}

export interface PtlAnalysis {
    analysis: string;
    mitigation: string[];
}


// TeamMember-related interfaces
export interface HomeOfficeInfo {
  status: string;
  notes: string;
  approvalDate?: string; // ISO String
  daysPerWeek?: number;
  clientApprovalDocumentLink?: string;
}

export interface TaskSnapshot {
  pending: number;
  inProgress: number;
  overdue: number;
}

export interface LeaveLogEntry {
    date: string; // ISO String
    type: 'Medical' | 'Permission' | 'Vacation';
    reason: string;
    isBillable: boolean; // If true, it was approved by the client.
    days: number; // The duration of the leave in days.
}


// --- NEW KPI GROUP SYSTEM ---
export interface KpiDefinition {
    id: string;
    name: string;
    type: 'number' | 'percentage';
    goal: number;
    points: number; // Points awarded for meeting 100% of the goal
}

export interface KpiGroup {
    id: string;
    name: string;
    role: string; // e.g., "Recruiter", "Scheduler"
    kpis: KpiDefinition[];
}

export interface KpiProgress {
    id: string; // Unique ID for this progress entry
    teamMemberId: string;
    kpiDefinitionId: string;
    actual: number; // Current week's value
}


export interface WeeklyPerformanceSnapshot {
    teamMemberId: string;
    weekOf: string; // ISO date string for start of week
    performanceScore: number;
    kpiSnapshots?: {
        name: string;
        type: 'number' | 'percentage';
        goal: number;
        points: number;
        actual: number;
    }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarInitials: string;
  department: string;
  skills: string[];
  hireDate: string; // ISO String
  homeOffice: HomeOfficeInfo;
  kpiGroupId: string | null;
  assignedKpis: string[];
  leaveLog?: LeaveLogEntry[];
  vacationEntitlement: number;


  // Enriched data
  taskSnapshot?: TaskSnapshot;
  performanceScore: number;
  achievements: UserAchievement[];
  
  // Leaderboard enhancements
  completedTasksCount: number;
  kpisMetRate: number;
  previousPerformanceScore: number;
  rankHistory: number[];
  onFireStreak: number;

  // New properties for ranking
  rank: number;
  previousRank: number;

  // New properties for PTL & Coaching
  ptlReport?: PtlReport;
  coachingSessions?: CoachingFeedForward[];
}


// Client-related interfaces
export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

export interface PulseLogEntry {
  id: string;
  date: string; // ISO String
  type: string;
  notes: string;
}

export interface SopInfo {
  exists: boolean;
  lastUpdatedDate?: string; // ISO String
  documentLink?: string;
  format: string;
}

export interface KpiReportingInfo {
  frequency: string;
  lastReportSentDate?: string; // ISO String
  reportLocationLink?: string;
  clientPreferenceNotes?: string;
}

export interface DocumentationChecklist {
    accountInfo: boolean;
    kpiReports: boolean;
    hoApproval: boolean;
    sops: boolean;
}

export interface ClientDashboardConfig {
    kpiSummary?: string;
    healthSummary?: string;
    highlights?: string[];
    updatedAt: string; // ISO String
}

export interface EmailLog {
    // Define structure if needed
}

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  tags: string[];
  contactInfo: ContactInfo;
  notes: string; // General descriptive notes
  assignedTeamMembers: string[];
  pulseLog: PulseLogEntry[];
  sop: SopInfo;
  kpiReporting: KpiReportingInfo;
  sharepointFolderLink: string;
  documentationChecklist: DocumentationChecklist;
  folderOrganizationStatus: string;
  emailLogs: EmailLog[];
  dashboardConfig?: ClientDashboardConfig;
  businessReviews?: BusinessReview[];
  trackedKpis?: { teamMemberId: string; kpiDefinitionId: string; }[];
  
  // New structured data fields (migrated from parsed notes)
  poc: string[];
  salesManager: string;
  startDate: string;
  seniority: string;
  solversary: string;
  wbr: string;
  phoneSystem: string;

  // Enriched data
  team: TeamMember[];
  openTasksCount: number;
  performanceHistory?: { weekOf: string; score: number }[];
  aiHealthSummary?: { summary: string; generatedAt: string; };
}


// Task-related interfaces
export interface SubTask {
    id: string;
    text: string;
    completed: boolean;
}

export interface Task {
  id:string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string; // ISO String
  assignedTo: string;
  clientId: string | null;
  priority: TaskPriority;
  elapsedTimeSeconds: number;
  subTasks?: SubTask[];
  weeklyGoalCategory?: 'urgent' | 'admin' | 'client' | 'team' | 'product' | 'event';
  taskType?: 'task' | 'event';

  // Enriched data
  assignee?: TeamMember;
  client?: Client;
}

export interface ScheduledTask extends Task {
  day: number; // 0=Mon, 1=Tue, ...
  startMinutes: number; // from midnight
  durationMinutes: number;
}

export type ApiScheduledTaskInfo = {
    taskId: string;
    dayIndex: number;
    startMinutes: number;
    durationMinutes: number;
};

export type ScheduleResponse = {
    scheduledTasks: ApiScheduledTaskInfo[];
    overflowTasks: string[];
};


// KPI-related interfaces (Legacy for client-specific KPIs)
export interface Kpi {
    id: string;
    name: string;
    target: number;
    actual: number;
    category: string;
    description: string;
    clientNeedAlignment: string;
    roiDemonstration: string;
    historicalData: KpiHistoricalData[];
    lowerIsBetter?: boolean;
}

// Template-related interfaces
export interface Template {
    id: string;
    name: string;
    category: string;
    content: string;
    tags: string[];
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    // Optional fields for specific template types
    subject?: string;
    ticketPriority?: string;
    assigneeSuggestion?: string;
    reportType?: string;
    dataFields?: string[];
}

// Knowledge Center Interfaces
export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarInitials: string;
    content: string;
    createdAt: string; // ISO String
}

export interface ArticleVersion {
    content: string;
    updatedAt: string;
    authorId: string;
    authorName: string;
}

export interface Article {
    id: string;
    title: string;
    content: string; // Markdown content
    category: string; // Can be path-like, e.g., "Policies/HR"
    tags: string[];
    authorId: string;
    authorName: string;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    history: ArticleVersion[];
    comments: Comment[];
}


export interface AIAnswer {
    answer: string;
    sourceIds: string[];
}


// Additional complex types from raw data
export interface OneOnOneSession {
    // define properties
}
export interface KpiHistoricalData {
    date: string; // ISO date string
    value: number;
}

export interface KpiReportData {
    name: string;
    actual: number;
    goal: number;
    type: 'number' | 'percentage';
    previousActual: number; // For trend calculation
    teamMemberName: string;
}

// --- NEW Report Hub Types ---
export interface TeamPerformanceReportData {
    summary: string;
    topPerformers: Pick<TeamMember, 'id' | 'name' | 'performanceScore'>[];
    needsSupport: Pick<TeamMember, 'id' | 'name' | 'performanceScore'>[];
}

export interface ClientHealthReportData {
    summary: string;
    counts: {
        healthy: number;
        atRisk: number;
        critical: number;
    };
}

export interface TaskHotspotsReportData {
    summary: string;
    overdueTasks: Pick<Task, 'id' | 'title' | 'assignedTo'>[];
    highPriorityTasks: Pick<Task, 'id' | 'title' | 'assignedTo'>[];
}