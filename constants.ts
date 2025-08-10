

import { RocketIcon, ShieldCheckIcon, KpiChampionIcon, TaskMasterIcon, DeadlineDominatorIcon, UsersIcon, TeamIcon, CalendarIcon, AlertTriangleIcon } from './components/Icons';
import { Client, TeamMember, Task, Kpi, Template, TaskStatus, ClientStatus, TaskPriority, Achievement, UserAchievement, ShoutOut, DepartmentalRanking, SubTask, CoachingFeedForward, Article, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot, BusinessReview, KpiDefinition, PtlReport, PtlFactor, ActionItem } from './types';

export const GOALS_CONFIG = [
    { id: 'urgent', label: 'Urgent Priorities', icon: AlertTriangleIcon, color: '#ef4444' }, // red-500
    { id: 'team', label: 'Team Leadership', icon: TeamIcon, color: '#818cf8' }, // indigo-400
    { id: 'client', label: 'Client Management', icon: UsersIcon, color: '#3b82f6' }, // blue-500
    { id: 'admin', label: 'Administrative', icon: CalendarIcon, color: '#a855f7' }, // purple-500
    { id: 'product', label: 'Product Development', icon: RocketIcon, color: '#f97316' }, // orange-600
    { id: 'event', label: 'Event / Block', icon: CalendarIcon, color: '#64748b' }, // slate-500
];

const achievementsData: Achievement[] = [
  {
      "id": "ach_deadline_dominator",
      "name": "Deadline Dominator",
      "description": "Complete 10 high-priority tasks on time.",
      "icon": DeadlineDominatorIcon,
      "level": "Bronze",
      "rarity": 15
  },
  {
      "id": "ach_kpi_champion",
      "name": "KPI Champion",
      "description": "Exceed all assigned KPIs for a full month.",
      "icon": KpiChampionIcon,
      "level": "Silver",
      "rarity": 8
  },
  {
      "id": "ach_client_savior",
      "name": "Client Savior",
      "description": "Turn a 'Critical' client back to 'Healthy'.",
      "icon": ShieldCheckIcon,
      "level": "Gold",
      "rarity": 3
  },
  {
      "id": "ach_task_master",
      "name": "Task Master",
      "description": "Complete 50 tasks in a single month.",
      "icon": TaskMasterIcon,
      "level": "Silver",
      "rarity": 10
  },
   {
      "id": "ach_launch_pad",
      "name": "Launch Pad",
      "description": "Successfully onboard a new client.",
      "icon": RocketIcon,
      "level": "Bronze",
      "rarity": 20
  }
];

export const ACHIEVEMENTS: Achievement[] = achievementsData;

