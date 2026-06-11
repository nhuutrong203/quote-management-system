import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { MOCK_USERS } from "../services/mockData";
import apiService from "../services/api";

// Icons for Quick Selector Cards
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <line x1="9" y1="22" x2="9" y2="16"></line>
    <line x1="15" y1="22" x2="15" y2="16"></line>
    <line x1="9" y1="16" x2="15" y2="16"></line>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M16 10h.01"></path>
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

// Eye toggle SVGs
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

// Right Arrow icon
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export const Login = () => {
  const { currentUser, login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("Sales/SC");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      // Call backend API login
      const response = await apiService.login(email.trim(), password);
      const rawData = response.data;
      
      // Extract user: rawData.data.user for real backend, rawData for mock fallback
      const user = rawData.data && rawData.data.user 
        ? rawData.data.user 
        : rawData;
      
      // Store user data in context & localStorage
      login(user);
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
      {/* Left pane: Warehouse blueprint backdrop with translucent text card */}
      <div className="login-left-pane">
        <div className="login-brand-card">
          <div style={{ marginBottom: "2rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#799dd6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="10" x2="2" y2="10"></line>
              <path d="M12 22V2l10 8H2z"></path>
            </svg>
          </div>
          <h1 className="login-brand-title" style={{ color: "white" }}>
            Optimizing Packaging<br />Operations Globally.
          </h1>
          <p className="login-brand-desc">
            Streamline your quoting process, manage complex orders, and track real-time inventory with the enterprise-grade management suite.
          </p>
        </div>
      </div>

      {/* Right pane: Figma centered form without white box border */}
      <div className="login-right-pane">
        {/* Top Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="10" x2="2" y2="10"></line>
            <path d="M12 22V2l10 8H2z"></path>
          </svg>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#001e40", margin: 0, lineHeight: 1.1 }}>AMB PACKAGING</h2>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Quote & Order Management System
            </p>
          </div>
        </div>

        {/* Form content wrapper */}
        <div className="login-right-content-wrapper">
          <div style={{ marginBottom: "1.5rem" }}>
            <center><h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#001e40", marginBottom: "4px" }}>Welcome Back</h3></center>
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ height: "40px", fontWeight: 600 }}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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
              style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
            >
              {loading ? (
                "Signing In..."
              ) : retryTime > 0 ? (
                `Thử lại sau ${retryTime}s`
              ) : (
                <>
                  Sign In <ArrowRight />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Don't have an account? </span>
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              Sign Up
            </Link>
          </div>
        </div>

        {/* Footer of the right pane matching Figma exactly */}
        <div className="login-right-footer">
          <div className="login-footer-status">
            <span className="login-status-dot"></span>
            <span>Staging Environment v1.0 - Auth Stub Demo Mode</span>
          </div>
          <div className="login-footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>System Status</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
