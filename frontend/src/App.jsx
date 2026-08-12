import { useEffect,useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const fetchUser = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();


    if (!response.ok) {
      localStorage.removeItem("token");
      return;
    }

    setUser(data.user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
  }
};

const fetchTasks = async () => {
  console.log("FETCH TASKS STARTED");

  const token = localStorage.getItem("token");
  console.log("TOKEN EXISTS:", !!token);

  if (!token) {
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/tasks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("TASK RESPONSE STATUS:", response.status);

    const data = await response.json();

    console.log("TASK RESPONSE DATA:", data);
    console.log("TASKS:", data.tasks);
    console.log("TASK COUNT:", data.tasks?.length);

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    setTasks(data.tasks);
  } catch (error) {
    console.error("FAILED TO FETCH TASKS:", error);
  }
};

useEffect(() => {
  fetchUser();
  fetchTasks();
}, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      setMessage("Login successful!");
      console.log("Login response:", data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    
  <>
    {user ? (
    <div className="dashboard">
  <aside className="sidebar">
    <h2>TaskFlow</h2>

    <nav>
      <button>Dashboard</button>
      <button>My Tasks</button>
      <button>Projects</button>
    </nav>

    <button
      className="logout-btn"
      onClick={() => {
        localStorage.removeItem("token");
        setUser(null);
      }}
    >
      Logout
    </button>
  </aside>

  <main className="main-content">
    <header className="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p>Welcome back, {user.name}</p>
      </div>

      <div className="user-info">
        <span>{user.name}</span>
      </div>
    </header>

    <section className="stats">
      <div className="stat-card">
      <h3>Total Tasks</h3>
   <strong>{tasks.length}</strong>
    </div>

      <div className="stat-card">
        <h3>In Progress</h3>
        <strong>{tasks.filter((task) => task.status === "in-progress").length}</strong>
      </div>

      <div className="stat-card">
        <h3>Completed</h3>
        <strong> {tasks.filter((task) => task.status === "completed").length}</strong>
      </div>
    </section>

    <section className="tasks-section">
  <div className="tasks-header">
    <h2>Recent Tasks</h2>

   <button
  className="create-task-btn"
  onClick={() => setShowTaskForm(true)}
>
  + Create Task
</button>
  </div>

  {tasks.length === 0 ? (
    <p>No tasks yet.</p>
  ) : (
    <div className="task-list">
      {tasks.map((task) => (
        <div className="task-item" key={task._id}>
          <div>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
          </div>

          <span>{task.status}</span>
        </div>
      ))}
    </div>
  )}
</section>
  </main>
</div>
    ) : (
      <div className="login-page">
        <div className="login-card">
          <h1>TaskFlow</h1>
          <p className="subtitle">Manage your tasks efficiently</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
     )}
  </>
  );
}


export default App;