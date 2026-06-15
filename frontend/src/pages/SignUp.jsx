import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// SVGs for Visibility Toggle
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

export const SignUp = () => {
  const { currentUser, register, login } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [proposedRole, setProposedRole] = useState("Sales");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryTime, setRetryTime] = useState(0);
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

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

  // Helper for dynamic password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: "None", score: 0, colorClass: "" };
    if (pass.length < 6) return { label: "Too Short", score: 1, colorClass: "weak" };
    
    // Check complexity
    const hasNumbers = /\d/.test(pass);
    const hasNonalphas = /\W/.test(pass);
    const hasMixed = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
    
    let strengthScore = 1;
    if (hasNumbers || hasNonalphas) strengthScore++;
    if (hasMixed && pass.length >= 8) strengthScore++;
    
    if (strengthScore === 1) return { label: "Weak", score: 1, colorClass: "weak" };
    if (strengthScore === 2) return { label: "Medium", score: 2, colorClass: "medium" };
    return { label: "Strong", score: 3, colorClass: "strong" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Frontend validations
    if (!name.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }
    if (!email.trim()) {
      setError("Email không được để trống.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Định dạng email không hợp lệ.");
      return;
    }
    if (!password) {
      setError("Mật khẩu không được để trống.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const newUser = await register(name.trim(), email.trim(), password, proposedRole);
      setSuccessMessage("Đăng ký thành công! Đang đăng nhập...");
      
      // Extract user: newUser.data for real backend, newUser for mock fallback
      const user = newUser.data && typeof newUser.data === "object" && newUser.data.email 
        ? newUser.data 
        : newUser;
      
      // Auto login and redirect to dashboard
      login(user);
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        if (status === 409) {
          setError("Email này đã được đăng ký.");
        } else if (status === 403) {
          setError("Tài khoản đang chờ Admin phê duyệt.");
        } else if (status === 429) {
          const retryAfter = err.response.data?.retryAfter || err.response.headers?.['retry-after'] || 30;
          setError(`Sai quá nhiều lần. Hãy thử lại sau ${retryAfter} giây.`);
          startRetryTimer(retryAfter);
        } else {
          setError(err.response.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-container fade-in">
      {/* Header bar matching Figma design */}
      <header className="signup-header">
        <div className="signup-header-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="10" x2="2" y2="10"></line>
            <path d="M12 22V2l10 8H2z"></path>
          </svg>
          <div className="signup-header-logo-text">
            <h2 className="signup-header-logo-title">AMB PACKAGING</h2>
            <p className="signup-header-logo-sub">Quote & Order Management System</p>
          </div>
        </div>
        <nav className="signup-header-nav">
          <a href="#" onClick={(e) => e.preventDefault()} className="signup-header-link">Contact Support</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="signup-header-link">Help Center</a>
          <Link to="/login" className="signup-header-btn">Log In</Link>
        </nav>
      </header>

      {/* Main content area containing Figma form card */}
      <main className="signup-body">
        <div className="signup-card">
          <h1 className="signup-card-title">Create An Account</h1>
          <p className="signup-card-subtitle">Register to request system access</p>

          {error && (
            <div style={{ 
              backgroundColor: "var(--danger-light)", 
              color: "var(--danger)", 
              padding: "0.75rem", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "0.8rem", 
              fontWeight: 700, 
              marginBottom: "1.25rem" 
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ 
              backgroundColor: "var(--success-light)", 
              color: "var(--success)", 
              padding: "0.75rem", 
              borderRadius: "var(--radius-sm)", 
              fontSize: "0.8rem", 
              fontWeight: 700, 
              marginBottom: "1.25rem" 
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ height: "40px" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ height: "40px" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ height: "40px" }}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="password-strength-container">
                  <div className="password-strength-header">
                    <span>Password Strength</span>
                    <span className="password-strength-label-value">{strength.label}</span>
                  </div>
                  <div className="password-strength-bars">
                    <div className={`password-strength-bar ${strength.score >= 1 ? strength.colorClass : ""}`}></div>
                    <div className={`password-strength-bar ${strength.score >= 2 ? strength.colorClass : ""}`}></div>
                    <div className={`password-strength-bar ${strength.score >= 3 ? strength.colorClass : ""}`}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ height: "40px" }}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Proposed Role</label>
              <select 
                className="form-control" 
                value={proposedRole} 
                onChange={(e) => setProposedRole(e.target.value)}
                style={{ height: "40px", cursor: "pointer", fontWeight: 600 }}
              >
                <option value="Sales">Sales/SC</option>
                <option value="HOD">HOD</option>
                <option value="SC_HEAD">SC Head</option>
                <option value="GM">GM</option>
                <option value="Planning">Planning</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || retryTime > 0}
              style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", marginTop: "1rem" }}
            >
              {loading ? "Registering..." : retryTime > 0 ? `Thử lại sau ${retryTime}s` : "Sign Up"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Already have an account? </span>
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              Log In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer matching Figma design */}
      <footer className="signup-footer">
        <div className="signup-footer-left">
          <span className="signup-footer-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            PRECISION LOGISTICS
          </span>
          <span>© 2024 PRECISION LOGISTICS & PACKAGING SOLUTIONS. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="signup-footer-right">
          <a href="#" onClick={(e) => e.preventDefault()} className="signup-footer-link">Privacy Policy</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="signup-footer-link">Terms of Service</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="signup-footer-link">Security</a>
        </div>
      </footer>
    </div>
  );
};

export default SignUp;
