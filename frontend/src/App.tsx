import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Kanban,
  FolderGit2,
  Sparkles,
  BarChart3,
  FileText,
  Users,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  LogOut,
  Send,
  Shield,
  Bot,
  Briefcase,
  Menu,
  X,
  Cpu,
  Check
} from 'lucide-react';
import './App.css';

// --- DATA TYPES ---
interface UserInfo {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  memberCount: number;
  projectCount: number;
}

interface Project {
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
  taskCount?: number;
  doneTaskCount?: number;
  progress?: number;
  owner?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface Task {
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
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    key: string;
  };
  assignee?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  } | null;
  commentCount?: number;
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface Activity {
  id: string;
  workspaceId: string;
  projectId?: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface AnalyticsData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
    overdueCount: number;
  };
  priorityBreakdown: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  statusBreakdown: {
    BACKLOG: number;
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  workload: Array<{
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    totalAssigned: number;
    activeTasks: number;
    completedTasks: number;
  }>;
  overdueTasks: Array<{
    id: string;
    key: string;
    title: string;
    dueDate?: string;
    priority: string;
  }>;
}

interface AIInsight {
  id: string;
  type: 'RISK' | 'BOTTLENECK' | 'OPPORTUNITY';
  title: string;
  description: string;
  evidence: string;
  suggestedAction: string;
}

