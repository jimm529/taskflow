import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const emptyTask = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  project: "",
  assignedTo: "",
};

const emptyProject = {
  name: "",
  description: "",
};

const emptyMemberForm = {
  email: "",
  role: "member",
};

const emptyProjectEdit = {
  name: "",
  description: "",
};

const statusLabels = {
  todo: "Todo",
  "in-progress": "In progress",
  completed: "Completed",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const getEntityId = (entity) => entity?._id || entity?.id || entity || "";
const getUserName = (user) => user?.name || user?.email || "Unassigned";

const taskBoardColumns = [
  {
    key: "todo",
    title: "Todo",
    description: "Work that still needs to start.",
  },
  {
    key: "in-progress",
    title: "In progress",
    description: "Tasks you are actively working on.",
  },
  {
    key: "completed",
    title: "Completed",
    description: "Finished work that is already done.",
  },
];

const emptyTaskStats = {
  total: 0,
  status: {
    todo: 0,
    "in-progress": 0,
    completed: 0,
  },
  priority: {
    low: 0,
    medium: 0,
    high: 0,
  },
  completionPercentage: 0,
};

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("taskflow_theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function DistributionChart({ title, items, total }) {
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="chart-bars">
        {items.map((item) => {
          const percentage = total ? Math.round((item.value / total) * 100) : 0;

          return (
            <div className="chart-row" key={item.key}>
              <div className="chart-row-label">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="chart-track" aria-hidden="true">
                <span
                  className={`chart-fill ${item.tone}`}
                  style={{ "--chart-width": `${percentage}%` }}
                />
              </div>
              <small>{percentage}%</small>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function CompletionChart({ total, completed, percentage }) {
  return (
    <article className="chart-card completion-card">
      <h3>Completion percentage</h3>
      <div
        className="completion-ring"
        style={{ "--completion": `${percentage}%` }}
        aria-label={`${percentage}% completed`}
      >
        <strong>{percentage}%</strong>
      </div>
      <p>
        {completed} of {total} tasks completed
      </p>
    </article>
  );
}

function TaskCharts({ stats }) {
  const statusItems = taskBoardColumns.map((column) => ({
    key: column.key,
    label: column.title,
    value: stats.status[column.key],
    tone: column.key,
  }));

  const priorityItems = ["low", "medium", "high"].map((priority) => ({
    key: priority,
    label: priorityLabels[priority],
    value: stats.priority[priority],
    tone: priority,
  }));

  return (
    <section className="charts-grid" aria-label="Task charts">
      <DistributionChart
        title="Task status distribution"
        items={statusItems}
        total={stats.total}
      />
      <DistributionChart
        title="Priority distribution"
        items={priorityItems}
        total={stats.total}
      />
      <CompletionChart
        total={stats.total}
        completed={stats.status.completed}
        percentage={stats.completionPercentage}
      />
    </section>
  );
}

function TaskCard({ task, onEdit, onDelete, dragHandleProps, isDragging = false }) {
  const assignee = task.assignedTo;

  return (
    <article className={`task-card ${isDragging ? "is-dragging" : ""}`}>
      <div className="task-card-top">
        <h3>{task.title}</h3>
        <div className="task-card-tools">
          {dragHandleProps && (
            <button className="drag-handle" type="button" {...dragHandleProps}>
              Move
            </button>
          )}
          <span className={`priority ${task.priority}`}>
            {priorityLabels[task.priority]}
          </span>
        </div>
      </div>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span className={`status ${task.status}`}>
          {statusLabels[task.status]}
        </span>
        <span>
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
        </span>
        {assignee && <span>Assigned to {getUserName(assignee)}</span>}
        {task.project?.name && <span>{task.project.name}</span>}
      </div>
      <div className="task-actions">
        <button type="button" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(task._id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function DraggableTaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task._id,
      data: {
        task,
        status: task.status,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          "aria-label": `Move ${task.title}`,
        }}
      />
    </div>
  );
}

function KanbanColumn({ column, tasks, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.key,
  });

  return (
    <article
      className={`kanban-column ${isOver ? "is-over" : ""}`}
      key={column.key}
      ref={setNodeRef}
    >
      <header className="kanban-column-header">
        <div>
          <h3>{column.title}</h3>
          <p>{column.description}</p>
        </div>
        <span className="kanban-count">{tasks.length}</span>
      </header>

      <div className="kanban-column-body">
        {tasks.length === 0 ? (
          <p className="empty-state empty-state-compact">No tasks in this column.</p>
        ) : (
          children
        )}
      </div>
    </article>
  );
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState(getInitialTheme);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    avatar: "",
  });
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [projectEditForm, setProjectEditForm] = useState(emptyProjectEdit);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(emptyTaskStats);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    project: "",
    assignedTo: "",
    search: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalTasks, setTotalTasks] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const stats = useMemo(() => {
    return {
      total: taskStats.total,
      todo: taskStats.status.todo,
      active: taskStats.status["in-progress"],
      completed: taskStats.status.completed,
    };
  }, [taskStats]);

  const isDashboardView = activeView === "dashboard";
  const isTasksView = activeView === "tasks";
  const isReportsView = activeView === "reports";
  const isSettingsView = activeView === "settings";
  const isProjectsView = activeView === "projects";
  const isDarkTheme = theme === "dark";

  const reportStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const dueSoon = tasks.filter((task) => {
      if (!task.dueDate) return false;

      const dueDate = new Date(task.dueDate);
      const dueStart = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      );
      const diffDays = Math.round(
        (dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.status === "completed") return false;

      return new Date(task.dueDate) < new Date();
    }).length;

    return {
      dueSoon,
      overdue,
      completionRate: taskStats.completionPercentage,
    };
  }, [taskStats.completionPercentage, tasks]);

  const tasksByStatus = useMemo(() => {
    return taskBoardColumns.reduce((groups, column) => {
      groups[column.key] = kanbanTasks.filter((task) => task.status === column.key);
      return groups;
    }, {});
  }, [kanbanTasks]);

  const activeTask = useMemo(() => {
    return kanbanTasks.find((task) => task._id === activeTaskId);
  }, [activeTaskId, kanbanTasks]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => getEntityId(project) === selectedProjectId);
  }, [projects, selectedProjectId]);

  const taskProject = useMemo(() => {
    return projects.find((project) => getEntityId(project) === taskForm.project);
  }, [projects, taskForm.project]);

  const selectedProjectMembers = selectedProject?.members || [];

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalTasks / limit));
  }, [totalTasks, limit]);

  const request = useCallback(async (path, options = {}) => {
    const authToken = localStorage.getItem("taskflow_token");

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.message || data.errors?.[0]?.msg || "Request failed";
      throw new Error(message);
    }

    return data;
  }, []);

  const fetchUser = useCallback(async () => {
    if (!localStorage.getItem("taskflow_token")) return;

    try {
      const data = await request("/api/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("taskflow_token");
      setUser(null);
    }
  }, [request]);

  const fetchTasks = useCallback(async () => {
    if (!localStorage.getItem("taskflow_token")) return;

    setTasksLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      params.set("page", String(page));
      params.set("limit", String(limit));

      const data = await request(`/api/tasks?${params.toString()}`);
      setTasks(data.tasks || []);
      setTotalTasks(data.count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, [filters, limit, page, request]);

  const fetchKanbanTasks = useCallback(async () => {
    if (!localStorage.getItem("taskflow_token")) return;

    setTasksLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (key !== "status" && value) params.set(key, value);
      });

      params.set("page", "1");
      params.set("limit", "50");

      const data = await request(`/api/tasks?${params.toString()}`);
      setKanbanTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, [filters, request]);

  const fetchTaskStats = useCallback(async () => {
    if (!localStorage.getItem("taskflow_token")) return;

    try {
      const data = await request("/api/tasks/stats");
      setTaskStats(data.stats || emptyTaskStats);
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  const fetchProjects = useCallback(async () => {
    if (!localStorage.getItem("taskflow_token")) return;

    try {
      const data = await request("/api/projects");
      const nextProjects = data.projects || [];
      setProjects(nextProjects);
      setSelectedProjectId((currentProjectId) => {
        if (
          currentProjectId &&
          nextProjects.some((project) => getEntityId(project) === currentProjectId)
        ) {
          return currentProjectId;
        }

        return getEntityId(nextProjects[0]) || "";
      });
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, user]);

  useEffect(() => {
    fetchKanbanTasks();
  }, [fetchKanbanTasks, user]);

  useEffect(() => {
    fetchTaskStats();
  }, [fetchTaskStats, user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, user]);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name || "",
      avatar: user.avatar || "",
    });
  }, [user]);

  useEffect(() => {
    setProjectEditForm({
      name: selectedProject?.name || "",
      description: selectedProject?.description || "",
    });
  }, [selectedProject]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.status,
    filters.priority,
    filters.project,
    filters.assignedTo,
    filters.search,
    filters.sort,
    limit,
  ]);

  useEffect(() => {
    localStorage.setItem("taskflow_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (authMode === "register") {
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(authForm),
        });
        setNotice("Account created. You can sign in now.");
        setAuthMode("login");
        setAuthForm((current) => ({ ...current, password: "" }));
        return;
      }

      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      localStorage.setItem("taskflow_token", data.token);
      setUser(data.user);
      setNotice("Welcome back.");
      await fetchProjects();
      await fetchTasks();
      await fetchKanbanTasks();
      await fetchTaskStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || undefined,
        project: taskForm.project || undefined,
        assignedTo: taskForm.assignedTo || undefined,
      };

      if (editingTask) {
        await request(`/api/tasks/${editingTask._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice("Task updated.");
      } else {
        await request("/api/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Task created.");
      }

      setEditingTask(null);
      setTaskForm(emptyTask);
      await fetchTasks();
      await fetchKanbanTasks();
      await fetchTaskStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await request("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileForm.name,
          avatar: profileForm.avatar,
        }),
      });

      setUser(data.user);
      setNotice("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setProfileForm((currentProfile) => ({
        ...currentProfile,
        avatar: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await request("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectForm),
      });

      setProjectForm(emptyProject);
      setSelectedProjectId(getEntityId(data.project));
      setNotice("Project created.");
      await fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await request(`/api/projects/${selectedProjectId}/members`, {
        method: "POST",
        body: JSON.stringify(memberForm),
      });

      setMemberForm(emptyMemberForm);
      setNotice("Project member saved.");
      await fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdateSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await request(`/api/projects/${selectedProjectId}`, {
        method: "PATCH",
        body: JSON.stringify(projectEditForm),
      });

      setNotice("Project updated.");
      await fetchProjects();
      await fetchTasks();
      await fetchKanbanTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeProjectMember = async (memberId) => {
    if (!selectedProjectId) return;

    setError("");
    setNotice("");

    try {
      await request(`/api/projects/${selectedProjectId}/members/${memberId}`, {
        method: "DELETE",
      });

      setNotice("Project member removed.");
      await fetchProjects();
      await fetchTasks();
      await fetchKanbanTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      project: getEntityId(task.project),
      assignedTo: getEntityId(task.assignedTo),
    });
    setActiveView("dashboard");
  };

  const deleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Delete this task? This action cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await request(`/api/tasks/${taskId}`, { method: "DELETE" });
      setNotice("Task deleted.");
      await fetchTasks();
      await fetchKanbanTasks();
      await fetchTaskStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || !taskBoardColumns.some((column) => column.key === over.id)) {
      return;
    }

    const task = active.data.current?.task;
    const nextStatus = over.id;

    if (!task || task.status === nextStatus) {
      return;
    }

    const previousKanbanTasks = kanbanTasks;

    setKanbanTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask._id === task._id
          ? {
              ...currentTask,
              status: nextStatus,
            }
          : currentTask
      )
    );
    setError("");
    setNotice("");

    try {
      await request(`/api/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice("Task status updated.");
      await fetchTasks();
      await fetchKanbanTasks();
      await fetchTaskStats();
    } catch (err) {
      setKanbanTasks(previousKanbanTasks);
      setError(err.message);
    }
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  const logout = () => {
    localStorage.removeItem("taskflow_token");
    setUser(null);
    setProfileForm({ name: "", avatar: "" });
    setProjects([]);
    setProjectForm(emptyProject);
    setProjectEditForm(emptyProjectEdit);
    setMemberForm(emptyMemberForm);
    setSelectedProjectId("");
    setTasks([]);
    setKanbanTasks([]);
    setTaskStats(emptyTaskStats);
    setNotice("");
    setError("");
    setActiveView("dashboard");
  };

  if (!user) {
    return (
      <main className={`auth-page theme-${theme}`}>
        <section className="auth-panel" aria-label="TaskFlow authentication">
          <div className="brand-mark">TF</div>
          <h1>TaskFlow</h1>
          <p>Plan the day, prioritize the work, and keep every task moving.</p>

          <div className="mode-switch" role="tablist" aria-label="Auth mode">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, name: event.target.value })
                  }
                  placeholder="Alex Morgan"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </label>
            <button className="primary-action" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {notice && <p className="notice success">{notice}</p>}
          {error && <p className="notice error">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <span>TF</span>
            <strong>TaskFlow</strong>
          </div>
          <nav aria-label="Primary navigation">
            <button
              className={`nav-item ${isDashboardView ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-item ${isTasksView ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("tasks")}
            >
              My tasks
            </button>
            <button
              className={`nav-item ${isReportsView ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("reports")}
            >
              Reports
            </button>
            <button
              className={`nav-item ${isProjectsView ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("projects")}
            >
              Projects
            </button>
            <button
              className={`nav-item ${isSettingsView ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("settings")}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="sidebar-actions">
          <button className="theme-toggle" onClick={toggleTheme} type="button">
            <span>{isDarkTheme ? "Light" : "Dark"} mode</span>
            <strong>{isDarkTheme ? "Light" : "Dark"}</strong>
          </button>
          <button className="logout-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Personal workspace</p>
            <h1>Good to see you, {user.name}</h1>
          </div>
          <div className="profile-chip">
            {user.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase()}</span>
            )}
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
        </header>

        {isSettingsView ? (
          <section className="settings-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>Settings</h2>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="profile-preview">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="" />
                ) : (
                  <span>{profileForm.name?.charAt(0).toUpperCase() || "U"}</span>
                )}
                <div>
                  <strong>{profileForm.name || "Your name"}</strong>
                  <small>{user.email}</small>
                </div>
              </div>

              <label>
                Name
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, name: event.target.value })
                  }
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email
                <input value={user.email} readOnly />
              </label>

              <label>
                Avatar URL
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, avatar: event.target.value })
                  }
                  placeholder="https://example.com/avatar.png"
                />
              </label>

              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save profile"}
              </button>

              {notice && <p className="notice success">{notice}</p>}
              {error && <p className="notice error">{error}</p>}
            </form>
          </section>
        ) : isProjectsView ? (
          <section className="projects-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Collaboration</p>
                <h2>Projects and team</h2>
              </div>
            </div>

            <section className="project-grid">
              <form className="project-form" onSubmit={handleProjectSubmit}>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Create</p>
                    <h2>New project</h2>
                  </div>
                </div>

                <label>
                  Name
                  <input
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, name: event.target.value })
                    }
                    placeholder="Product launch"
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        description: event.target.value,
                      })
                    }
                    placeholder="What this team is working on"
                  />
                </label>

                <button className="primary-action" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Create project"}
                </button>
              </form>

              <section className="project-form">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Team</p>
                    <h2>Members</h2>
                  </div>
                </div>

                <label>
                  Project
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={getEntityId(project)} value={getEntityId(project)}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <form className="member-form" onSubmit={handleMemberSubmit}>
                  <label>
                    Member email
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(event) =>
                        setMemberForm({ ...memberForm, email: event.target.value })
                      }
                      placeholder="teammate@example.com"
                      required
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={memberForm.role}
                      onChange={(event) =>
                        setMemberForm({ ...memberForm, role: event.target.value })
                      }
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <button
                    className="primary-action"
                    type="submit"
                    disabled={loading || !selectedProjectId}
                  >
                    Add member
                  </button>
                </form>

                <div className="member-list">
                  {!selectedProject ? (
                    <p className="empty-state empty-state-compact">
                      Select a project to manage members.
                    </p>
                  ) : (selectedProject.members || []).length === 0 ? (
                    <p className="empty-state empty-state-compact">
                      No members yet.
                    </p>
                  ) : (
                    (selectedProject.members || []).map((member) => {
                      const memberUser = member.user;
                      const memberId = getEntityId(memberUser);
                      const isOwner = member.role === "owner";

                      return (
                        <article className="member-row" key={memberId}>
                          <div>
                            <strong>{getUserName(memberUser)}</strong>
                            <small>{memberUser?.email}</small>
                          </div>
                          <span>{member.role}</span>
                          {!isOwner && (
                            <button
                              className="danger-button"
                              type="button"
                              onClick={() => removeProjectMember(memberId)}
                            >
                              Remove
                            </button>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>

                {notice && <p className="notice success">{notice}</p>}
                {error && <p className="notice error">{error}</p>}
              </section>
            </section>
          </section>
        ) : isReportsView ? (
          <section className="reports-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Reports</p>
                <h2>Task summary</h2>
              </div>
            </div>

            <section className="metrics" aria-label="Task statistics">
              <article>
                <span>Total</span>
                <strong>{stats.total}</strong>
              </article>
              <article>
                <span>Todo</span>
                <strong>{stats.todo}</strong>
              </article>
              <article>
                <span>In progress</span>
                <strong>{stats.active}</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </article>
              <article>
                <span>Due in 7 days</span>
                <strong>{reportStats.dueSoon}</strong>
              </article>
              <article>
                <span>Overdue</span>
                <strong>{reportStats.overdue}</strong>
              </article>
              <article>
                <span>Completion rate</span>
                <strong>{reportStats.completionRate}%</strong>
              </article>
            </section>

            <TaskCharts stats={taskStats} />

            <div className="report-grid">
              <article className="report-card">
                <h3>Workload</h3>
                <p>{stats.total} tasks are currently in your workspace.</p>
              </article>
              <article className="report-card">
                <h3>Momentum</h3>
                <p>{reportStats.completionRate}% of tasks are already completed.</p>
              </article>
              <article className="report-card">
                <h3>Attention needed</h3>
                <p>{reportStats.overdue} tasks are overdue and should be reviewed.</p>
              </article>
            </div>
          </section>
        ) : isTasksView ? (
          <>
            <section className="metrics" aria-label="Task statistics">
              <article>
                <span>Total</span>
                <strong>{stats.total}</strong>
              </article>
              <article>
                <span>Todo</span>
                <strong>{stats.todo}</strong>
              </article>
              <article>
                <span>In progress</span>
                <strong>{stats.active}</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </article>
            </section>

            <section className="task-board task-board-full">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">My tasks</p>
                  <h2>Kanban board</h2>
                </div>
              </div>

              <div className="filters">
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters({ ...filters, search: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") fetchTasks();
                  }}
                  placeholder="Search tasks"
                />
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters({ ...filters, status: event.target.value })
                  }
                >
                  <option value="">All statuses</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(event) =>
                    setFilters({ ...filters, priority: event.target.value })
                  }
                >
                  <option value="">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select
                  value={filters.project}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      project: event.target.value,
                      assignedTo: "",
                    })
                  }
                >
                  <option value="">All projects</option>
                  {projects.map((project) => (
                    <option key={getEntityId(project)} value={getEntityId(project)}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.assignedTo}
                  onChange={(event) =>
                    setFilters({ ...filters, assignedTo: event.target.value })
                  }
                  disabled={!filters.project}
                >
                  <option value="">All assignees</option>
                  {(projects.find((project) => getEntityId(project) === filters.project)
                    ?.members || []
                  ).map((member) => {
                    const memberUser = member.user;
                    const memberId = getEntityId(memberUser);

                    return (
                      <option key={memberId} value={memberId}>
                        {getUserName(memberUser)}
                      </option>
                    );
                  })}
                </select>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters({ ...filters, sort: event.target.value })
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="dueDate">Due date</option>
                </select>
                <button className="ghost-button" type="button" onClick={fetchTasks}>
                  Search
                </button>
              </div>

              <p className="board-summary">
                Showing up to 50 matching tasks on the board.
              </p>

              {notice && <p className="notice success">{notice}</p>}
              {error && <p className="notice error">{error}</p>}

              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <div className="kanban-board">
                  {tasksLoading ? (
                    <p className="empty-state">Loading tasks...</p>
                  ) : kanbanTasks.length === 0 ? (
                    <p className="empty-state">No tasks match this view.</p>
                  ) : (
                    taskBoardColumns.map((column) => (
                      <KanbanColumn
                        column={column}
                        key={column.key}
                        tasks={tasksByStatus[column.key]}
                      >
                        {tasksByStatus[column.key].map((task) => (
                          <DraggableTaskCard
                            key={task._id}
                            task={task}
                            onEdit={startEdit}
                            onDelete={deleteTask}
                          />
                        ))}
                      </KanbanColumn>
                    ))
                  )}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <TaskCard
                      task={activeTask}
                      onEdit={startEdit}
                      onDelete={deleteTask}
                      isDragging
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </section>
          </>
        ) : (
          <>
            <section className="metrics" aria-label="Task statistics">
              <article>
                <span>Total</span>
                <strong>{stats.total}</strong>
              </article>
              <article>
                <span>Todo</span>
                <strong>{stats.todo}</strong>
              </article>
              <article>
                <span>In progress</span>
                <strong>{stats.active}</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </article>
            </section>

            <TaskCharts stats={taskStats} />

            <section className="content-grid">
              <form className="task-composer" onSubmit={handleTaskSubmit}>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{editingTask ? "Update" : "Create"}</p>
                    <h2>{editingTask ? "Edit task" : "New task"}</h2>
                  </div>
                  {editingTask && (
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskForm(emptyTask);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <label>
                  Title
                  <input
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, title: event.target.value })
                    }
                    placeholder="Prepare sprint plan"
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={taskForm.description}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        description: event.target.value,
                      })
                    }
                    placeholder="Add context, notes, or acceptance criteria"
                  />
                </label>

                <div className="form-row">
                  <label>
                    Status
                    <select
                      value={taskForm.status}
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, status: event.target.value })
                      }
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, priority: event.target.value })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Project
                    <select
                      value={taskForm.project}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          project: event.target.value,
                          assignedTo: "",
                        })
                      }
                    >
                      <option value="">Personal task</option>
                      {projects.map((project) => (
                        <option key={getEntityId(project)} value={getEntityId(project)}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assign to
                    <select
                      value={taskForm.assignedTo}
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, assignedTo: event.target.value })
                      }
                    >
                      <option value="">
                        {taskForm.project ? "Unassigned" : "Me"}
                      </option>
                      {taskProject?.members?.map((member) => {
                        const memberUser = member.user;
                        const memberId = getEntityId(memberUser);

                        return (
                          <option key={memberId} value={memberId}>
                            {getUserName(memberUser)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>

                <label>
                  Due date
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, dueDate: event.target.value })
                    }
                  />
                </label>

                <button className="primary-action" type="submit" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editingTask
                      ? "Save changes"
                      : "Create task"}
                </button>
              </form>

              <section className="task-board">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Manage</p>
                    <h2>Task list</h2>
                  </div>
                </div>

                <div className="filters">
                  <input
                    value={filters.search}
                    onChange={(event) =>
                      setFilters({ ...filters, search: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") fetchTasks();
                    }}
                    placeholder="Search tasks"
                  />
                  <select
                    value={filters.status}
                    onChange={(event) =>
                      setFilters({ ...filters, status: event.target.value })
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={filters.priority}
                    onChange={(event) =>
                      setFilters({ ...filters, priority: event.target.value })
                    }
                  >
                    <option value="">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select
                    value={filters.sort}
                    onChange={(event) =>
                      setFilters({ ...filters, sort: event.target.value })
                    }
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="dueDate">Due date</option>
                  </select>
                  <button className="ghost-button" type="button" onClick={fetchTasks}>
                    Search
                  </button>
                </div>

                <div className="pagination-bar">
                  <label>
                    Rows per page
                    <select
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </label>

                  <div className="pagination-controls">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={goToPreviousPage}
                      disabled={page === 1 || tasksLoading}
                    >
                      Previous
                    </button>
                    <span className="page-indicator">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={goToNextPage}
                      disabled={page === totalPages || tasksLoading}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {notice && <p className="notice success">{notice}</p>}
                {error && <p className="notice error">{error}</p>}

                <div className="tasks">
                  {tasksLoading ? (
                    <p className="empty-state">Loading tasks...</p>
                  ) : tasks.length === 0 ? (
                    <p className="empty-state">No tasks match this view.</p>
                  ) : (
                    tasks.map((task) => (
                      <article className="task-card" key={task._id}>
                        <div className="task-card-top">
                          <h3>{task.title}</h3>
                          <span className={`priority ${task.priority}`}>
                            {priorityLabels[task.priority]}
                          </span>
                        </div>
                        {task.description && <p>{task.description}</p>}
                        <div className="task-meta">
                          <span className={`status ${task.status}`}>
                            {statusLabels[task.status]}
                          </span>
                          <span>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "No due date"}
                          </span>
                          {task.assignedTo && (
                            <span>Assigned to {getUserName(task.assignedTo)}</span>
                          )}
                          {task.project?.name && <span>{task.project.name}</span>}
                        </div>
                        <div className="task-actions">
                          <button type="button" onClick={() => startEdit(task)}>
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            type="button"
                            onClick={() => deleteTask(task._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
