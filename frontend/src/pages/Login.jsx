import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { MOCK_USERS } from "../services/mockData";
import apiService from "../services/api";

export const Login = () => {
  const { currentUser, login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("Sales/SC");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryTime, setRetryTime] = useState(0);
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Set default credentials on mount
  useEffect(() => {
    const defaultUser = MOCK_USERS.find((u) => u.role === "Sales/SC") || MOCK_USERS[0];
    if (defaultUser) {
      setEmail(defaultUser.email);
      setPassword("demo1234");
    }
  }, []);

  const handleRoleCardClick = (user) => {
    setSelectedRole(user.role);
    setEmail(user.email);
    setPassword("demo1234");
  };

  const startRetryTimer = (seconds) => {
    setRetryTime(seconds);
    const interval = setInterval(() => {
      setRetryTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email không được để trống.");
      return;
    }
    if (!password) {
      setError("Mật khẩu không được để trống.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login(email.trim(), password);
      // Backend returns user data (which has role, email, name, avatar, token etc.)
      const userData = response.data;
      login(userData.user || userData);
      navigate("/");
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setError("Email hoặc mật khẩu không chính xác.");
        } else if (status === 403) {
          setError("Tài khoản đang chờ Admin phê duyệt.");
        } else if (status === 429) {
          const retryAfter = err.response.data?.retryAfter || err.response.headers?.['retry-after'] || 30;
          setError(`Sai quá nhiều lần. Hãy thử lại sau ${retryAfter} giây.`);
          startRetryTimer(retryAfter);
        } else {
          setError(err.response.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container fade-in">
      {/* Cột trái: Thương hiệu nền tối */}
      <div className="login-left-pane">
        <div style={{ marginBottom: "2rem" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#799dd6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="10" x2="2" y2="10"></line>
            <path d="M12 22V2l10 8H2z"></path>
          </svg>
        </div>
        <h1 className="login-brand-title">
          Optimizing Packaging<br />Operations Globally.
        </h1>
        <p className="login-brand-desc">
          Streamline your quoting process, manage complex orders, and track real-time inventory with the enterprise-grade management suite.
        </p>
      </div>

      {/* Cột phải: Khung đăng nhập */}
      <div className="login-right-pane">
        <div className="login-form-box">
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>AMB PACKAGING</h2>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
              Quote & Order Management System
            </p>
            
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#001e40", marginBottom: "4px" }}>Welcome Back</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Please select a role or enter your credentials to sign in.
            </p>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: "var(--danger-light)", 
              color: "var(--danger)", 
              padding: "0.75rem", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "0.8rem", 
              fontWeight: 700, 
              marginBottom: "1rem" 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Quick role switcher cards */}
            <div className="role-mini-grid">
              {MOCK_USERS.map((user) => {
                const labelMap = {
                  "Sales/SC": "Sales / SC",
                  "HOD": "Head Of Dept",
                  "SC Head": "SC Head",
                  "GM": "General Manager"
                };

                return (
                  <div
                    key={user.id}
                    className={`role-mini-card ${selectedRole === user.role ? "active" : ""}`}
                    onClick={() => handleRoleCardClick(user)}
                  >
                    <span className="role-mini-card-label">{labelMap[user.role]}</span>
                    <span className="role-mini-card-email" title={user.email}>{user.email}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "1rem 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>or use credentials</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="username@amb.com.sg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ height: "40px", fontWeight: 600 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Secure Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ height: "40px", fontWeight: 600 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600, color: "var(--text-secondary)" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)" }} /> Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || retryTime > 0}
              style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
            >
              {loading ? "Signing In..." : retryTime > 0 ? `Thử lại sau ${retryTime}s` : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Don't have an account? </span>
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              Sign Up
            </Link>
          </div>

          {/* Footer inside login card */}
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              Staging Environment v1.0 - Auth Stub Demo Mode
            </span>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)" }}>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "inherit", textDecoration: "none" }}>System Status</a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "inherit", textDecoration: "none" }}>Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
