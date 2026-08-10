import { useEffect,useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const fetchUser = async () => {
    // console.log("fetchUser is running");
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
 useEffect(() => {
  fetchUser();
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
        <h1>Welcome, {user.name}</h1>
        <p>{user.email}</p>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            setUser(null);
          }}
        >
          Logout
        </button>
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