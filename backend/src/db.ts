import bcrypt from 'bcryptjs';

export interface UserModel {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface ProfileModel {
  id: string;
  userId: string;
  fullName: string;
  bio?: string | null;
  githubUrl?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceModel {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberModel {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: Date;
}

export interface ProjectModel {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  ownerId: string;
  startDate?: string;
  targetDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskModel {
  id: string;
  workspaceId: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentModel {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface ActivityModel {
  id: string;
  workspaceId: string;
  projectId?: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
}

export interface MilestoneModel {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate?: string;
  status: 'UPCOMING' | 'COMPLETED';
  createdAt: Date;
}

export interface DocumentModel {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  content: string;
  authorId: string;
  updatedAt: Date;
}

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

// Existing legacy models preserved for backwards compatibility
export interface OrganizationModel {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembershipModel {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
}

export interface OpportunityModel {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationModel {
  id: string;
  userId: string;
  opportunityId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryDatabase {
  public users: UserModel[] = [];
  public profiles: ProfileModel[] = [];
  public workspaces: WorkspaceModel[] = [];
  public workspaceMembers: WorkspaceMemberModel[] = [];
  public projects: ProjectModel[] = [];
  public tasks: TaskModel[] = [];
  public comments: CommentModel[] = [];
  public activities: ActivityModel[] = [];
  public milestones: MilestoneModel[] = [];
  public documents: DocumentModel[] = [];
  public notifications: NotificationModel[] = [];

  // Legacy tables
  public organizations: OrganizationModel[] = [];
  public memberships: OrganizationMembershipModel[] = [];
  public opportunities: OpportunityModel[] = [];
  public applications: ApplicationModel[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const salt = bcrypt.genSaltSync(10);

    const user1Id = 'usr-lead';
    const user2Id = 'usr-pm';
    const user3Id = 'usr-eng';
    const user4Id = 'usr-design';

    this.users.push(
      { id: user1Id, email: 'ownerA@example.com', passwordHash: bcrypt.hashSync('OwnerA123!', salt), role: 'ORG_ADMIN' },
      { id: user2Id, email: 'ownerB@example.com', passwordHash: bcrypt.hashSync('OwnerB123!', salt), role: 'ORG_ADMIN' },
      { id: user3Id, email: 'grad@example.com', passwordHash: bcrypt.hashSync('Secret123!', salt), role: 'GRADUATE' },
      { id: user4Id, email: 'sarah.kim@example.com', passwordHash: bcrypt.hashSync('Designer123!', salt), role: 'MEMBER' }
    );

    this.profiles.push(
      {
        id: 'prof-1',
        userId: user1Id,
        fullName: 'Alex Morgan',
        bio: 'Principal Architect & Engineering Lead at Collabrix Next.',
        githubUrl: 'https://github.com/alexmorgan',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prof-2',
        userId: user2Id,
        fullName: 'Jordan Chen',
        bio: 'Staff Product Manager focused on developer workflows and intelligent tooling.',
        githubUrl: 'https://github.com/jordanchen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prof-3',
        userId: user3Id,
        fullName: 'Elena Rostova',
        bio: 'Senior Full-Stack Engineer specializing in React, TypeScript, and distributed systems.',
        githubUrl: 'https://github.com/elenarostova',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prof-4',
        userId: user4Id,
        fullName: 'Sarah Kim',
        bio: 'Lead Product Designer obsessed with typography, micro-interactions, and dark mode.',
        githubUrl: 'https://github.com/sarahkim',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Primary Workspace
    const ws1Id = 'ws-acme';
    this.workspaces.push({
      id: ws1Id,
      name: 'Collabrix Core Labs',
      slug: 'collabrix-labs',
      ownerId: user1Id,
      description: 'Main product engineering and design workspace for Collabrix Next.',
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(),
    });

    // Workspace Members
    this.workspaceMembers.push(
      { id: 'wm-1', workspaceId: ws1Id, userId: user1Id, role: 'OWNER', joinedAt: new Date(Date.now() - 86400000 * 30) },
      { id: 'wm-2', workspaceId: ws1Id, userId: user2Id, role: 'ADMIN', joinedAt: new Date(Date.now() - 86400000 * 28) },
      { id: 'wm-3', workspaceId: ws1Id, userId: user3Id, role: 'MEMBER', joinedAt: new Date(Date.now() - 86400000 * 20) },
      { id: 'wm-4', workspaceId: ws1Id, userId: user4Id, role: 'MEMBER', joinedAt: new Date(Date.now() - 86400000 * 15) }
    );

    // Projects
    const p1Id = 'proj-core';
    const p2Id = 'proj-ui';
    const p3Id = 'proj-ai';
    const p4Id = 'proj-sec';

    this.projects.push(
      {
        id: p1Id,
        workspaceId: ws1Id,
        name: 'Core High-Throughput API',
        key: 'CORE',
        description: 'Scalable data layer, real-time activity events, and resilient service boundaries.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        ownerId: user1Id,
        startDate: '2026-09-01',
        targetDate: '2026-11-15',
        createdAt: new Date(Date.now() - 86400000 * 25),
        updatedAt: new Date(),
      },
      {
        id: p2Id,
        workspaceId: ws1Id,
        name: 'Linear-Inspired Design System',
        key: 'DS',
        description: 'Design tokens, dark-first surfaces, high-density tables, and refined micro-interactions.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        ownerId: user4Id,
        startDate: '2026-09-10',
        targetDate: '2026-10-30',
        createdAt: new Date(Date.now() - 86400000 * 20),
        updatedAt: new Date(),
      },
      {
        id: p3Id,
        workspaceId: ws1Id,
        name: 'Collabrix Intelligence Engine',
        key: 'AI',
        description: 'Grounding AI in workspace context for summaries, natural task generation, and risk analysis.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        ownerId: user2Id,
        startDate: '2026-09-20',
        targetDate: '2026-11-01',
        createdAt: new Date(Date.now() - 86400000 * 15),
        updatedAt: new Date(),
      },
      {
        id: p4Id,
        workspaceId: ws1Id,
        name: 'Zero-Trust Security & RBAC',
        key: 'SEC',
        description: 'Role-based access controls, strict workspace isolation, and token rotation safeguards.',
        status: 'COMPLETED',
        priority: 'HIGH',
        ownerId: user1Id,
        startDate: '2026-08-15',
        targetDate: '2026-09-25',
        createdAt: new Date(Date.now() - 86400000 * 40),
        updatedAt: new Date(Date.now() - 86400000 * 5),
      }
    );

    // Milestones
    this.milestones.push(
      {
        id: 'ms-1',
        projectId: p1Id,
        title: 'M1: Sub-50ms Query Latency',
        description: 'Optimize index coverage and memory query structures.',
        targetDate: '2026-10-25',
        status: 'UPCOMING',
        createdAt: new Date(),
      },
      {
        id: 'ms-2',
        projectId: p2Id,
        title: 'M1: Unified Token Palette',
        description: 'All surfaces conform to neutral dark zinc and violet highlights.',
        targetDate: '2026-10-18',
        status: 'COMPLETED',
        createdAt: new Date(),
      },
      {
        id: 'ms-3',
        projectId: p3Id,
        title: 'M1: Context Grounded Summaries',
        description: 'AI model can answer questions with direct references to open tasks.',
        targetDate: '2026-10-28',
        status: 'UPCOMING',
        createdAt: new Date(),
      }
    );

    // Tasks
    const t1Id = 'task-101';
    const t2Id = 'task-102';
    const t3Id = 'task-103';
    const t4Id = 'task-104';
    const t5Id = 'task-105';
    const t6Id = 'task-106';
    const t7Id = 'task-107';
    const t8Id = 'task-108';

    this.tasks.push(
      {
        id: t1Id,
        workspaceId: ws1Id,
        projectId: p1Id,
        key: 'CORE-12',
        title: 'Implement optimistic lock handling on concurrent task mutations',
        description: 'Prevent race conditions when multiple team members drag Kanban cards simultaneously.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assigneeId: user3Id,
        creatorId: user1Id,
        dueDate: '2026-10-14',
        labels: ['backend', 'reliability'],
        createdAt: new Date(Date.now() - 86400000 * 4),
        updatedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: t2Id,
        workspaceId: ws1Id,
        projectId: p2Id,
        key: 'DS-08',
        title: 'Refine command palette keyboard navigation & backdrop blur',
        description: 'Ensure Cmd+K opens modal instantly, keys navigate seamlessly, and Esc cancels clean.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: user4Id,
        creatorId: user2Id,
        dueDate: '2026-10-13',
        labels: ['frontend', 'ux'],
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: t3Id,
        workspaceId: ws1Id,
        projectId: p3Id,
        key: 'AI-03',
        title: 'Wire Gemini-3.8-Flash for structured task parsing from plain text',
        description: 'Extract title, priority, labels, and target date from colloquial instructions with review step.',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        assigneeId: user3Id,
        creatorId: user2Id,
        dueDate: '2026-10-16',
        labels: ['ai', 'dx'],
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        id: t4Id,
        workspaceId: ws1Id,
        projectId: p3Id,
        key: 'AI-07',
        title: 'Build rule-based risk detection for unassigned high-priority work',
        description: 'Detect overdue items, bottlenecks, and unassigned urgent cards with transparent reasons.',
        status: 'DONE',
        priority: 'MEDIUM',
        assigneeId: user1Id,
        creatorId: user1Id,
        dueDate: '2026-10-10',
        labels: ['ai', 'analytics'],
        createdAt: new Date(Date.now() - 86400000 * 7),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: t5Id,
        workspaceId: ws1Id,
        projectId: p1Id,
        key: 'CORE-15',
        title: 'Benchmark memory foot-print of multi-workspace event subscriptions',
        description: 'Measure memory consumption when 50 concurrent workspaces receive activity pushes.',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: user3Id,
        creatorId: user1Id,
        dueDate: '2026-10-20',
        labels: ['backend', 'perf'],
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: t6Id,
        workspaceId: ws1Id,
        projectId: p2Id,
        key: 'DS-14',
        title: 'Implement accessible high-contrast status pills and priority badges',
        description: 'Audit WCAG 2.1 AA color contrast for all dark mode tags and border separators.',
        status: 'TODO',
        priority: 'LOW',
        assigneeId: user4Id,
        creatorId: user4Id,
        dueDate: '2026-10-24',
        labels: ['design', 'a11y'],
        createdAt: new Date(Date.now() - 86400000 * 1),
        updatedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: t7Id,
        workspaceId: ws1Id,
        projectId: p4Id,
        key: 'SEC-01',
        title: 'Enforce workspace-level query isolation across all REST handlers',
        description: 'Guarantee that tenant IDs are verified server-side regardless of client input.',
        status: 'DONE',
        priority: 'URGENT',
        assigneeId: user1Id,
        creatorId: user1Id,
        dueDate: '2026-09-20',
        labels: ['security'],
        createdAt: new Date(Date.now() - 86400000 * 22),
        updatedAt: new Date(Date.now() - 86400000 * 18),
      },
      {
        id: t8Id,
        workspaceId: ws1Id,
        projectId: p1Id,
        key: 'CORE-04',
        title: 'Configure automated database snapshotting & rollback recovery',
        description: 'Verify point-in-time recovery test scripts on staging environments.',
        status: 'BACKLOG',
        priority: 'LOW',
        assigneeId: undefined,
        creatorId: user2Id,
        dueDate: '2026-11-05',
        labels: ['devops'],
        createdAt: new Date(Date.now() - 86400000 * 12),
        updatedAt: new Date(Date.now() - 86400000 * 12),
      }
    );

    // Comments
    this.comments.push(
      {
        id: 'comm-1',
        taskId: t1Id,
        userId: user1Id,
        content: 'Elena, make sure we use a monotonically increasing revision counter for row versions.',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: 'comm-2',
        taskId: t1Id,
        userId: user3Id,
        content: 'Got it! Added unit test covering concurrent updates with mismatched revision IDs. PR opening today.',
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: 'comm-3',
        taskId: t3Id,
        userId: user2Id,
        content: 'Tested the JSON schema extraction prompt. It correctly identified due dates like "next Thursday" 100% of the time.',
        createdAt: new Date(Date.now() - 3600000 * 6),
      }
    );

    // Activities
    this.activities.push(
      {
        id: 'act-1',
        workspaceId: ws1Id,
        projectId: p3Id,
        userId: user3Id,
        action: 'STATUS_CHANGED',
        details: 'Moved AI-03 (Wire Gemini task parsing) from IN_PROGRESS to IN_REVIEW',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        id: 'act-2',
        workspaceId: ws1Id,
        projectId: p1Id,
        userId: user3Id,
        action: 'COMMENTED',
        details: 'Commented on CORE-12 (Implement optimistic lock handling)',
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: 'act-3',
        workspaceId: ws1Id,
        projectId: p2Id,
        userId: user4Id,
        action: 'CREATED_TASK',
        details: 'Created task DS-14 (Implement accessible status pills)',
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: 'act-4',
        workspaceId: ws1Id,
        projectId: p4Id,
        userId: user1Id,
        action: 'COMPLETED_PROJECT',
        details: 'Completed project Zero-Trust Security & RBAC',
        createdAt: new Date(Date.now() - 86400000 * 5),
      }
    );

    // Documents
    this.documents.push(
      {
        id: 'doc-1',
        workspaceId: ws1Id,
        projectId: p1Id,
        title: 'Architecture Decision Record: Unified Event Bus',
        content: '# ADR 004: Event Bus Integration\n\n## Status\nAccepted\n\n## Context\nWe require an event stream that handles task drag updates, status revisions, and AI summaries without polling loops.\n\n## Decision\nUse lightweight memory multiplexing in development with standard server-sent stream fallbacks.\n\n## Consequences\nEnsures sub-10ms distribution across local tabs and clean decoupling.',
        authorId: user1Id,
        updatedAt: new Date(Date.now() - 86400000 * 6),
      },
      {
        id: 'doc-2',
        workspaceId: ws1Id,
        projectId: p2Id,
        title: 'Linear Design Guidelines & Token Specifications',
        content: '# Design System Spec\n\n- Primary surfaces: Zinc 950 `#09090b` / Charcoal `#121217`\n- Borders: Subtle neutral `#27272a`\n- Accent: Violet `#8b5cf6` with glowing 10% alpha backing\n- Typography: Inter / system-ui with tight tracking (-0.02em on headings)\n- Zero superfluous modals; prefer contextual inline drawers and clean dialogs.',
        authorId: user4Id,
        updatedAt: new Date(Date.now() - 86400000 * 4),
      }
    );

    // Notifications
    this.notifications.push(
      {
        id: 'notif-1',
        userId: user3Id,
        title: 'Task Assigned',
        message: 'Alex Morgan assigned CORE-12 to you.',
        link: 'task-101',
        read: false,
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        id: 'notif-2',
        userId: user3Id,
        title: 'New Comment',
        message: 'Alex Morgan commented on CORE-12.',
        link: 'task-101',
        read: true,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: 'notif-3',
        userId: user1Id,
        title: 'Review Requested',
        message: 'Elena Rostova moved AI-03 into IN_REVIEW.',
        link: 'task-103',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 4),
      }
    );

    // Legacy seed preservation
    const orgAId = 'org-1';
    const orgBId = 'org-2';
    this.organizations.push(
      { id: orgAId, name: 'Collabrix Enterprise Labs', email: 'orgA@example.com', createdAt: new Date(), updatedAt: new Date() },
      { id: orgBId, name: 'NextWave Ventures', email: 'orgB@example.com', createdAt: new Date(), updatedAt: new Date() }
    );
    this.memberships.push(
      { id: 'mem-1', userId: user1Id, organizationId: orgAId, role: 'ADMIN' },
      { id: 'mem-2', userId: user2Id, organizationId: orgBId, role: 'ADMIN' }
    );
    this.opportunities.push(
      {
        id: 'opp-1',
        title: 'Junior Full-Stack Engineer',
        description: 'Build robust REST and GraphQL APIs with React and Node.js. Ideal for recent computer science graduates.',
        organizationId: orgAId,
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        id: 'opp-2',
        title: 'Frontend Developer Intern',
        description: 'Collaborate with UX designers and senior engineers to build accessible, modern responsive web applications.',
        organizationId: orgAId,
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      }
    );
    this.applications.push({
      id: 'app-1',
      userId: user3Id,
      opportunityId: 'opp-1',
      status: 'REVIEWED',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    });
  }

  // --- PRISMA-COMPATIBLE PROXY WRAPPERS ---

  user = {
    findUnique: async (args: { where: { email?: string; id?: string } }) => {
      if (args.where.email) {
        return this.users.find(u => u.email === args.where.email) || null;
      }
      if (args.where.id) {
        return this.users.find(u => u.id === args.where.id) || null;
      }
      return null;
    },
    findFirst: async (args?: { where?: Partial<UserModel> }) => {
      if (!args?.where) return this.users[0] || null;
      return this.users.find(u => {
        return Object.entries(args.where!).every(([k, v]) => (u as any)[k] === v);
      }) || null;
    },
    findMany: async () => {
      return this.users.map(u => ({ id: u.id, email: u.email, role: u.role }));
    },
    create: async (args: { data: Omit<UserModel, 'id'> }) => {
      const user: UserModel = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        ...args.data,
      };
      this.users.push(user);
      return user;
    },
    upsert: async (args: { where: { email: string }; update: any; create: any }) => {
      const existing = this.users.find(u => u.email === args.where.email);
      if (existing) {
        Object.assign(existing, args.update);
        return existing;
      }
      const user: UserModel = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        ...args.create,
      };
      this.users.push(user);
      return user;
    },
  };

  profile = {
    findUnique: async (args: { where: { userId: string }; include?: { user?: { select?: Record<string, boolean> } } }) => {
      const profile = this.profiles.find(p => p.userId === args.where.userId);
      if (!profile) return null;
      if (args.include?.user) {
        const user = this.users.find(u => u.id === profile.userId);
        return {
          ...profile,
          user: user ? { email: user.email, role: user.role } : null,
        };
      }
      return profile;
    },
    upsert: async (args: { where: { userId: string }; update: any; create: any }) => {
      const existing = this.profiles.find(p => p.userId === args.where.userId);
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return existing;
      }
      const newProfile: ProfileModel = {
        id: 'prof-' + Math.random().toString(36).substring(2, 9),
        ...args.create,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.profiles.push(newProfile);
      return newProfile;
    },
  };

  // Legacy wrappers for opportunity and application
  organization = {
    findUnique: async (args: { where: { email?: string; id?: string } }) => {
      if (args.where.email) return this.organizations.find(o => o.email === args.where.email) || null;
      if (args.where.id) return this.organizations.find(o => o.id === args.where.id) || null;
      return null;
    },
    upsert: async (args: { where: { email: string }; update: any; create: any }) => {
      const existing = this.organizations.find(o => o.email === args.where.email);
      if (existing) return existing;
      const newOrg = { id: 'org-' + Math.random().toString(36).substring(2, 9), ...args.create, createdAt: new Date(), updatedAt: new Date() };
      this.organizations.push(newOrg);
      return newOrg;
    },
  };

  organizationMembership = {
    findFirst: async (args: { where: { userId?: string; organizationId?: string } }) => {
      return this.memberships.find(m => {
        if (args.where.userId && m.userId !== args.where.userId) return false;
        if (args.where.organizationId && m.organizationId !== args.where.organizationId) return false;
        return true;
      }) || null;
    },
    upsert: async (args: { where: { userId_organizationId: { userId: string; organizationId: string } }; update: any; create: any }) => {
      const { userId, organizationId } = args.where.userId_organizationId;
      const existing = this.memberships.find(m => m.userId === userId && m.organizationId === organizationId);
      if (existing) return existing;
      const mem = { id: 'mem-' + Math.random().toString(36).substring(2, 9), ...args.create };
      this.memberships.push(mem);
      return mem;
    },
  };

  opportunity = {
    findMany: async (args?: { include?: { organization?: { select?: Record<string, boolean> } } }) => {
      return this.opportunities.map(opp => {
        if (args?.include?.organization) {
          const org = this.organizations.find(o => o.id === opp.organizationId);
          return { ...opp, organization: org ? { name: org.name, email: org.email } : null };
        }
        return opp;
      });
    },
    findUnique: async (args: { where: { id: string }; select?: Record<string, boolean>; include?: { organization?: { select?: Record<string, boolean> } } }) => {
      const opp = this.opportunities.find(o => o.id === args.where.id);
      if (!opp) return null;
      if (args.include?.organization) {
        const org = this.organizations.find(o => o.id === opp.organizationId);
        return { ...opp, organization: org ? { name: org.name, email: org.email } : null };
      }
      return opp;
    },
    create: async (args: { data: { title: string; description: string; organizationId: string } }) => {
      const opp = {
        id: 'opp-' + Math.random().toString(36).substring(2, 9),
        title: args.data.title,
        description: args.data.description,
        organizationId: args.data.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.opportunities.unshift(opp);
      return opp;
    },
  };

  application = {
    findUnique: async (args: { where: { id: string } }) => {
      return this.applications.find(a => a.id === args.where.id) || null;
    },
    findMany: async (args: { where: { userId?: string; opportunityId?: string }; include?: { opportunity?: boolean; user?: { select?: Record<string, boolean> } } }) => {
      return this.applications
        .filter(a => {
          if (args.where.userId && a.userId !== args.where.userId) return false;
          if (args.where.opportunityId && a.opportunityId !== args.where.opportunityId) return false;
          return true;
        })
        .map(app => {
          const item: any = { ...app };
          if (args.include?.opportunity) {
            item.opportunity = this.opportunities.find(o => o.id === app.opportunityId) || null;
          }
          if (args.include?.user) {
            const user = this.users.find(u => u.id === app.userId);
            item.user = user ? { email: user.email, role: user.role } : null;
          }
          return item;
        });
    },
    create: async (args: { data: { userId: string; opportunityId: string } }) => {
      const existing = this.applications.find(a => a.userId === args.data.userId && a.opportunityId === args.data.opportunityId);
      if (existing) {
        const err: any = new Error('Unique constraint violation');
        err.code = 'P2002';
        throw err;
      }
      const app = {
        id: 'app-' + Math.random().toString(36).substring(2, 9),
        userId: args.data.userId,
        opportunityId: args.data.opportunityId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.applications.unshift(app);
      return app;
    },
    update: async (args: { where: { id: string }; data: { status: string } }) => {
      const existing = this.applications.find(a => a.id === args.where.id);
      if (!existing) throw new Error('Application not found');
      existing.status = args.data.status;
      existing.updatedAt = new Date();
      return existing;
    },
  };

  $disconnect = async () => {};
}

export const db = new InMemoryDatabase();
export const prisma = db as any;
