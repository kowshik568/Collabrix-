import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Helper: build live workspace context text
function getWorkspaceContext(workspaceId?: string) {
  const ws = workspaceId ? db.workspaces.find((w) => w.id === workspaceId) : db.workspaces[0];
  const targetWsId = ws?.id;

  const projects = db.projects.filter((p) => !targetWsId || p.workspaceId === targetWsId);
  const tasks = db.tasks.filter((t) => !targetWsId || t.workspaceId === targetWsId);
  const activities = db.activities.filter((a) => !targetWsId || a.workspaceId === targetWsId).slice(0, 10);
  const members = db.workspaceMembers.filter((m) => !targetWsId || m.workspaceId === targetWsId).map((m) => {
    const prof = db.profiles.find((p) => p.userId === m.userId);
    return `${prof?.fullName || 'User'} (${m.role})`;
  });

  const projectSummary = projects
    .map((p) => `- Project [${p.key}] "${p.name}" (Status: ${p.status}, Priority: ${p.priority}, Target: ${p.targetDate || 'None'})`)
    .join('\n');

  const taskSummary = tasks
    .map((t) => {
      const assigneeProf = t.assigneeId ? db.profiles.find((p) => p.userId === t.assigneeId) : null;
      return `- Task [${t.key}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Assignee: ${assigneeProf?.fullName || 'Unassigned'} | Due: ${t.dueDate || 'No due date'}`;
    })
    .join('\n');

  const recentActivity = activities
    .map((a) => `- ${a.action}: ${a.details}`)
    .join('\n');

  return {
    workspaceName: ws?.name || 'Workspace',
    contextText: `Workspace: ${ws?.name || 'Workspace'}\nTeam Members: ${members.join(', ')}\n\nProjects:\n${projectSummary}\n\nTasks:\n${taskSummary}\n\nRecent Activity:\n${recentActivity}`,
    tasks,
    projects,
  };
}