const lastWeekKpiPerformance = [
  { Account: 'Care of Fairfield LLC dba Synergy Homecare', Department: 'Recruiter', Soulvers: 'Neider Andres Romero Vargas', 'KPI Name': 'Recruiting Calls', 'KPI Goal': 50, 'KPI Result': 56 },
  { Account: 'Care of Fairfield LLC dba Synergy Homecare', Department: 'Recruiter', Soulvers: 'Neider Andres Romero Vargas', 'KPI Name': 'Phone Screening', 'KPI Goal': 10, 'KPI Result': 45 },
  { Account: 'Care of Fairfield LLC dba Synergy Homecare', Department: 'Recruiter', Soulvers: 'Neider Andres Romero Vargas', 'KPI Name': 'Text sent', 'KPI Goal': 30, 'KPI Result': 52 },
  { Account: 'Care of Fairfield LLC dba Synergy Homecare', Department: 'Recruiter', Soulvers: 'Neider Andres Romero Vargas', 'KPI Name': 'Emails to applicants', 'KPI Goal': 40, 'KPI Result': 48 },
  { Account: 'Endredy Enterprises LLC dba SYNERGY HomeCare', Department: 'Recruiter', Soulvers: 'Juanita Restrepo Martinez', 'KPI Name': 'Recruiting Calls', 'KPI Goal': 20, 'KPI Result': 25 },
  { Account: 'Endredy Enterprises LLC dba SYNERGY HomeCare', Department: 'Recruiter', Soulvers: 'Juanita Restrepo Martinez', 'KPI Name': 'Phone screening', 'KPI Goal': 10, 'KPI Result': 13 },
  { Account: 'Endredy Enterprises LLC dba SYNERGY HomeCare', Department: 'Recruiter', Soulvers: 'Juanita Restrepo Martinez', 'KPI Name': 'Texts Sent', 'KPI Goal': 25, 'KPI Result': 72 },
  { Account: 'Endredy Enterprises LLC dba SYNERGY HomeCare', Department: 'Recruiter', Soulvers: 'Juanita Restrepo Martinez', 'KPI Name': 'DCW Scheduled', 'KPI Goal': 5, 'KPI Result': 7 },
  { Account: 'Endredy Enterprises LLC dba SYNERGY HomeCare', Department: 'Recruiter', Soulvers: 'Juanita Restrepo Martinez', 'KPI Name': 'Hires', 'KPI Goal': 2, 'KPI Result': 3 },
  { Account: 'Just One Step LLC dba Synergy HomeCare', Department: 'HR Coordinator', Soulvers: 'Silvana Coba Cepeda', 'KPI Name': 'Productivity', 'KPI Goal': '88%', 'KPI Result': '0%' },
  { Account: 'Just One Step LLC dba Synergy HomeCare', Department: 'HR Coordinator', Soulvers: 'Silvana Coba Cepeda', 'KPI Name': 'Pre-onboarding Project completion', 'KPI Goal': '95%', 'KPI Result': '0%' },
  { Account: 'Just One Step LLC dba Synergy HomeCare', Department: 'HR Coordinator', Soulvers: 'Silvana Coba Cepeda', 'KPI Name': 'I-9 project', 'KPI Goal': '95%', 'KPI Result': '0%' },
  { Account: 'Synergy of Fredericksburg VA', Department: 'Recruiter', Soulvers: 'Mariana Andrea Peña Correa', 'KPI Name': 'Initial Contact', 'KPI Goal': '100%', 'KPI Result': '100%' },
  { Account: 'Synergy of Fredericksburg VA', Department: 'Recruiter', Soulvers: 'Mariana Andrea Peña Correa', 'KPI Name': 'Hires', 'KPI Goal': 1, 'KPI Result': 2 },
  { Account: 'Synergy of Fredericksburg VA', Department: 'Recruiter', Soulvers: 'Mariana Andrea Peña Correa', 'KPI Name': 'Interviews completed', 'KPI Goal': 5, 'KPI Result': 7 },
  { Account: 'Synergy HomeCare of Mendon', Department: 'Recruiter', Soulvers: 'Wendy Gissella Rodriguez Sanchez', 'KPI Name': 'Applicants review', 'KPI Goal': 100, 'KPI Result': 100 },
  { Account: 'Synergy HomeCare of Mendon', Department: 'Recruiter', Soulvers: 'Wendy Gissella Rodriguez Sanchez', 'KPI Name': 'Recruiting Calls', 'KPI Goal': 10, 'KPI Result': 12 },
  { Account: 'Synergy HomeCare of Mendon', Department: 'Recruiter', Soulvers: 'Wendy Gissella Rodriguez Sanchez', 'KPI Name': 'Phone screening', 'KPI Goal': 5, 'KPI Result': 6 },
  { Account: 'Synergy HomeCare of Mendon', Department: 'Recruiter', Soulvers: 'Wendy Gissella Rodriguez Sanchez', 'KPI Name': 'Text sent', 'KPI Goal': 5, 'KPI Result': 23 },
  { Account: 'Hyman & Hyman Synergy HomeCare of Sierra Vista', Department: 'Scheduler', Soulvers: 'Juliana Tarquino Martinez', 'KPI Name': 'Open shifts management', 'KPI Goal': '95%', 'KPI Result': '100%' },
  { Account: 'Hyman & Hyman Synergy HomeCare of Sierra Vista', Department: 'Scheduler', Soulvers: 'Juliana Tarquino Martinez', 'KPI Name': 'Schedule compliance', 'KPI Goal': '95%', 'KPI Result': '98%' },
  { Account: 'Hyman & Hyman Synergy HomeCare of Sierra Vista', Department: 'Scheduler', Soulvers: 'Juliana Tarquino Martinez', 'KPI Name': 'Weekend coverage', 'KPI Goal': '90%', 'KPI Result': '100%' },
  { Account: 'Hyman & Hyman Synergy HomeCare of Sierra Vista', Department: 'Scheduler', Soulvers: 'Juliana Tarquino Martinez', 'KPI Name': 'Cancelled visits', 'KPI Goal': '20%', 'KPI Result': '0%' },
  { Account: 'Weama LLC dba SYNERGY HomeCare', Department: 'Scheduler', Soulvers: 'Angelica Maria Santana Coronado', 'KPI Name': 'Open shifts management', 'KPI Goal': '95%', 'KPI Result': '100%' },
  { Account: 'Weama LLC dba SYNERGY HomeCare', Department: 'Scheduler', Soulvers: 'Angelica Maria Santana Coronado', 'KPI Name': 'Schedule compliance', 'KPI Goal': '95%', 'KPI Result': '97%' },
  { Account: 'Weama LLC dba SYNERGY HomeCare', Department: 'Scheduler', Soulvers: 'Angelica Maria Santana Coronado', 'KPI Name': 'Weekend Coverage', 'KPI Goal': '90%', 'KPI Result': '100%' },
  { Account: 'Weama LLC dba SYNERGY HomeCare', Department: 'Scheduler', Soulvers: 'Angelica Maria Santana Coronado', 'KPI Name': 'Cancelled Visits', 'KPI Goal': '20%', 'KPI Result': '8%' },
  { Account: 'Toledo Home Care Company dba Synergy HomeCare', Department: 'Recruiter', Soulvers: 'Melanie Patricia Pupo Rodriguez', 'KPI Name': 'Initial Contact', 'KPI Goal': 100, 'KPI Result': 100 },
  { Account: 'Toledo Home Care Company dba Synergy HomeCare', Department: 'Recruiter', Soulvers: 'Melanie Patricia Pupo Rodriguez', 'KPI Name': 'Interviews completed', 'KPI Goal': 5, 'KPI Result': 9 },
  { Account: 'Toledo Home Care Company dba Synergy HomeCare', Department: 'Recruiter', Soulvers: 'Melanie Patricia Pupo Rodriguez', 'KPI Name': 'Recruitment calls', 'KPI Goal': 50, 'KPI Result': 53 },
  { Account: 'Toledo Home Care Company dba Synergy HomeCare', Department: 'Recruiter', Soulvers: 'Melanie Patricia Pupo Rodriguez', 'KPI Name': 'Interviews scheduled', 'KPI Goal': 7, 'KPI Result': 8 },
  { Account: 'Toledo Home Care Company dba Synergy HomeCare', Department: 'Recruiter', Soulvers: 'Melanie Patricia Pupo Rodriguez', 'KPI Name': 'Hires', 'KPI Goal': 1, 'KPI Result': 2 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Scheduler', Soulvers: 'Lizeth Alejandra Molina Montalvo', 'KPI Name': 'Interview scheduled', 'KPI Goal': 20, 'KPI Result': 24 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Scheduler', Soulvers: 'Lizeth Alejandra Molina Montalvo', 'KPI Name': 'Interview Completed', 'KPI Goal': 15, 'KPI Result': 18 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Scheduler', Soulvers: 'Lizeth Alejandra Molina Montalvo', 'KPI Name': 'Offer extent', 'KPI Goal': 2, 'KPI Result': 2 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Scheduler', Soulvers: 'Lizeth Alejandra Molina Montalvo', 'KPI Name': 'Applicants review', 'KPI Goal': '100%', 'KPI Result': '100%' },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Marketer', Soulvers: 'Ricardo Pulid Garzon', 'KPI Name': 'New Leads', 'KPI Goal': 8, 'KPI Result': 12 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Marketer', Soulvers: 'Ricardo Pulid Garzon', 'KPI Name': 'Clients', 'KPI Goal': 4, 'KPI Result': 5 },
  { Account: 'SYNERGY HomeCare of Yuma', Department: 'Marketer', Soulvers: 'Ricardo Pulid Garzon', 'KPI Name': 'Marketing projects', 'KPI Goal': '90%', 'KPI Result': '92%' }
];