export default function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'app' | 'landing'>('landing');
  const [currentTab, setCurrentTab] = useState<
    'overview' | 'my-tasks' | 'board' | 'projects' | 'ai' | 'analytics' | 'docs' | 'team' | 'settings' | 'legacy'
  >('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('collabrix_token'));
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Core Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [taskComments, setTaskComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskTitle, setCreateTaskTitle] = useState('');
  const [createTaskDesc, setCreateTaskDesc] = useState('');
  const [createTaskProjId, setCreateTaskProjId] = useState('');
  const [createTaskPriority, setCreateTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [createTaskDueDate, setCreateTaskDueDate] = useState('');
  const [createTaskAssignee, setCreateTaskAssignee] = useState('');

  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createProjName, setCreateProjName] = useState('');
  const [createProjKey, setCreateProjKey] = useState('');
  const [createProjDesc, setCreateProjDesc] = useState('');
  const [createProjPriority, setCreateProjPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Collabrix Intelligence AI State
  const [aiTab, setAiTab] = useState<'chat' | 'nl-task' | 'planner' | 'summaries' | 'radar'>('chat');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello, I am Collabrix Intelligence. I have direct context over your workspace projects, tasks, velocity, and blockers. What would you like to investigate today?',
    },
  ]);
  const [aiInputPrompt, setAiInputPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // NL Task Creator State
  const [nlTaskPrompt, setNlTaskPrompt] = useState('');
  const [nlTaskDraft, setNlTaskDraft] = useState<any>(null);
  const [nlTaskLoading, setNlTaskLoading] = useState(false);

  // Project Planner State
  const [planGoal, setPlanGoal] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Smart Summary State
  const [summaryType, setSummaryType] = useState<'progress' | 'weekly' | 'blockers'>('progress');
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // UI Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Keyboard shortcut listener (Cmd+K for command menu, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setTaskDetailOpen(false);
        setCreateTaskModalOpen(false);
        setCreateProjectModalOpen(false);
        setAuthModalOpen(false);
        setWorkspaceSwitcherOpen(false);
        setNotifDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync token & fetch profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('collabrix_token', token);
      fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) handleLogout();
            return null;
          }
          return res.json();
        })
        .then((prof) => {
          if (prof) {
            setCurrentUser({
              userId: prof.userId,
              email: prof.user?.email || 'User',
              fullName: prof.fullName || prof.user?.email?.split('@')[0] || 'Team Lead',
              role: prof.user?.role || 'MEMBER',
              avatarUrl: prof.avatarUrl,
            });
          }
        })
        .catch(() => {});
    } else {
      localStorage.removeItem('collabrix_token');
      setCurrentUser(null);
    }
  }, [token]);

  // Load Workspaces
  const loadWorkspaces = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) loadWorkspaces();
  }, [token]);

  // Load Workspace Data (Projects, Tasks, Activities, Notifications, Analytics)
  const loadWorkspaceData = async () => {
    if (!token || !activeWorkspaceId) return;

    try {
      // 1. Projects
      const projRes = await fetch(`/api/projects?workspaceId=${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData);
        if (pData.length > 0 && !createTaskProjId) {
          setCreateTaskProjId(pData[0].id);
        }
      }

      // 2. Tasks
      const taskRes = await fetch(`/api/tasks?workspaceId=${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData);
      }

      // 3. Activities
      const actRes = await fetch(`/api/activities?workspaceId=${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (actRes.ok) {
        const aData = await actRes.json();
        setActivities(aData);
      }

      // 4. Notifications
      const notifRes = await fetch(`/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData);
      }

      // 5. Analytics
      const analRes = await fetch(`/api/analytics?workspaceId=${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analRes.ok) {
        const anData = await analRes.json();
        setAnalytics(anData);
      }

      // 6. Insights
      const insRes = await fetch(`/api/ai/insights?workspaceId=${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (insRes.ok) {
        const insData = await insRes.json();
        setInsights(insData);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    if (token && activeWorkspaceId) {
      loadWorkspaceData();
    }
  }, [token, activeWorkspaceId]);

  // Auto-login to demo account on first visit if no token exists, to give immediate rich experience
  useEffect(() => {
    if (!token) {
      quickLogin('ownerA@example.com', 'OwnerA123!');
    }
  }, []);

  // Quick switch between demo personas
  const quickLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      showToast(`Authenticated as ${email}`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    showToast('Signed out of Collabrix Next', 'info');
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (isRegistering) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const loginData = await loginRes.json();
        setToken(loginData.token);
      } else {
        setToken(data.token);
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      showToast('Welcome to Collabrix Next!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      if (res.ok) {
        const created = await res.json();
        setWorkspaces((prev) => [...prev, created]);
        setActiveWorkspaceId(created.id);
        setNewWorkspaceModalOpen(false);
        setNewWorkspaceName('');
        showToast(`Workspace "${created.name}" created!`);
      }
    } catch (err) {
      showToast('Failed to create workspace', 'error');
    }
  };

  // Task Detail & Comments
  const openTaskDetail = async (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const comments = await res.json();
        setTaskComments(comments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentText }),
      });
      if (res.ok) {
        const newComm = await res.json();
        setTaskComments((prev) => [...prev, newComm]);
        setNewCommentText('');
        showToast('Comment posted');
        loadWorkspaceData();
      }
    } catch (err) {
      showToast('Failed to post comment', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Moved to ${newStatus}`);
        loadWorkspaceData();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTaskTitle.trim() || !createTaskProjId) {
      showToast('Task title and project are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          projectId: createTaskProjId,
          title: createTaskTitle,
          description: createTaskDesc,
          priority: createTaskPriority,
          status: 'TODO',
          dueDate: createTaskDueDate || undefined,
          assigneeId: createTaskAssignee || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setCreateTaskModalOpen(false);
        setCreateTaskTitle('');
        setCreateTaskDesc('');
        showToast(`Created task ${created.key}`);
        loadWorkspaceData();
      }
    } catch (err) {
      showToast('Failed to create task', 'error');
    }
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProjName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          name: createProjName,
          key: createProjKey.toUpperCase().trim() || undefined,
          description: createProjDesc,
          priority: createProjPriority,
          status: 'PLANNED',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setProjects((prev) => [created, ...prev]);
        setCreateProjectModalOpen(false);
        setCreateProjName('');
        setCreateProjKey('');
        setCreateProjDesc('');
        showToast(`Project ${created.name} created!`);
        loadWorkspaceData();
      }
    } catch (err) {
      showToast('Failed to create project', 'error');
    }
  };

  // Collabrix Intelligence AI Handlers
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputPrompt.trim()) return;
    const userMsg = aiInputPrompt;
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setAiInputPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg, workspaceId: activeWorkspaceId }),
      });
      const data = await res.json();
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply || 'No response generated.' },
      ]);
    } catch (err) {
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error connecting to Collabrix Intelligence service.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleParseNLTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlTaskPrompt.trim()) return;
    setNlTaskLoading(true);
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: nlTaskPrompt,
          workspaceId: activeWorkspaceId,
        }),
      });
      const data = await res.json();
      setNlTaskDraft(data.draft);
      showToast('Structured task proposed. Review and confirm below.');
    } catch (err) {
      showToast('Failed to parse instruction', 'error');
    } finally {
      setNlTaskLoading(false);
    }
  };

  const handleConfirmNLTask = async () => {
    if (!nlTaskDraft) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          projectId: nlTaskDraft.projectId || projects[0]?.id,
          title: nlTaskDraft.title,
          description: nlTaskDraft.description,
          priority: nlTaskDraft.priority,
          status: 'TODO',
          dueDate: nlTaskDraft.suggestedDueDate,
          labels: nlTaskDraft.labels,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setNlTaskDraft(null);
        setNlTaskPrompt('');
        showToast(`Task ${created.key} created!`);
        loadWorkspaceData();
      }
    } catch (err) {
      showToast('Failed to save task', 'error');
    }
  };

  const handleGenerateProjectPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planGoal.trim()) return;
    setPlanLoading(true);
    try {
      const res = await fetch('/api/ai/project-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goal: planGoal, workspaceId: activeWorkspaceId }),
      });
      const data = await res.json();
      setGeneratedPlan(data.plan);
      showToast('Rollout plan generated!');
    } catch (err) {
      showToast('Failed to generate plan', 'error');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerateSummary = async (type: 'progress' | 'weekly' | 'blockers') => {
    setSummaryType(type);
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, workspaceId: activeWorkspaceId }),
      });
      const data = await res.json();
      setGeneratedSummary(data.summary);
      showToast('Summary compiled!');
    } catch (err) {
      showToast('Failed to generate summary', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Filtered Task list
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterProject !== 'ALL' && t.projectId !== filterProject) return false;
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchKey = t.key.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchAssignee = t.assignee?.fullName.toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchDesc && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, filterProject, filterPriority, searchQuery]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#2d1519' : toast.type === 'info' ? '#181b2e' : '#14251d',
            border: `1px solid ${toast.type === 'error' ? '#f43f5e' : toast.type === 'info' ? '#6366f1' : '#10b981'}`,
            color: toast.type === 'error' ? '#fda4af' : toast.type === 'info' ? '#a5b4fc' : '#a7f3d0',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PUBLIC MARKETING LANDING PAGE VIEW (When viewMode === 'landing') */}
      {/* ========================================================================= */}
      {viewMode === 'landing' ? (
        <div style={{ width: '100%', minHeight: '100vh', background: '#09090b', color: '#a1a1aa' }}>
          {/* Landing Header */}
          <nav
            style={{
              height: '64px',
              borderBottom: '1px solid #1e1e24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
              position: 'sticky',
              top: 0,
              background: 'rgba(9, 9, 11, 0.9)',
              backdropFilter: 'blur(16px)',
              zIndex: 50,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Cpu size={18} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em' }}>
                Collabrix<span style={{ color: '#8b5cf6' }}>Next</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', flexWrap: 'wrap' }}>
              <a href="#features" style={{ color: '#a1a1aa', transition: 'color 0.15s' }}>Features</a>
              <a href="#intelligence" style={{ color: '#a1a1aa', transition: 'color 0.15s' }}>Intelligence</a>
              <a href="#solutions" style={{ color: '#a1a1aa', transition: 'color 0.15s' }}>Solutions</a>
              <a href="#pricing" style={{ color: '#a1a1aa', transition: 'color 0.15s' }}>Pricing</a>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setViewMode('app')}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '13px' }}
              >
                Get started <ArrowUpRight size={14} />
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <section
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '96px 24px 64px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#c084fc',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '28px',
              }}
            >
              <Sparkles size={14} /> Next-Generation Team Collaboration SaaS
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 68px)',
                lineHeight: '1.08',
                fontWeight: 700,
                color: '#fafafa',
                letterSpacing: '-0.04em',
                maxWidth: '920px',
                margin: '0 auto 24px',
              }}
            >
              Your team’s work.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #818cf8, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Finally, in sync.
              </span>
            </h1>

            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.6',
                color: '#a1a1aa',
                maxWidth: '680px',
                margin: '0 auto 36px',
              }}
            >
              Projects, people, and progress in one intelligent workspace. Plan work, align your team, and turn everyday collaboration into measurable progress—with AI that understands your projects.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setViewMode('app')}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 600 }}
              >
                Get started <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('app');
                  setCurrentTab('board');
                }}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Explore workspace
              </button>
            </div>

            {/* Interactive Live Workspace Preview */}
            <div
              style={{
                marginTop: '64px',
                borderRadius: '12px',
                border: '1px solid #27272a',
                background: '#121217',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  height: '42px',
                  background: '#18181f',
                  borderBottom: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: '8px',
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', color: '#71717a', marginLeft: '12px' }}>
                  collabrix.app/workspace/collabrix-labs
                </span>
              </div>

              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#14141a', padding: '16px', borderRadius: '8px', border: '1px solid #22222a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>IN PROGRESS</span>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>CORE-12</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '14px', marginBottom: '8px' }}>
                    Optimistic lock handling for concurrent card mutations
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Assignee: Elena Rostova • Due Today</div>
                </div>

                <div style={{ background: '#14141a', padding: '16px', borderRadius: '8px', border: '1px solid #22222a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>IN REVIEW</span>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>AI-03</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '14px', marginBottom: '8px' }}>
                    Gemini-3.8-Flash structured task extraction from plain text
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Assignee: Elena Rostova • Ready for review</div>
                </div>

                <div style={{ background: '#14141a', padding: '16px', borderRadius: '8px', border: '1px solid #22222a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>DONE</span>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>SEC-01</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '14px', marginBottom: '8px' }}>
                    Zero-Trust workspace query isolation across all REST handlers
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Verified & audited • Alex Morgan</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: '36px', color: '#fafafa', marginBottom: '14px' }}>Engineered for Deep Focus</h2>
              <p style={{ fontSize: '16px', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
                Every view is calibrated to minimize noise, eliminate context switching, and accelerate velocity.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div style={{ background: '#121217', border: '1px solid #27272a', borderRadius: '10px', padding: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', marginBottom: '20px' }}>
                  <Kanban size={22} />
                </div>
                <h3 style={{ fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>Unified Kanban & Task Hierarchy</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#a1a1aa' }}>
                  Organize work into projects, milestones, and high-density task boards. Filter instantly by priority, assignee, and custom labels.
                </p>
              </div>

              <div style={{ background: '#121217', border: '1px solid #27272a', borderRadius: '10px', padding: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '20px' }}>
                  <Bot size={22} />
                </div>
                <h3 style={{ fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>Collabrix Intelligence</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#a1a1aa' }}>
                  Context-grounded assistant powered by Google Gemini-3.8-Flash. Natural language task extraction, automated rollout planning, and risk detection.
                </p>
              </div>

              <div style={{ background: '#121217', border: '1px solid #27272a', borderRadius: '10px', padding: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '20px' }}>
                  <Shield size={22} />
                </div>
                <h3 style={{ fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>Enterprise RBAC & Security</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#a1a1aa' }}>
                  Strict workspace multi-tenancy, server-side authorization enforcement, granular role controls (Owner, Admin, Member, Viewer).
                </p>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', color: '#fafafa', marginBottom: '14px' }}>Simple, Transparent Pricing</h2>
            <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '56px' }}>
              Scale effortlessly from fast student teams to high-growth engineering organizations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', textAlign: 'left' }}>
              <div style={{ background: '#121217', border: '1px solid #27272a', borderRadius: '10px', padding: '32px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa' }}>Starter</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#fafafa', margin: '14px 0 6px' }}>$0</div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px' }}>For students and individual developers.</p>
                <button type="button" onClick={() => setViewMode('app')} className="btn-secondary" style={{ width: '100%', marginBottom: '24px' }}>
                  Launch Free
                </button>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'grid', gap: '10px', color: '#a1a1aa' }}>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> Unlimited tasks & projects</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> 1 workspace with up to 5 members</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> Rule-based risk radar</li>
                </ul>
              </div>

              <div style={{ background: '#14141c', border: '2px solid #8b5cf6', borderRadius: '10px', padding: '32px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#8b5cf6', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px' }}>
                  MOST POPULAR
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa' }}>Team Pro</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#fafafa', margin: '14px 0 6px' }}>
                  $12 <span style={{ fontSize: '14px', fontWeight: 400, color: '#a1a1aa' }}>/ member / month</span>
                </div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px' }}>For software startups and product teams.</p>
                <button type="button" onClick={() => setViewMode('app')} className="btn-primary" style={{ width: '100%', marginBottom: '24px' }}>
                  Start 14-Day Trial
                </button>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'grid', gap: '10px', color: '#a1a1aa' }}>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#8b5cf6" /> Everything in Starter</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#8b5cf6" /> Gemini-3.8-Flash AI Assistant</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#8b5cf6" /> Natural language task generator</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#8b5cf6" /> Team workload analytics</li>
                </ul>
              </div>

              <div style={{ background: '#121217', border: '1px solid #27272a', borderRadius: '10px', padding: '32px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa' }}>Enterprise</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#fafafa', margin: '14px 0 6px' }}>Custom</div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px' }}>For scaling organizations requiring custom controls.</p>
                <button type="button" onClick={() => setViewMode('app')} className="btn-secondary" style={{ width: '100%', marginBottom: '24px' }}>
                  Contact Sales
                </button>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'grid', gap: '10px', color: '#a1a1aa' }}>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> Dedicated Cloud SQL instance</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> Custom AI grounding models</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={14} color="#10b981" /> Priority SLA & 24/7 engineering support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer style={{ borderTop: '1px solid #1e1e24', padding: '48px 32px', textAlign: 'center', fontSize: '13px', color: '#71717a' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setViewMode('app')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>Workspace</button>
              <a href="#features" style={{ color: '#a1a1aa' }}>Features</a>
              <a href="#pricing" style={{ color: '#a1a1aa' }}>Pricing</a>
              <a href="#intelligence" style={{ color: '#a1a1aa' }}>Collabrix AI</a>
            </div>
            <div>Collabrix Next • "One workspace. Every project. A smarter team."</div>
          </footer>
        </div>
      ) : (
        /* ========================================================================= */
        /* AUTHENTICATED WORKSPACE APPLICATION SHELL */
        /* ========================================================================= */
        <>
          {/* Left Sidebar */}
          <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Workspace Selector */}
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setWorkspaceSwitcherOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-h)',
                  padding: '4px',
                  borderRadius: '6px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  {activeWorkspace?.name?.substring(0, 1) || 'C'}
                </div>
                {!sidebarCollapsed && (
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeWorkspace?.name || 'Collabrix'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {activeWorkspace?.role || 'OWNER'}
                    </div>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronDown size={14} color="var(--text-muted)" />}
              </button>

              {/* Workspace Switcher Dropdown */}
              {workspaceSwitcherOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '12px',
                    width: '220px',
                    background: '#14141a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                    padding: '6px',
                    zIndex: 60,
                  }}
                >
                  <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    WORKSPACES
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setWorkspaceSwitcherOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 8px',
                        background: ws.id === activeWorkspaceId ? '#22222d' : 'transparent',
                        color: 'var(--text-h)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                      }}
                    >
                      <span>{ws.name}</span>
                      {ws.id === activeWorkspaceId && <Check size={13} color="var(--accent)" />}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid #27272a', marginTop: '6px', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setWorkspaceSwitcherOpen(false);
                        setNewWorkspaceModalOpen(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '6px 8px',
                        background: 'none',
                        color: 'var(--accent)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <Plus size={13} /> Create Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Items */}
            <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <button
                type="button"
                onClick={() => setCurrentTab('overview')}
                className={`nav-item ${currentTab === 'overview' ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                {!sidebarCollapsed && <span>Overview</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('my-tasks')}
                className={`nav-item ${currentTab === 'my-tasks' ? 'active' : ''}`}
              >
                <CheckCircle2 size={16} />
                {!sidebarCollapsed && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>My Tasks</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {tasks.filter((t) => t.assigneeId === currentUser?.userId && t.status !== 'DONE').length}
                    </span>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('board')}
                className={`nav-item ${currentTab === 'board' ? 'active' : ''}`}
              >
                <Kanban size={16} />
                {!sidebarCollapsed && <span>Board</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('projects')}
                className={`nav-item ${currentTab === 'projects' ? 'active' : ''}`}
              >
                <FolderGit2 size={16} />
                {!sidebarCollapsed && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Projects</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{projects.length}</span>
                  </div>
                )}
              </button>

              {/* Collabrix Intelligence Signature AI Section */}
              <div style={{ margin: '12px 0 4px', padding: '0 8px', fontSize: '11px', fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} />
                {!sidebarCollapsed && <span>INTELLIGENCE</span>}
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('ai')}
                className={`nav-item ${currentTab === 'ai' ? 'active' : ''}`}
                style={{
                  background: currentTab === 'ai' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: currentTab === 'ai' ? '#c084fc' : 'var(--text)',
                }}
              >
                <Bot size={16} color="#8b5cf6" />
                {!sidebarCollapsed && <span>Collabrix AI</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('analytics')}
                className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={16} />
                {!sidebarCollapsed && <span>Analytics</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('docs')}
                className={`nav-item ${currentTab === 'docs' ? 'active' : ''}`}
              >
                <FileText size={16} />
                {!sidebarCollapsed && <span>Documents</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('team')}
                className={`nav-item ${currentTab === 'team' ? 'active' : ''}`}
              >
                <Users size={16} />
                {!sidebarCollapsed && <span>Team</span>}
              </button>

              {/* Preserved Opportunities Portal view */}
              <button
                type="button"
                onClick={() => setCurrentTab('legacy')}
                className={`nav-item ${currentTab === 'legacy' ? 'active' : ''}`}
              >
                <Briefcase size={16} />
                {!sidebarCollapsed && <span>Opportunities</span>}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('settings')}
                className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              >
                <Settings size={16} />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </div>

            {/* User Profile Footer */}
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#22222d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: 'var(--text-h)',
                    flexShrink: 0,
                  }}
                >
                  {currentUser?.fullName?.substring(0, 1) || 'U'}
                </div>
                {!sidebarCollapsed && (
                  <div style={{ minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.fullName || 'User'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.email}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="app-main">
            {/* Top Bar */}
            <header className="top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarCollapsed((prev) => !prev);
                    setMobileMenuOpen((prev) => !prev);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Toggle sidebar"
                >
                  <Menu size={18} />
                </button>

                {/* Command Launcher */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="search-launcher"
                >
                  <Search size={14} />
                  <span>Search or jump to...</span>
                  <kbd style={{ marginLeft: 'auto' }}>⌘K</kbd>
                </button>

                {/* Quick Persona Switcher for effortless multi-role evaluation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Persona:</span>
                  <button
                    type="button"
                    onClick={() => quickLogin('ownerA@example.com', 'OwnerA123!')}
                    className="btn-ghost"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: currentUser?.email === 'ownerA@example.com' ? 'var(--accent-bg)' : undefined,
                      color: currentUser?.email === 'ownerA@example.com' ? 'var(--accent)' : undefined,
                    }}
                  >
                    Alex (Lead)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('ownerB@example.com', 'OwnerB123!')}
                    className="btn-ghost"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: currentUser?.email === 'ownerB@example.com' ? 'var(--accent-bg)' : undefined,
                      color: currentUser?.email === 'ownerB@example.com' ? 'var(--accent)' : undefined,
                    }}
                  >
                    Jordan (PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('grad@example.com', 'Secret123!')}
                    className="btn-ghost"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: currentUser?.email === 'grad@example.com' ? 'var(--accent-bg)' : undefined,
                      color: currentUser?.email === 'grad@example.com' ? 'var(--accent)' : undefined,
                    }}
                  >
                    Elena (Eng)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Switch to Landing view */}
                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  className="btn-ghost"
                  style={{ fontSize: '12px' }}
                >
                  Landing Page
                </button>

                {/* Notifications Bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen((prev) => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      position: 'relative',
                    }}
                  >
                    <Bell size={17} />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#8b5cf6',
                        }}
                      />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '320px',
                        background: '#14141a',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                        padding: '12px',
                        zIndex: 70,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>Notifications</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/notifications/read-all', {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Mark all as read
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                background: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid #22222a',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '2px' }}>{n.title}</div>
                              <div style={{ color: 'var(--text)' }}>{n.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* New Task Button */}
                <button
                  type="button"
                  onClick={() => setCreateTaskModalOpen(true)}
                  className="btn-primary"
                  style={{ padding: '6px 12px' }}
                >
                  <Plus size={14} /> New Task
                </button>
              </div>
            </header>

            {/* TAB CONTENTS */}
            <div style={{ padding: '24px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
              {/* 1. OVERVIEW / DASHBOARD TAB */}
              {currentTab === 'overview' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-h)' }}>
                        Good day, {currentUser?.fullName?.split(' ')[0] || 'Team'}
                      </h1>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Here is the live status across {activeWorkspace?.name || 'your workspace'}.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('ai')}
                        className="btn-secondary"
                        style={{ color: '#c084fc', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                      >
                        <Bot size={15} color="#8b5cf6" /> Collabrix Intelligence
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateProjectModalOpen(true)}
                        className="btn-secondary"
                      >
                        <Plus size={14} /> New Project
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Completion Velocity</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                        {analytics?.summary.completionRate || 0}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {analytics?.summary.completedTasks || 0} of {analytics?.summary.totalTasks || 0} tasks done
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Active Projects</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-h)' }}>
                        {projects.length}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Across engineering & design
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>In Flight Work</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8' }}>
                        {analytics?.summary.inProgressTasks || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        In progress & under review
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Risks & Overdue</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: (analytics?.summary.overdueCount || 0) > 0 ? '#f43f5e' : '#10b981' }}>
                        {analytics?.summary.overdueCount || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {(analytics?.summary.overdueCount || 0) > 0 ? 'Requires attention' : 'All targets on schedule'}
                      </div>
                    </div>
                  </div>

                  {/* Two Column Section: Urgent Focus & Live Activity */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    {/* Urgent & High Priority Tasks */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', color: 'var(--text-h)' }}>High Priority Workstreams</h3>
                        <button type="button" onClick={() => setCurrentTab('board')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer' }}>
                          View Board
                        </button>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {tasks
                          .filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE')
                          .slice(0, 5)
                          .map((t) => (
                            <div
                              key={t.id}
                              onClick={() => openTaskDetail(t)}
                              style={{
                                padding: '10px 12px',
                                background: '#14141a',
                                border: '1px solid #22222a',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{t.key}</span>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>{t.title}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {t.assignee?.fullName || 'Unassigned'} • Due {t.dueDate || 'No date'}
                                </div>
                              </div>
                              <span className={`badge-priority-${t.priority.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {t.priority}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Live Workspace Activity Feed */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '16px' }}>Live Activity Stream</h3>
                      <div style={{ display: 'grid', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                        {activities.slice(0, 8).map((a) => (
                          <div key={a.id} style={{ display: 'flex', gap: '10px', fontSize: '12px', paddingBottom: '10px', borderBottom: '1px solid #1e1e24' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#22222d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>
                              {a.user.fullName?.substring(0, 1)}
                            </div>
                            <div>
                              <div>
                                <strong>{a.user.fullName}</strong> {a.details}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BOARD / KANBAN VIEW TAB */}
              {currentTab === 'board' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>Kanban Board</h2>

                      {/* Project Filter */}
                      <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      >
                        <option value="ALL">All Projects</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} [{p.key}]</option>
                        ))}
                      </select>

                      {/* Priority Filter */}
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Filter cards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', width: '140px' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreateTaskModalOpen(true)}
                      className="btn-primary"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  </div>

                  {/* Kanban Columns */}
                  <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const).map((colStatus) => {
                      const colTasks = filteredTasks.filter((t) => t.status === colStatus);
                      return (
                        <div key={colStatus} className="kanban-col">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background:
                                    colStatus === 'DONE'
                                      ? '#10b981'
                                      : colStatus === 'IN_PROGRESS'
                                      ? '#38bdf8'
                                      : colStatus === 'IN_REVIEW'
                                      ? '#c084fc'
                                      : '#71717a',
                                }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>
                                {colStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{colTasks.length}</span>
                          </div>

                          <div style={{ display: 'grid', gap: '8px', overflowY: 'auto' }}>
                            {colTasks.map((task) => (
                              <div
                                key={task.id}
                                className="kanban-card"
                                onClick={() => openTaskDetail(task)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                                    {task.key}
                                  </span>
                                  <span className={`badge-priority-${task.priority.toLowerCase()}`} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    {task.priority}
                                  </span>
                                </div>

                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '8px', lineHeight: '1.4' }}>
                                  {task.title}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    <span>{task.dueDate ? task.dueDate.substring(5) : 'No date'}</span>
                                  </div>
                                  <div>{task.assignee?.fullName?.split(' ')[0] || 'Unassigned'}</div>
                                </div>
                              </div>
                            ))}

                            {colTasks.length === 0 && (
                              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed #22222a', borderRadius: '6px' }}>
                                No tasks
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. MY TASKS VIEW TAB */}
              {currentTab === 'my-tasks' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '16px' }}>
                    My Assigned Tasks
                  </h2>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {tasks
                      .filter((t) => t.assigneeId === currentUser?.userId)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => openTaskDetail(t)}
                          style={{
                            padding: '14px 18px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{t.key}</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>{t.title}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Project: {t.project?.name} • Due: {t.dueDate || 'None'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#1c1c24', color: 'var(--text)' }}>
                              {t.status}
                            </span>
                            <span className={`badge-priority-${t.priority.toLowerCase()}`} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 4. PROJECTS VIEW TAB */}
              {currentTab === 'projects' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>Projects ({projects.length})</h2>
                    <button type="button" onClick={() => setCreateProjectModalOpen(true)} className="btn-primary">
                      <Plus size={14} /> New Project
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '20px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: '#8b5cf6', fontWeight: 600 }}>
                            [{p.key}]
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#1f1f28', color: 'var(--text)' }}>
                            {p.status}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '8px' }}>{p.name}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '16px', lineHeight: '1.5' }}>
                          {p.description}
                        </p>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>Progress</span>
                            <span>{p.progress || 0}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: '#22222d', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress || 0}%`, height: '100%', background: '#8b5cf6', borderRadius: '3px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Target: {p.targetDate || 'None'}</span>
                          <span>{p.doneTaskCount || 0} / {p.taskCount || 0} tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. COLLABRIX INTELLIGENCE (AI CO-PILOT) TAB */}
              {currentTab === 'ai' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} color="#8b5cf6" /> Collabrix Intelligence
                      </h2>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Context-grounded assistant powered by Google Gemini-3.8-Flash.
                      </p>
                    </div>

                    {/* AI Feature Mode Selector */}
                    <div style={{ display: 'flex', gap: '6px', background: '#14141a', padding: '4px', borderRadius: '8px', border: '1px solid #22222a' }}>
                      <button
                        type="button"
                        onClick={() => setAiTab('chat')}
                        className="btn-ghost"
                        style={{
                          fontSize: '12px',
                          background: aiTab === 'chat' ? '#22222e' : 'transparent',
                          color: aiTab === 'chat' ? 'var(--text-h)' : 'var(--text)',
                        }}
                      >
                        Ask Assistant
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTab('nl-task')}
                        className="btn-ghost"
                        style={{
                          fontSize: '12px',
                          background: aiTab === 'nl-task' ? '#22222e' : 'transparent',
                          color: aiTab === 'nl-task' ? 'var(--text-h)' : 'var(--text)',
                        }}
                      >
                        Natural Task Creator
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTab('planner')}
                        className="btn-ghost"
                        style={{
                          fontSize: '12px',
                          background: aiTab === 'planner' ? '#22222e' : 'transparent',
                          color: aiTab === 'planner' ? 'var(--text-h)' : 'var(--text)',
                        }}
                      >
                        Project Planner
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTab('summaries')}
                        className="btn-ghost"
                        style={{
                          fontSize: '12px',
                          background: aiTab === 'summaries' ? '#22222e' : 'transparent',
                          color: aiTab === 'summaries' ? 'var(--text-h)' : 'var(--text)',
                        }}
                      >
                        Smart Summaries
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTab('radar')}
                        className="btn-ghost"
                        style={{
                          fontSize: '12px',
                          background: aiTab === 'radar' ? '#22222e' : 'transparent',
                          color: aiTab === 'radar' ? 'var(--text-h)' : 'var(--text)',
                        }}
                      >
                        Risk Radar ({insights.length})
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Workspace AI Chat */}
                  {aiTab === 'chat' && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', height: '620px' }}>
                      {/* Prompt Quick Chips */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {[
                          'What should our team focus on today?',
                          'Which tasks are currently blocked or overdue?',
                          'Summarize progress of Core High-Throughput API',
                          'Which team member has the highest workload?',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setAiInputPrompt(chip)}
                            style={{
                              fontSize: '11px',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              background: '#191922',
                              border: '1px solid #27272a',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Chat messages */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
                        {aiChatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            style={{
                              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                              maxWidth: '82%',
                              background: msg.sender === 'user' ? '#8b5cf6' : '#14141c',
                              color: msg.sender === 'user' ? '#fff' : 'var(--text-h)',
                              border: msg.sender === 'user' ? 'none' : '1px solid #27272a',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {msg.text}
                          </div>
                        ))}
                        {aiLoading && (
                          <div style={{ alignSelf: 'flex-start', color: '#c084fc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={15} /> Collabrix Intelligence is analyzing workspace context...
                          </div>
                        )}
                      </div>

                      {/* Chat input form */}
                      <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <input
                          type="text"
                          placeholder="Ask anything about tasks, progress, owners, or blockers..."
                          value={aiInputPrompt}
                          onChange={(e) => setAiInputPrompt(e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
                        />
                        <button type="submit" disabled={aiLoading} className="btn-primary" style={{ padding: '0 20px' }}>
                          <Send size={15} /> Ask
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Mode 2: Natural Language Task Creator */}
                  {aiTab === 'nl-task' && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '8px' }}>
                        Plain English Task Synthesizer
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Describe the task naturally. The model extracts title, priority, tags, and deadline for your review before creating.
                      </p>

                      <form onSubmit={handleParseNLTask} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            placeholder="e.g., Create an urgent security audit task for authentication tokens due next Tuesday"
                            value={nlTaskPrompt}
                            onChange={(e) => setNlTaskPrompt(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
                          />
                          <button type="submit" disabled={nlTaskLoading} className="btn-primary">
                            {nlTaskLoading ? 'Parsing...' : 'Analyze Instruction'}
                          </button>
                        </div>
                      </form>

                      {/* Review & Confirmation Box */}
                      {nlTaskDraft && (
                        <div style={{ background: '#14141c', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 600 }}>PROPOSED TASK STRUCTURE</span>
                            <span className={`badge-priority-${nlTaskDraft.priority.toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                              {nlTaskDraft.priority}
                            </span>
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '6px' }}>
                            {nlTaskDraft.title}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '12px' }}>
                            {nlTaskDraft.description}
                          </div>

                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                            <span>Target Date: {nlTaskDraft.suggestedDueDate}</span>
                            <span>Project: {nlTaskDraft.projectName}</span>
                            <span>Labels: {nlTaskDraft.labels?.join(', ')}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={handleConfirmNLTask} className="btn-primary">
                              <Check size={14} /> Confirm & Save Task
                            </button>
                            <button type="button" onClick={() => setNlTaskDraft(null)} className="btn-ghost">
                              Discard
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 3: Project Planner */}
                  {aiTab === 'planner' && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '8px' }}>
                        Automated Initiative & Milestone Planner
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        State your objective. The AI plans phases, breakdown tasks, and identifies potential architectural bottlenecks.
                      </p>

                      <form onSubmit={handleGenerateProjectPlan} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            placeholder="e.g., Build Real-Time Collaborative Canvas with WebSockets"
                            value={planGoal}
                            onChange={(e) => setPlanGoal(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
                          />
                          <button type="submit" disabled={planLoading} className="btn-primary">
                            {planLoading ? 'Planning...' : 'Generate Plan'}
                          </button>
                        </div>
                      </form>

                      {generatedPlan && (
                        <div style={{ background: '#14141c', border: '1px solid #27272a', borderRadius: '8px', padding: '20px' }}>
                          <h4 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '6px' }}>
                            {generatedPlan.projectName} [{generatedPlan.key}]
                          </h4>
                          <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '20px' }}>
                            {generatedPlan.description}
                          </p>

                          {/* Milestones */}
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6', marginBottom: '8px' }}>MILESTONES</div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {generatedPlan.milestones?.map((m: any, idx: number) => (
                                <div key={idx} style={{ padding: '8px 12px', background: '#1a1a24', borderRadius: '6px', fontSize: '13px' }}>
                                  <strong>{m.title}</strong> — {m.description}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Task Breakdown */}
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6', marginBottom: '8px' }}>SUGGESTED TASKS</div>
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {generatedPlan.tasks?.map((t: any, idx: number) => (
                                <div key={idx} style={{ padding: '8px 12px', background: '#1a1a24', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{t.title}</span>
                                  <span style={{ color: t.priority === 'URGENT' ? '#f43f5e' : '#38bdf8' }}>{t.priority}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 4: Smart Summaries */}
                  {aiTab === 'summaries' && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button type="button" onClick={() => handleGenerateSummary('progress')} className="btn-secondary">
                          Compile Progress Report
                        </button>
                        <button type="button" onClick={() => handleGenerateSummary('weekly')} className="btn-secondary">
                          Generate Weekly Update
                        </button>
                        <button type="button" onClick={() => handleGenerateSummary('blockers')} className="btn-secondary">
                          Analyze Open Blockers
                        </button>
                      </div>

                      {summaryLoading && (
                        <div style={{ padding: '30px 0', textAlign: 'center', color: '#c084fc' }}>
                          Compiling workspace report...
                        </div>
                      )}

                      {generatedSummary && !summaryLoading && (
                        <div
                          style={{
                            background: '#14141c',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            padding: '24px',
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--text-h)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#c084fc', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                            Report Mode: {summaryType}
                          </div>
                          {generatedSummary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 5: Rule-Based Risk Radar */}
                  {aiTab === 'radar' && (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {insights.map((ins) => (
                        <div
                          key={ins.id}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '18px 20px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: ins.type === 'RISK' ? '#f43f5e' : ins.type === 'BOTTLENECK' ? '#fb923c' : '#10b981',
                                background: ins.type === 'RISK' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                              }}
                            >
                              {ins.type}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deterministic Rule</span>
                          </div>

                          <h4 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '4px' }}>{ins.title}</h4>
                          <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '10px' }}>{ins.description}</p>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            <strong>Evidence:</strong> {ins.evidence}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a78bfa' }}>
                            <strong>Suggested Action:</strong> {ins.suggestedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. ANALYTICS VIEW TAB */}
              {currentTab === 'analytics' && analytics && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '20px' }}>
                    Workspace Analytics & Velocity
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    {/* Status Distribution */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '16px' }}>Status Breakdown</h3>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                          const pct = analytics.summary.totalTasks > 0 ? Math.round((count / analytics.summary.totalTasks) * 100) : 0;
                          return (
                            <div key={status}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span>{status.replace('_', ' ')}</span>
                                <span>{count} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: '#22222d', borderRadius: '3px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#8b5cf6', borderRadius: '3px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Team Workload */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '16px' }}>Team Workload Distribution</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {analytics.workload.map((w) => (
                          <div key={w.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{w.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{w.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{w.activeTasks} active</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}> / {w.totalAssigned} total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. DOCUMENTS TAB */}
              {currentTab === 'docs' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '20px' }}>
                    Architectural Decision Records & Specifications
                  </h2>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '6px' }}>ADR 004: Event Bus Integration</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Author: Alex Morgan • Updated recently</p>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        Memory multiplexing event dispatching architecture ensures sub-10ms delivery across local workspaces.
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '6px' }}>Linear Design Guidelines & Token Specifications</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Author: Sarah Kim • Updated recently</p>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        Design tokens conform to dark-first zinc surfaces (`#09090b`), subtle neutral borders, and violet accents.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. TEAM & MEMBERS TAB */}
              {currentTab === 'team' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '20px' }}>
                    Workspace Team ({analytics?.workload.length || 4} Members)
                  </h2>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {analytics?.workload.map((member) => (
                      <div
                        key={member.userId}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '14px' }}>{member.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', background: '#22222d', color: 'var(--text-h)' }}>
                          Team Member
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. SETTINGS TAB */}
              {currentTab === 'settings' && (
                <div style={{ maxWidth: '640px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '20px' }}>Settings</h2>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '14px' }}>Workspace Settings</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Workspace Name</label>
                        <input type="text" readOnly value={activeWorkspace?.name || ''} style={{ width: '100%', padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Slug</label>
                        <input type="text" readOnly value={activeWorkspace?.slug || ''} style={{ width: '100%', padding: '8px 12px' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--text-h)', marginBottom: '14px' }}>Collabrix Intelligence Engine</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>
                      Current Model: <strong>gemini-3.8-flash</strong> via `@google/genai`<br />
                      Status: Active & grounded in live workspace task context.
                    </div>
                  </div>
                </div>
              )}

              {/* 10. PRESERVED OPPORTUNITIES TAB */}
              {currentTab === 'legacy' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '16px' }}>
                    Opportunities Hub
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Preserved role-based recruitment opportunities for graduates and organization administrators.
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-h)' }}>Junior Full-Stack Engineer</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                        Build robust REST and GraphQL APIs with React and Node.js. Ideal for recent computer science graduates.
                      </p>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-h)' }}>Frontend Developer Intern</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                        Collaborate with UX designers and senior engineers to build accessible, modern responsive web applications.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* ========================================================================= */}
      {/* COMMAND PALETTE MODAL (Cmd + K) */}
      {/* ========================================================================= */}
      {commandPaletteOpen && (
        <div className="modal-overlay" onClick={() => setCommandPaletteOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                style={{ background: 'none', border: 'none', width: '100%', fontSize: '14px', outline: 'none' }}
              />
              <kbd>ESC</kbd>
            </div>

            <div style={{ padding: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', padding: '6px 8px' }}>ACTIONS</div>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCreateTaskModalOpen(true);
                }}
                className="nav-item"
              >
                <Plus size={14} /> Create New Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCurrentTab('board');
                }}
                className="nav-item"
              >
                <Kanban size={14} /> Jump to Kanban Board
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCurrentTab('ai');
                }}
                className="nav-item"
              >
                <Bot size={14} color="#8b5cf6" /> Open Collabrix Intelligence
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCurrentTab('analytics');
                }}
                className="nav-item"
              >
                <BarChart3 size={14} /> View Velocity Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK DETAIL DIALOG */}
      {/* ========================================================================= */}
      {taskDetailOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => setTaskDetailOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600 }}>
                  {selectedTask.key}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {selectedTask.project?.name}</span>
              </div>
              <button type="button" onClick={() => setTaskDetailOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--text-h)', marginBottom: '12px' }}>{selectedTask.title}</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)', marginBottom: '24px' }}>
                {selectedTask.description || 'No description provided.'}
              </p>

              {/* Status & Priority Controls */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', background: '#16161f', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value as any)}
                    style={{ padding: '5px 8px', fontSize: '12px' }}
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</label>
                  <span className={`badge-priority-${selectedTask.priority.toLowerCase()}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assignee</label>
                  <span style={{ fontSize: '12px', color: 'var(--text-h)' }}>
                    {selectedTask.assignee?.fullName || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Date</label>
                  <span style={{ fontSize: '12px', color: 'var(--text-h)' }}>{selectedTask.dueDate || 'None'}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-h)', marginBottom: '14px' }}>
                  Comments ({taskComments.length})
                </h4>

                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                  {taskComments.map((c) => (
                    <div key={c.id} style={{ background: '#16161f', padding: '12px 14px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--text-h)' }}>{c.author?.fullName || 'User'}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>{c.content}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '8px 14px' }}>
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE TASK MODAL */}
      {/* ========================================================================= */}
      {createTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--text-h)' }}>Create New Task</h3>
              <button type="button" onClick={() => setCreateTaskModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Project</label>
                <select
                  required
                  value={createTaskProjId}
                  onChange={(e) => setCreateTaskProjId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} [{p.key}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Webhook retry backoff"
                  value={createTaskTitle}
                  onChange={(e) => setCreateTaskTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail scope, acceptance criteria, or relevant constraints..."
                  value={createTaskDesc}
                  onChange={(e) => setCreateTaskDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</label>
                  <select
                    value={createTaskPriority}
                    onChange={(e) => setCreateTaskPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Date</label>
                  <input
                    type="date"
                    value={createTaskDueDate}
                    onChange={(e) => setCreateTaskDueDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assignee</label>
                <select
                  value={createTaskAssignee}
                  onChange={(e) => setCreateTaskAssignee(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                >
                  <option value="">Unassigned</option>
                  {analytics?.workload.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCreateTaskModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE PROJECT MODAL */}
      {/* ========================================================================= */}
      {createProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateProjectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--text-h)' }}>Create New Project</h3>
              <button type="button" onClick={() => setCreateProjectModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Analytics Engine"
                  value={createProjName}
                  onChange={(e) => setCreateProjName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Project Key</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. ENG"
                    value={createProjKey}
                    onChange={(e) => setCreateProjKey(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</label>
                  <select
                    value={createProjPriority}
                    onChange={(e) => setCreateProjPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="High-level mission and deliverable goals..."
                  value={createProjDesc}
                  onChange={(e) => setCreateProjDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCreateProjectModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {newWorkspaceModalOpen && (
        <div className="modal-overlay" onClick={() => setNewWorkspaceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--text-h)' }}>Create Workspace</h3>
              <button type="button" onClick={() => setNewWorkspaceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Product Labs"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setNewWorkspaceModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTH MODAL */}
      {/* ========================================================================= */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--text-h)' }}>
                {isRegistering ? 'Create Collabrix Account' : 'Sign in to Collabrix'}
              </h3>
              <button type="button" onClick={() => setAuthModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsRegistering((prev) => !prev)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {isRegistering ? 'Already have account? Sign in' : 'Need an account? Register'}
                </button>
                <button type="submit" className="btn-primary">
                  {isRegistering ? 'Register' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