// 1. Conversational Workspace Assistant
router.post('/ask', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, workspaceId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { workspaceName, contextText, tasks } = getWorkspaceContext(workspaceId);

    if (aiClient) {
      try {
        const prompt = `You are Collabrix Intelligence, the AI co-pilot for the team collaboration workspace "${workspaceName}".
You have access to the following REAL project, task, and team context:

${contextText}

User Question: "${message}"

Instructions:
1. Provide a sharp, concise, authoritative answer formatted in clean Markdown.
2. Directly reference specific task keys (e.g. CORE-12, DS-08) and project names where relevant.
3. If asked for blockers, point to overdue tasks, unassigned high-priority work, or items in review.
4. If asked what to focus on today, highlight urgent and high-priority in-progress or todo tasks.
5. If the user asks about something not present in the workspace data, state clearly that it is not in the records. Do not invent fake projects.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const reply = response.text || 'No response generated.';
        return res.json({ reply, model: 'gemini-3.8-flash', grounded: true });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to rule-based engine:', geminiError?.message);
      }
    }

    // Rule-based fallback if no GEMINI_API_KEY is configured
    const lower = message.toLowerCase();
    let fallbackReply = '';

    if (lower.includes('focus') || lower.includes('today') || lower.includes('priority')) {
      const urgentTasks = tasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE');
      fallbackReply = `### Recommended Focus for Today\n\nHere are the critical items needing immediate attention in **${workspaceName}**:\n\n` +
        urgentTasks.map((t) => `- **[${t.key}] ${t.title}** (${t.priority} • Status: ${t.status} • Due: ${t.dueDate || 'ASAP'})`).join('\n') +
        `\n\n*Grounded in live workspace task records.*`;
    } else if (lower.includes('block') || lower.includes('risk') || lower.includes('stuck')) {
      const nowStr = new Date().toISOString().split('T')[0];
      const overdue = tasks.filter((t) => t.dueDate && t.dueDate < nowStr && t.status !== 'DONE');
      const unassigned = tasks.filter((t) => !t.assigneeId && (t.priority === 'URGENT' || t.priority === 'HIGH'));
      fallbackReply = `### Blocker & Risk Assessment\n\n` +
        (overdue.length > 0 ? `**Overdue Work:**\n` + overdue.map((t) => `- [${t.key}] "${t.title}" (Due: ${t.dueDate})`).join('\n') : `✅ No tasks are currently overdue.\n`) +
        `\n` +
        (unassigned.length > 0 ? `**Unassigned High-Priority Items:**\n` + unassigned.map((t) => `- [${t.key}] "${t.title}"`).join('\n') : `✅ All high-priority work has assigned owners.`);
    } else {
      const doneCount = tasks.filter((t) => t.status === 'DONE').length;
      fallbackReply = `### Workspace Summary for ${workspaceName}\n\n` +
        `- **Active Projects:** ${db.projects.length} projects\n` +
        `- **Task Velocity:** ${doneCount} of ${tasks.length} tasks completed (${Math.round((doneCount / (tasks.length || 1)) * 100)}%)\n` +
        `- **Open Work:** ${tasks.length - doneCount} items across Backlog, Todo, In Progress, and Review.\n\n` +
        `*Tip: Set \`GEMINI_API_KEY\` in your environment to enable full conversational LLM capabilities.*`;
    }

    res.json({
      reply: fallbackReply,
      model: 'rule-based-grounded-engine',
      grounded: true,
      note: !apiKey ? 'Add GEMINI_API_KEY to environment for Gemini-3.8-Flash answers.' : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Natural Language to Structured Task Draft (Requires confirmation before save)
router.post('/parse-task', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { input, workspaceId, projectId } = req.body;
    if (!input) return res.status(400).json({ error: 'Input instruction is required' });

    const targetProject = projectId
      ? db.projects.find((p) => p.id === projectId)
      : db.projects.find((p) => p.workspaceId === workspaceId) || db.projects[0];

    const draft = {
      title: input,
      description: 'Created via Collabrix Intelligence natural language parser.',
      priority: 'MEDIUM' as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
      labels: ['general'],
      suggestedDueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      projectId: targetProject?.id || '',
      projectName: targetProject?.name || 'Default Project',
    };

    if (aiClient) {
      try {
        const prompt = `You are a structured task parser. Extract a task definition from this user request:
"${input}"

Return ONLY valid JSON matching this schema:
{
  "title": string,
  "description": string,
  "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
  "labels": string[],
  "daysUntilDue": number
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const raw = response.text || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          draft.title = parsed.title || draft.title;
          draft.description = parsed.description || draft.description;
          if (['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.priority)) {
            draft.priority = parsed.priority;
          }
          if (Array.isArray(parsed.labels) && parsed.labels.length > 0) {
            draft.labels = parsed.labels;
          }
          if (typeof parsed.daysUntilDue === 'number') {
            draft.suggestedDueDate = new Date(Date.now() + 86400000 * parsed.daysUntilDue).toISOString().split('T')[0];
          }
        }
      } catch (err) {
        console.warn('AI parsing failed, using heuristic extraction:', err);
      }
    } else {
      // Heuristic parsing
      const lower = input.toLowerCase();
      if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap')) {
        draft.priority = 'URGENT';
      } else if (lower.includes('high priority') || lower.includes('important')) {
        draft.priority = 'HIGH';
      } else if (lower.includes('low priority') || lower.includes('minor')) {
        draft.priority = 'LOW';
      }

      const labels = [];
      if (lower.includes('api') || lower.includes('backend') || lower.includes('database')) labels.push('backend');
      if (lower.includes('ui') || lower.includes('frontend') || lower.includes('css')) labels.push('frontend');
      if (lower.includes('test') || lower.includes('qa')) labels.push('testing');
      if (lower.includes('bug') || lower.includes('fix')) labels.push('bug');
      if (labels.length > 0) draft.labels = labels;

      draft.title = input.replace(/^(create|add|make|schedule)\s+(a\s+)?(task\s+)?(for\s+)?/i, '').trim();
    }

    res.json({
      draft,
      requiresConfirmation: true,
      message: 'Review and confirm task details before creating.',
    });
  } catch (err) {
    next(err);
  }
});

// 3. Project Planning Assistant
router.post('/project-plan', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal, workspaceId } = req.body;
    if (!goal) return res.status(400).json({ error: 'Goal is required' });

    if (aiClient) {
      try {
        const prompt = `You are a Senior Technical Project Manager at Collabrix.
Create a structured project rollout plan for this goal: "${goal}".
Return ONLY valid JSON with this format:
{
  "projectName": string,
  "description": string,
  "key": string (3-4 uppercase letters),
  "milestones": [
    { "title": string, "description": string, "targetWeeks": number }
  ],
  "tasks": [
    { "title": string, "description": string, "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW", "labels": string[], "milestoneIndex": number }
  ],
  "potentialRisks": string[]
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const raw = response.text || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const plan = JSON.parse(jsonMatch[0]);
          return res.json({ plan, generatedBy: 'gemini-3.8-flash' });
        }
      } catch (err) {
        console.warn('AI planning failed, fallback to template plan:', err);
      }
    }

    // High-quality deterministic fallback plan
    const key = goal.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRJ') || 'PRJ';
    const fallbackPlan = {
      projectName: goal,
      description: `Structured execution plan for: ${goal}`,
      key,
      milestones: [
        { title: 'Phase 1: Architecture & Specifications', description: 'Define data models, API contracts, and user flows.', targetWeeks: 1 },
        { title: 'Phase 2: Core Implementation', description: 'Build backend handlers, frontend components, and state management.', targetWeeks: 3 },
        { title: 'Phase 3: QA, Security & Deployment', description: 'Verify edge cases, perform load testing, and deploy to production.', targetWeeks: 4 },
      ],
      tasks: [
        { title: 'Draft technical design specification & API schema', description: 'Review constraints and team alignment.', priority: 'HIGH', labels: ['spec', 'architecture'], milestoneIndex: 0 },
        { title: 'Build database models and migration scripts', description: 'Ensure indexing and referential integrity.', priority: 'URGENT', labels: ['backend'], milestoneIndex: 1 },
        { title: 'Implement frontend views & interaction states', priority: 'HIGH', description: 'Dark-first Linear UI conforming to design tokens.', labels: ['frontend'], milestoneIndex: 1 },
        { title: 'Comprehensive test coverage & security audit', priority: 'MEDIUM', description: 'Verify authorization barriers and validation.', labels: ['qa', 'security'], milestoneIndex: 2 },
      ],
      potentialRisks: [
        'Scope creep during Phase 2 implementation',
        'API latency bottlenecks under high concurrent access',
        'Unclear requirement definitions without design prototype',
      ],
    };

    res.json({ plan: fallbackPlan, generatedBy: 'template-engine' });
  } catch (err) {
    next(err);
  }
});

// 4. Smart Summaries
router.post('/summarize', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, projectId, workspaceId } = req.body;
    const { workspaceName, contextText, tasks, projects } = getWorkspaceContext(workspaceId);

    const targetProject = projectId ? projects.find((p) => p.id === projectId) : null;

    if (aiClient) {
      try {
        const prompt = `You are Collabrix Intelligence. Generate a high-impact, professional executive summary.
Summary Type: ${type || 'progress'} (options: progress, weekly, blockers)
Target Project: ${targetProject ? targetProject.name : 'All Projects in ' + workspaceName}

Context Data:
${contextText}

Format in pristine, concise Markdown with bullet points and clear sections.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        return res.json({ summary: response.text || 'Summary unavailable.', model: 'gemini-3.8-flash' });
      } catch (err) {
        console.warn('AI summary failed:', err);
      }
    }

    // Deterministic grounded summary
    const doneTasks = tasks.filter((t) => t.status === 'DONE');
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW');
    const nowStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < nowStr && t.status !== 'DONE');

    const summary = `## ${workspaceName} • Executive ${type === 'weekly' ? 'Weekly' : type === 'blockers' ? 'Blocker' : 'Progress'} Report

### 🎯 Key Highlights
- **Overall Completion:** ${doneTasks.length} of ${tasks.length} tasks marked Done (${Math.round((doneTasks.length / (tasks.length || 1)) * 100)}% velocity).
- **Active Workstreams:** ${inProgressTasks.length} tasks currently in flight across ${projects.length} tracked projects.

### ⚡ Critical Work In Progress
${inProgressTasks.slice(0, 4).map((t) => `- **[${t.key}]** ${t.title} (${t.priority} priority)`).join('\n') || '- No tasks currently in progress.'}

### ⚠️ Risks & Overdue Attention
${overdueTasks.length > 0 ? overdueTasks.map((t) => `- **[${t.key}]** ${t.title} (Target was ${t.dueDate})`).join('\n') : '✅ Zero overdue tasks recorded.'}

---
*Generated by Collabrix Intelligence based on live workspace records.*`;

    res.json({ summary, model: 'rule-based-grounded-engine' });
  } catch (err) {
    next(err);
  }
});

// 5. Rule-Based Transparent Insights
router.get('/insights', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const { tasks, projects } = getWorkspaceContext(workspaceId);

    const nowStr = new Date().toISOString().split('T')[0];
    const insights: Array<{
      id: string;
      type: 'RISK' | 'BOTTLENECK' | 'OPPORTUNITY';
      title: string;
      description: string;
      evidence: string;
      suggestedAction: string;
    }> = [];

    // Check overdue tasks
    const overdue = tasks.filter((t) => t.dueDate && t.dueDate < nowStr && t.status !== 'DONE');
    if (overdue.length > 0) {
      insights.push({
        id: 'ins-overdue',
        type: 'RISK',
        title: `${overdue.length} Overdue Task${overdue.length > 1 ? 's' : ''} Detected`,
        description: 'Tasks with past due dates are still incomplete and may affect upcoming milestone delivery.',
        evidence: overdue.map((t) => `${t.key} (Due ${t.dueDate})`).join(', '),
        suggestedAction: 'Reschedule due dates or reallocate resources to unblock delivery.',
      });
    }

    // Check unassigned high-priority work
    const unassignedUrgent = tasks.filter((t) => !t.assigneeId && (t.priority === 'URGENT' || t.priority === 'HIGH'));
    if (unassignedUrgent.length > 0) {
      insights.push({
        id: 'ins-unassigned',
        type: 'BOTTLENECK',
        title: 'High-Priority Tasks Without Owners',
        description: 'Critical tasks are currently unassigned and at risk of stalling.',
        evidence: unassignedUrgent.map((t) => `${t.key}: ${t.title}`).join(', '),
        suggestedAction: 'Assign available team members to these high-priority items.',
      });
    }

    // Check workload concentration
    const assigneeCounts: Record<string, number> = {};
    tasks.filter((t) => t.status !== 'DONE' && t.assigneeId).forEach((t) => {
      assigneeCounts[t.assigneeId!] = (assigneeCounts[t.assigneeId!] || 0) + 1;
    });

    const overloaded = Object.entries(assigneeCounts).filter(([_, count]) => count >= 3);
    if (overloaded.length > 0) {
      const names = overloaded.map(([userId, count]) => {
        const prof = db.profiles.find((p) => p.userId === userId);
        return `${prof?.fullName || 'User'} (${count} active tasks)`;
      });
      insights.push({
        id: 'ins-workload',
        type: 'BOTTLENECK',
        title: 'Workload Concentration Imbalance',
        description: 'A significant portion of open work is assigned to a single team member.',
        evidence: names.join(', '),
        suggestedAction: 'Distribute tasks across teammates to avoid individual burn-out.',
      });
    }

    // Project progress opportunity
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
    if (activeProjects.length > 0) {
      insights.push({
        id: 'ins-velocity',
        type: 'OPPORTUNITY',
        title: `${activeProjects.length} Active Projects In Progress`,
        description: 'Sprint velocity is healthy with active development across key initiatives.',
        evidence: activeProjects.map((p) => p.name).join(', '),
        suggestedAction: 'Schedule weekly milestone checkpoint with team leads.',
      });
    }

    res.json(insights);
  } catch (err) {
    next(err);
  }
});

export default router;