const rawData: any = {
  "teamMembers": [
    {
      "id": "juan.belalcazar",
      "name": "Juan Belalcázar",
      "role": "Operations Supervisor",
      "email": "juan.belalcazar@solvoglobal.com",
      "avatarInitials": "JB",
      "department": "Management",
      "skills": ["Leadership", "Client Strategy", "Team Management", "Operational Excellence"],
      "hireDate": "2020-02-15T00:00:00.000Z",
      "homeOffice": { "status": "HO Approved", "notes": "" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "emilio.alvear",
      "name": "Emilio Alvear",
      "role": "Client Executive",
      "email": "emilio.alvear@solvoglobal.com",
      "avatarInitials": "EA",
      "department": "Management",
      "skills": ["Project Management", "Client Relations", "SOP Development", "Reporting"],
      "hireDate": "2021-05-10T00:00:00.000Z",
      "homeOffice": { "status": "HO Approved", "notes": "" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15,
      "leaveLog": [
          { "date": "2025-06-01T00:00:00.000Z", "type": "Vacation", "reason": "Annual leave", "isBillable": true, "days": 5 }
      ]
    },
    {
      "id": "solaj418",
      "name": "Neider Andres Romero Vargas",
      "role": "Recruiter",
      "email": "neider.romero@solvoglobal.com",
      "avatarInitials": "NR",
      "department": "Recruitment",
      "skills": ["Sourcing", "Interviewing", "Onboarding"],
      "hireDate": "2022-08-01T00:00:00.000Z",
      "homeOffice": { "status": "On-Site Only", "notes": "" },
      "kpiGroupId": "recruiter_kpis",
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "solaj337",
      "name": "Juliana Tarquino Martinez",
      "role": "Scheduler",
      "email": "juliana.tarquino@solvoglobal.com",
      "avatarInitials": "JT",
      "department": "Operations Support",
      "skills": ["Process Documentation", "SOP Writing", "Training"],
      "hireDate": "2023-02-10T00:00:00.000Z",
      "homeOffice": { "status": "Eligible for HO", "notes": "" },
      "kpiGroupId": "scheduler_kpis",
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "solaj421",
      "name": "Juanita Restrepo Martinez",
      "role": "Recruiter",
      "email": "juanita.gonzalez@solvoglobal.com",
      "avatarInitials": "JG",
      "department": "Recruitment",
      "skills": ["Sourcing", "Candidate Screening"],
      "hireDate": "2023-01-05T00:00:00.000Z",
      "homeOffice": { "status": "On-Site Only", "notes": "Juanita is not happy with the current handling of the leave request process. She complains that, specifically on several occasions, we have had to request permission from the client, and the client has taken a long time to approve her requests. She believes that Solvo should have the autonomy to approve these without waiting for the client.\n\nFor example, she mentions a situation that happened a month ago where she had a family emergency — she had to take care of an aunt who had just come out of surgery and no one else in her family could look after her. Since we were not presented with documentation of a domestic emergency, we processed it as a regular leave request.\n\nShe states that Solvo needs to clearly inform her of the procedures to follow when she needs to request time off, as she feels we are not following the company’s internal manual. This puts us in a very uncomfortable position on both sides: the client disagrees with granting these types of permissions, yet still approves them, and on our side, it is very difficult to find backups on short notice. If Juanita becomes unavailable, as has happened before, it would be extremely difficult to find a backup the same day" },
      "kpiGroupId": "recruiter_kpis",
      "assignedKpis": [],
      "vacationEntitlement": 15,
      "leaveLog": [
          { "date": "2025-01-10T00:00:00.000Z", "type": "Medical", "reason": "Urgent Medical Care: Not feeling well", "isBillable": false, "days": 1 },
          { "date": "2025-01-13T00:00:00.000Z", "type": "Medical", "reason": "Medical Exam: Leaving 45 minutes earlier", "isBillable": false, "days": 0.5 },
          { "date": "2025-01-15T00:00:00.000Z", "type": "Medical", "reason": "Three-day Medical Leave: Tonsil infection", "isBillable": false, "days": 3 },
          { "date": "2025-02-10T00:00:00.000Z", "type": "Medical", "reason": "Doctor's Appointment", "isBillable": false, "days": 0.5 },
          { "date": "2025-02-18T00:00:00.000Z", "type": "Medical", "reason": "Two-day Medical Leave: Virus", "isBillable": false, "days": 2 },
          { "date": "2025-03-07T00:00:00.000Z", "type": "Permission", "reason": "Emergency Leave: Dog issue", "isBillable": true, "days": 1 },
          { "date": "2025-04-04T00:00:00.000Z", "type": "Vacation", "reason": "Planned Time Off: Family day (travel)", "isBillable": true, "days": 1 },
          { "date": "2025-04-07T00:00:00.000Z", "type": "Medical", "reason": "Two-day Medical Leave: Sore throat", "isBillable": false, "days": 2 },
          { "date": "2025-04-15T00:00:00.000Z", "type": "Permission", "reason": "Planned Time Off: Personal matter (half day)", "isBillable": true, "days": 0.5 },
          { "date": "2025-04-15T00:00:00.000Z", "type": "Medical", "reason": "Sick Day", "isBillable": false, "days": 1 },
          { "date": "2025-05-20T00:00:00.000Z", "type": "Permission", "reason": "Early out - personal matter", "isBillable": true, "days": 0.5 },
          { "date": "2025-06-12T00:00:00.000Z", "type": "Medical", "reason": "Unapproved medical leave", "isBillable": false, "days": 1 }
      ]
    },
    {
      "id": "solaj969",
      "name": "Silvana Coba Cepeda",
      "role": "HR Coordinator",
      "email": "silvana.rodriguez@solvoglobal.com",
      "avatarInitials": "SC",
      "department": "HR",
      "skills": ["HR Coordination", "Employee Relations"],
      "hireDate": "2022-11-15T00:00:00.000Z",
      "homeOffice": { "status": "HO Approved", "notes": "" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "solas093",
      "name": "Christian Adrian Seclen Torres",
      "role": "Accounting Assistant",
      "email": "christian.klen@solvoglobal.com",
      "avatarInitials": "CK",
      "department": "Finance",
      "skills": ["Accounting", "Data Entry"],
      "hireDate": "2024-03-01T00:00:00.000Z",
      "homeOffice": { "status": "On-Site Only", "notes": "Based in Peru" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "solan248",
      "name": "Wendy Gissella Rodriguez Sanchez",
      "role": "Recruiter",
      "email": "wendy.smith@solvoglobal.com",
      "avatarInitials": "WS",
      "department": "Recruitment",
      "skills": ["Recruitment", "Client Communication"],
      "hireDate": "2023-10-12T00:00:00.000Z",
      "homeOffice": { "status": "On-Site Only", "notes": "" },
      "kpiGroupId": "recruiter_kpis",
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
        "id": "solam272",
        "name": "Lizeth Alejandra Molina Montalvo",
        "role": "Scheduler",
        "email": "lizeth.hernandez@solvoglobal.com",
        "avatarInitials": "LM",
        "department": "Recruitment",
        "skills": ["Recruiting", "HR"],
        "hireDate": "2024-01-10T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "" },
        "kpiGroupId": "scheduler_kpis",
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solam977",
        "name": "Ricardo Pulid Garzon",
        "role": "Marketer",
        "email": "ricardo.montes@solvoglobal.com",
        "avatarInitials": "RG",
        "department": "Operations Support",
        "skills": ["Marketing"],
        "hireDate": "2024-01-10T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "" },
        "kpiGroupId": null,
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solam122",
        "name": "Mariana Andrea Peña Correa",
        "role": "Recruiter",
        "email": "mariana.pena@solvoglobal.com",
        "avatarInitials": "MP",
        "department": "Operations Support",
        "skills": ["Admin Support", "Scheduling"],
        "hireDate": "2023-09-01T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "Resigned, last day June 25, 2025" },
        "kpiGroupId": null,
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solae075",
        "name": "Angelica Maria Santana Coronado",
        "role": "Scheduler",
        "email": "angelica.santana@solvoglobal.com",
        "avatarInitials": "AS",
        "department": "Recruitment",
        "skills": ["Recruiting", "Scheduling"],
        "hireDate": "2023-08-15T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "" },
        "kpiGroupId": "scheduler_kpis",
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solam156",
        "name": "Melanie Patricia Pupo Rodriguez",
        "role": "Recruiter",
        "email": "melanie.cruz@solvoglobal.com",
        "avatarInitials": "MP",
        "department": "Operations Support",
        "skills": ["Scheduling"],
        "hireDate": "2023-07-20T00:00:00.000Z",
        "homeOffice": { "status": "HO Approved", "notes": "" },
        "kpiGroupId": "recruiter_kpis",
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solau089",
        "name": "Angie Paola Acuña Patiño",
        "role": "Onboarding Specialist",
        "email": "angie.perez@solvoglobal.com",
        "avatarInitials": "AP",
        "department": "Recruitment",
        "skills": ["Onboarding", "Admin"],
        "hireDate": "2025-05-10T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "New hire" },
        "kpiGroupId": null,
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solamM1",
        "name": "Mariana Marcela Arevalo Gutierrez",
        "role": "Account Specialist",
        "email": "mariana.gutierrez@solvoglobal.com",
        "avatarInitials": "MG",
        "department": "Operations Support",
        "skills": ["KPI Tracking", "Client Communication"],
        "hireDate": "2024-04-01T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "" },
        "kpiGroupId": null,
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
        "id": "solamS1",
        "name": "Sebastian Cantera Perez",
        "role": "Account Specialist",
        "email": "sebastian.perez@solvoglobal.com",
        "avatarInitials": "SP",
        "department": "Operations Support",
        "skills": ["KPI Tracking", "Client Communication"],
        "hireDate": "2024-04-01T00:00:00.000Z",
        "homeOffice": { "status": "On-Site Only", "notes": "" },
        "kpiGroupId": null,
        "assignedKpis": [],
        "vacationEntitlement": 15
    },
    {
      "id": "solasR2",
      "name": "Sofia Rojas",
      "role": "Senior Recruiter",
      "email": "sofia.rojas@solvoglobal.com",
      "avatarInitials": "SR",
      "department": "Recruitment",
      "skills": ["Sourcing", "Interviewing", "Onboarding", "Mentoring"],
      "hireDate": "2022-03-15T00:00:00.000Z",
      "homeOffice": { "status": "HO Approved", "notes": "" },
      "kpiGroupId": "recruiter_kpis",
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "soladA1",
      "name": "Daniela Alvarez",
      "role": "Data Analyst",
      "email": "daniela.alvarez@solvoglobal.com",
      "avatarInitials": "DA",
      "department": "Operations Support",
      "skills": ["SQL", "PowerBI", "Data Visualization", "Python"],
      "hireDate": "2023-11-20T00:00:00.000Z",
      "homeOffice": { "status": "HO Approved", "notes": "" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15
    },
    {
      "id": "solaqS1",
      "name": "Carlos Sanchez",
      "role": "QA Specialist",
      "email": "carlos.sanchez@solvoglobal.com",
      "avatarInitials": "CS",
      "department": "Operations Support",
      "skills": ["Quality Assurance", "Process Improvement", "SOP Auditing", "Reporting"],
      "hireDate": "2023-06-05T00:00:00.000Z",
      "homeOffice": { "status": "On-Site Only", "notes": "" },
      "kpiGroupId": null,
      "assignedKpis": [],
      "vacationEntitlement": 15
    }
  ],
  "kpis": [
      {
          "id": "kpi_rec_hires",
          "name": "Monthly Hires",
          "category": "Recruitment",
          "target": 5,
          "actual": 7,
          "description": "Total number of successful hires made in a month."
      }
  ],
  "clients": [
    {
      "id": "c997",
      "name": "Care of Fairfield LLC dba Synergy Homecare",
      "status": "Healthy",
      "tags": [ "HomeCare", "Recruitment Focus" ],
      "contactInfo": { "email": "jaykiley@synergyhomecare.com", "phone": "(203) 923-8866", "address": "" },
      "poc": ["Jay Kiley", "Laurie Kiley"],
      "salesManager": "Victor Arocho",
      "startDate": "2023-09-14",
      "seniority": "1.74 years",
      "solversary": "September 14",
      "wbr": "Monthly, via Cloudtalk",
      "phoneSystem": "Cloudtalk",
      "notes": "Strong client relationship; the client is described as kind and cooperative. Dashboard (tracking applicants, calls, texts, interviews, and hires) presented and well-received. Neider's 5% salary increase has been approved. Confirmed client's preferred weekly report format is current one. Increase proposal for Neider sent June 19, 2025, client requested a day to evaluate offering more.",
      "assignedTeamMembers": [ "solaj418" ],
      "pulseLog": [
        { "id": "pl-c997-new1", "date": "2025-06-25T10:00:00.000Z", "type": "Meeting", "notes": "Internal discussion (Juan Emilio & Juan Sebastián): Proposal for Neider's increase sent June 19th. Client asked for a day to consider offering more than 5%. Follow-up needed." },
        { "id": "pl-c997-1", "date": "2025-06-10T10:00:00.000Z", "type": "Email", "notes": "Sent email about scheduling dashboard presentation." },
        { "id": "pl-c997-2", "date": "2025-06-12T14:30:00.000Z", "type": "Call", "notes": "Brief call with Jay, mentioned he would check his calendar." },
        { "id": "pl-c997-3", "date": "2025-06-11T14:00:00.000Z", "type": "Meeting", "notes": "Met with Jay and Laurie Kiley. Dashboard well-received. Neider's salary increase approved, effective next pay period. Client confirmed preference for current weekly report format." }
      ],
      "sop": { "exists": true, "lastUpdatedDate": "2024-01-22T00:00:00.000Z", "documentLink": "sharepoint.com/sop/c997.pdf", "format": "Document" },
      "kpiReporting": { "frequency": "Monthly", "lastReportSentDate": "2025-06-01T00:00:00.000Z", "reportLocationLink": "sharepoint.com/reports/c997/", "clientPreferenceNotes": "Prefers summary dashboard view, current format is good." },
      "sharepointFolderLink": "sharepoint.com/clients/c997/",
      "documentationChecklist": { "accountInfo": true, "kpiReports": true, "hoApproval": true, "sops": true },
      "folderOrganizationStatus": "Organized",
      "emailLogs": [],
      "businessReviews": [
        { "id": "br-c997-1", "sessionDate": "2025-05-20T00:00:00.000Z", "summary": "Discussed Q2 performance, which was strong. Client is very satisfied with Neider's performance. Outlined goals for Q3, focusing on increasing the candidate pipeline.", "leaderActions": [{ "id": "la1", "text": "Draft Q3 hiring plan", "completed": false }], "clientActions": [{ "id": "ca1", "text": "Provide feedback on the new job description draft", "completed": false }] }
      ]
    },
    {
        "id": "c1015",
        "name": "Endredy Enterprises LLC dba SYNERGY HomeCare",
        "status": "At-Risk",
        "tags": [ "HomeCare", "Recruitment Focus" ],
        "contactInfo": { "email": "jendredy@synergyhomecare.com", "phone": "(717) 208-6934", "address": "" },
        "poc": ["Jennifer Endredy"],
        "salesManager": "Victor Arocho",
        "startDate": "2023-11-20",
        "seniority": "1.5 years",
        "solversary": "November 20",
        "wbr": "Every Friday",
        "phoneSystem": "Ringcentral",
        "notes": "Communication issues with client; client does not follow SOPs for requests. Juanita's high number of absences is a major concern for the client. The client is also asking for a second recruiter. Recent meeting (June 24) to address these issues. Solvo presented a new hire, Angie, as a potential second recruiter. Jennifer Endredy seemed pleased with Angie and will make a decision soon.",
        "assignedTeamMembers": [ "solaj421" ],
        "pulseLog": [
            { "id": "pl-c1015-1", "date": "2025-06-24T14:00:00.000Z", "type": "Meeting", "notes": "Met with Jennifer Endredy. Discussed communication protocols and Juanita's attendance. Presented Angie Paola Acuña as a new potential recruiter. Jennifer was receptive and pleased with Angie's profile, will confirm her decision by EOD." },
            { "id": "pl-c1015-2", "date": "2025-06-20T11:00:00.000Z", "type": "Call", "notes": "Client called to complain about Juanita's unplanned absence." },
            { "id": "pl-c1015-3", "date": "2025-06-18T09:00:00.000Z", "type": "Email", "notes": "Sent email to client to schedule urgent meeting to discuss account health." }
        ],
        "sop": { "exists": false, "format": "To be created", "notes": "Urgent need to create and get client sign-off on SOPs." },
        "kpiReporting": { "frequency": "Weekly", "lastReportSentDate": "2025-06-21T00:00:00.000Z", "reportLocationLink": "sharepoint.com/reports/c1015/", "clientPreferenceNotes": "Client wants detailed logs of all activities." },
        "sharepointFolderLink": "sharepoint.com/clients/c1015/",
        "documentationChecklist": { "accountInfo": true, "kpiReports": true, "hoApproval": false, "sops": false },
        "folderOrganizationStatus": "Needs Improvement"
    },
    {
        "id": "c001",
        "name": "Just One Step LLC dba Synergy HomeCare",
        "status": "Healthy",
        "tags": [ "HomeCare", "HR Focus" ],
        "contactInfo": { "email": "paul@synergyhomecare.com", "phone": "(813) 922-3994", "address": "" },
        "poc": ["Paul", "Erika"],
        "salesManager": "Victor Arocho",
        "startDate": "2023-01-15",
        "seniority": "2.4 years",
        "solversary": "January 15",
        "wbr": "Not established",
        "phoneSystem": "Not specified",
        "notes": "Silvana has a good relationship with the client. Main challenge is client's lack of a structured process, but they are open to suggestions. Client has approved Silvana for HO, pending documentation. Current projects include I-9 project and Pre-onboarding project.",
        "assignedTeamMembers": [ "solaj969" ],
        "pulseLog": [
            { "id": "pl-c001-1", "date": "2025-06-15T10:00:00.000Z", "type": "Email", "notes": "Client approved Home Office for Silvana. Awaiting signed document." }
        ],
        "sop": { "exists": true, "lastUpdatedDate": "2023-05-10T00:00:00.000Z", "documentLink": "sharepoint.com/sop/c001.pdf", "format": "Document" },
        "kpiReporting": { "frequency": "Bi-weekly", "lastReportSentDate": "2025-06-14T00:00:00.000Z", "reportLocationLink": "sharepoint.com/reports/c001/", "clientPreferenceNotes": "Prefers high-level summaries." },
        "sharepointFolderLink": "sharepoint.com/clients/c001/",
        "documentationChecklist": { "accountInfo": true, "kpiReports": true, "hoApproval": false, "sops": true },
        "folderOrganizationStatus": "Organized"
    },
    {
        "id": "c950",
        "name": "Synergy of Fredericksburg VA",
        "status": "Critical",
        "tags": [ "HomeCare", "Recruitment Focus" ],
        "contactInfo": { "email": "jason@synergyhomecare.com", "phone": "(540) 785-7887", "address": "" },
        "poc": ["Jason"],
        "salesManager": "Victor Arocho",
        "startDate": "2023-08-23",
        "seniority": "1.8 years",
        "solversary": "August 23",
        "wbr": "Weekly",
        "phoneSystem": "Not specified",
        "notes": "Mariana, the assigned recruiter, has resigned. Client is aware and concerned. We need to find a replacement ASAP. Jason (client) is difficult to work with and has high expectations. This is a high-churn account. Urgently need to define a transition plan and communicate it to the client.",
        "assignedTeamMembers": [ "solam122" ],
        "pulseLog": [
            { "id": "pl-c950-1", "date": "2025-06-20T16:00:00.000Z", "type": "Call", "notes": "Informed Jason about Mariana's resignation. He is not happy and expects a seamless transition with no drop in performance." }
        ],
        "sop": { "exists": false, "format": "To be created" },
        "kpiReporting": { "frequency": "Weekly", "lastReportSentDate": "2025-06-21T00:00:00.000Z", "reportLocationLink": "sharepoint.com/reports/c950/" },
        "sharepointFolderLink": "sharepoint.com/clients/c950/",
        "documentationChecklist": { "accountInfo": true, "kpiReports": true, "hoApproval": true, "sops": false },
        "folderOrganizationStatus": "Organized"
    }
  ],
  "tasks": [
    {
        "id": "task-1", "title": "Finalize Q3 hiring plan for Care of Fairfield", "description": "Review the hiring needs with Jay Kiley and finalize the sourcing strategy for the next quarter.", "status": "In Progress", "dueDate": "2025-07-05T23:59:59.000Z", "assignedTo": "juan.belalcazar", "clientId": "c997", "priority": "High", "elapsedTimeSeconds": 3600,
        "subTasks": [
          { "id": "sub-1-1", "text": "Draft initial hiring targets", "completed": true },
          { "id": "sub-1-2", "text": "Schedule review meeting with Jay", "completed": false },
          { "id": "sub-1-3", "text": "Incorporate feedback and send final plan", "completed": false }
        ],
        "weeklyGoalCategory": "client"
    },
    {
        "id": "task-2", "title": "Create and get sign-off on SOP for Endredy Enterprises", "description": "Document all standard operating procedures for recruitment and communication, and get written approval from Jennifer Endredy.", "status": "Pending", "dueDate": "2025-07-15T23:59:59.000Z", "assignedTo": "emilio.alvear", "clientId": "c1015", "priority": "High", "elapsedTimeSeconds": 0,
        "weeklyGoalCategory": "client"
    },
    {
        "id": "task-3", "title": "Address Juanita's attendance concerns with Jennifer Endredy", "description": "Proactively communicate the plan to manage Juanita's attendance and performance, including the introduction of a potential second recruiter.", "status": "Completed", "dueDate": "2025-06-25T23:59:59.000Z", "assignedTo": "juan.belalcazar", "clientId": "c1015", "priority": "Urgent", "elapsedTimeSeconds": 7200
    },
    {
        "id": "task-4", "title": "Follow up on Silvana's Home Office documentation", "description": "Contact Paul to get the signed document for Silvana's Home Office arrangement.", "status": "Pending", "dueDate": "2025-07-01T23:59:59.000Z", "assignedTo": "emilio.alvear", "clientId": "c001", "priority": "Medium", "elapsedTimeSeconds": 0,
        "weeklyGoalCategory": "admin"
    },
    {
        "id": "task-5", "title": "Develop transition plan for Synergy of Fredericksburg", "description": "Identify a replacement for Mariana and create a detailed transition plan to present to the client.", "status": "Overdue", "dueDate": "2025-06-28T23:59:59.000Z", "assignedTo": "juan.belalcazar", "clientId": "c950", "priority": "High", "elapsedTimeSeconds": 1800,
         "weeklyGoalCategory": "urgent"
    },
    {
        "id": "task-6", "title": "Prepare weekly performance report for Endredy", "description": "Compile the weekly KPI report and activity log for Jennifer Endredy.", "status": "Pending", "dueDate": "2025-06-28T23:59:59.000Z", "assignedTo": "solaj421", "clientId": "c1015", "priority": "Medium", "elapsedTimeSeconds": 0,
        "weeklyGoalCategory": "client"
    },
    {
        "id": "task-7", "title": "Update I-9 project tracker for Just One Step", "description": "Process the latest batch of I-9 forms and update the main project tracker.", "status": "In Progress", "dueDate": "2025-07-03T23:59:59.000Z", "assignedTo": "solaj969", "clientId": "c001", "priority": "Low", "elapsedTimeSeconds": 5400,
        "weeklyGoalCategory": "admin"
    }
  ],
  "shoutOuts": [
    {
      "id": "so-1", "from": { "name": "Juan Belalcázar", "avatarInitials": "JB" }, "to": { "name": "Emilio Alvear", "avatarInitials": "EA" },
      "message": "for the excellent work on the Endredy Enterprises recovery plan!", "date": "2025-06-25T12:00:00.000Z"
    },
    {
      "id": "so-2", "from": { "name": "Emilio Alvear", "avatarInitials": "EA" }, "to": { "name": "Neider Andres Romero Vargas", "avatarInitials": "NR" },
      "message": "for consistently exceeding his KPI targets for Care of Fairfield.", "date": "2025-06-24T09:30:00.000Z"
    }
  ],
  "departmentalRankings": [
      { "department": "Recruitment", "averageScore": 92, "memberCount": 5, "rank": 1 },
      { "department": "Operations Support", "averageScore": 88, "memberCount": 4, "rank": 2 },
      { "department": "Management", "averageScore": 85, "memberCount": 2, "rank": 3 },
      { "department": "HR", "averageScore": 82, "memberCount": 1, "rank": 4 }
  ],
  "articles": [],
  "kpiGroups": [
    {
        "id": "recruiter_kpis",
        "name": "Standard Recruiter KPIs",
        "role": "Recruiter",
        "kpis": [
            { "id": "rec_kpi_1", "name": "Recruiting Calls", "type": "number", "goal": 40, "points": 25 },
            { "id": "rec_kpi_2", "name": "Phone Screenings", "type": "number", "goal": 15, "points": 25 },
            { "id": "rec_kpi_3", "name": "Interviews Scheduled", "type": "number", "goal": 10, "points": 25 },
            { "id": "rec_kpi_4", "name": "Hires", "type": "number", "goal": 2, "points": 25 }
        ]
    },
    {
        "id": "scheduler_kpis",
        "name": "Standard Scheduler KPIs",
        "role": "Scheduler",
        "kpis": [
            { "id": "sch_kpi_1", "name": "Open Shifts Management", "type": "percentage", "goal": 95, "points": 40 },
            { "id": "sch_kpi_2", "name": "Schedule Compliance", "type": "percentage", "goal": 98, "points": 40 },
            { "id": "sch_kpi_3", "name": "Cancelled Visits", "type": "percentage", "goal": 5, "points": 20 }
        ]
    }
  ],
  "kpiProgress": [
    { "id": "prog_1", "teamMemberId": "solaj418", "kpiDefinitionId": "rec_kpi_1", "actual": 56 },
    { "id": "prog_2", "teamMemberId": "solaj418", "kpiDefinitionId": "rec_kpi_2", "actual": 18 },
    { "id": "prog_3", "teamMemberId": "solaj418", "kpiDefinitionId": "rec_kpi_3", "actual": 12 },
    { "id": "prog_4", "teamMemberId": "solaj418", "kpiDefinitionId": "rec_kpi_4", "actual": 3 },
    { "id": "prog_5", "teamMemberId": "solaj421", "kpiDefinitionId": "rec_kpi_1", "actual": 25 },
    { "id": "prog_6", "teamMemberId": "solaj421", "kpiDefinitionId": "rec_kpi_2", "actual": 13 },
    { "id": "prog_7", "teamMemberId": "solaj421", "kpiDefinitionId": "rec_kpi_3", "actual": 7 },
    { "id": "prog_8", "teamMemberId": "solaj421", "kpiDefinitionId": "rec_kpi_4", "actual": 1 },
    { "id": "prog_9", "teamMemberId": "solaj337", "kpiDefinitionId": "sch_kpi_1", "actual": 98 },
    { "id": "prog_10", "teamMemberId": "solaj337", "kpiDefinitionId": "sch_kpi_2", "actual": 96 },
    { "id": "prog_11", "teamMemberId": "solaj337", "kpiDefinitionId": "sch_kpi_3", "actual": 2 },
    { "id": "prog_12", "teamMemberId": "solae075", "kpiDefinitionId": "sch_kpi_1", "actual": 100 },
    { "id": "prog_13", "teamMemberId": "solae075", "kpiDefinitionId": "sch_kpi_2", "actual": 97 },
    { "id": "prog_14", "teamMemberId": "solae075", "kpiDefinitionId": "sch_kpi_3", "actual": 8 },
    { "id": "prog_15", "teamMemberId": "solam156", "kpiDefinitionId": "rec_kpi_1", "actual": 53 },
    { "id": "prog_16", "teamMemberId": "solam156", "kpiDefinitionId": "rec_kpi_2", "actual": 20 },
    { "id": "prog_17", "teamMemberId": "solam156", "kpiDefinitionId": "rec_kpi_3", "actual": 8 },
    { "id": "prog_18", "teamMemberId": "solam156", "kpiDefinitionId": "rec_kpi_4", "actual": 2 },
    { "id": "prog_19", "teamMemberId": "solasR2", "kpiDefinitionId": "rec_kpi_1", "actual": 60 },
    { "id": "prog_20", "teamMemberId": "solasR2", "kpiDefinitionId": "rec_kpi_2", "actual": 25 },
    { "id": "prog_21", "teamMemberId": "solasR2", "kpiDefinitionId": "rec_kpi_3", "actual": 15 },
    { "id": "prog_22", "teamMemberId": "solasR2", "kpiDefinitionId": "rec_kpi_4", "actual": 4 }
  ],
  "weeklySnapshots": [],
  "articleTemplates": [
    { "title": "Standard Operating Procedure (SOP)", "category": "Workflows", "content": "# SOP Title\n\n## 1. Purpose\n\n## 2. Scope\n\n## 3. Procedure\n\n### Step 1:\n\n### Step 2:\n\n## 4. Responsibilities" },
    { "title": "Meeting Notes", "category": "Meetings", "content": "# Meeting Notes: [Topic]\n\n**Date:**\n\n**Attendees:**\n\n## Agenda\n\n1. \n\n## Discussion Points\n\n- \n\n## Action Items\n\n| Task | Owner | Due Date |\n|---|---|---|\n| | | |" }
  ]
};

const processedData = (() => {
  const teamMemberMap = new Map<string, TeamMember>(rawData.teamMembers.map((m: any) => [m.id, m as TeamMember]));
  const clientMap = new Map<string, Client>(rawData.clients.map((c: any) => [c.id, c as Client]));
  const mockTasks: Task[] = rawData.tasks.map((task: any) => ({
    ...task,
    assignee: teamMemberMap.get(task.assignedTo),
    client: task.clientId ? clientMap.get(task.clientId) : undefined,
  }));
  const mockAccounts: Client[] = rawData.clients.map((client: any) => ({
    ...client,
    team: client.assignedTeamMembers.map((id: string) => teamMemberMap.get(id)).filter(Boolean) as TeamMember[],
    openTasksCount: mockTasks.filter(t => t.clientId === client.id && t.status !== TaskStatus.Completed).length,
  }));
  const mockTeamMembers: TeamMember[] = rawData.teamMembers.map((member: any) => {
    const memberTasks = mockTasks.filter(t => t.assignedTo === member.id);
    return {
      ...member,
      taskSnapshot: {
        pending: memberTasks.filter(t => t.status === TaskStatus.Pending).length,
        inProgress: memberTasks.filter(t => t.status === TaskStatus.InProgress).length,
        overdue: memberTasks.filter(t => t.status === TaskStatus.Overdue || (new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed)).length,
      },
      performanceScore: 0, // Will be calculated by the app
      completedTasksCount: memberTasks.filter(t=> t.status === TaskStatus.Completed).length,
      kpisMetRate: Math.floor(80 + Math.random() * 20),
      previousPerformanceScore: Math.floor(70 + Math.random() * 30),
      rankHistory: Array.from({ length: 10 }, () => Math.floor(Math.random() * 15 + 1)),
      onFireStreak: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
      rank: 0, 
      previousRank: 0,
      achievements: [],
    };
  });
  mockTeamMembers.sort((a, b) => b.performanceScore - a.performanceScore);
  mockTeamMembers.forEach((member, index) => {
    member.rank = index + 1;
    member.previousRank = Math.min(mockTeamMembers.length, Math.max(1, member.rank + Math.floor(Math.random() * 5) - 2));
  });
  return {
    mockTasks,
    mockAccounts,
    mockTeamMembers,
    mockShoutOuts: rawData.shoutOuts as ShoutOut[],
    departmentalRankings: rawData.departmentalRankings as DepartmentalRanking[],
    mockArticles: rawData.articles as Article[],
    mockKpis: rawData.kpis as Kpi[],
    mockKpiGroups: rawData.kpiGroups as KpiGroup[],
    mockKpiProgress: rawData.kpiProgress as KpiProgress[],
    mockWeeklySnapshots: rawData.weeklySnapshots as WeeklyPerformanceSnapshot[],
    ARTICLE_TEMPLATES: rawData.articleTemplates
  };
})();
export const {
    mockTasks,
    mockAccounts,
    mockTeamMembers,
    mockShoutOuts,
    departmentalRankings,
    mockArticles,
    mockKpis,
    mockKpiGroups,
    mockKpiProgress,
    mockWeeklySnapshots,
    ARTICLE_TEMPLATES,
} = processedData;