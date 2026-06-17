import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import apiService from "../services/api";

export const Layout = () => {
  const { currentUser, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState(null);

  const handleRoleChange = (e) => {
    switchRole(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiService.getNotifications();
      const latestNotification = response.data?.[0];

      if (!latestNotification) return;

      setNotificationBanner((currentBanner) => {
        if (currentBanner?.id === latestNotification.id) {
          return currentBanner;
        }

        return latestNotification;
      });
    } catch (error) {
      console.error("Error polling notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, currentUser?.id]);

  const getRoleLabel = (role) => {
    if (role === "Sales") return "Sales/SC";
    if (role === "SC_HEAD") return "SC Head";
    return role;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard Overview";
    if (path === "/quotes") return "Quotes List";
    if (path.includes("/quotes/new")) return "New Quote";
    if (path.includes("/quotes/edit")) return "Edit Quote";
    if (path.includes("/quotes/")) return "Quote Details";
    if (path.includes("/orders/preview/")) return "Order Form Preview";
    if (path === "/settings") return "Settings Panel";
    return "Workspace";
  };

  if (!currentUser) return null;

  return (
    <div className="app-container fade-in">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="10" x2="2" y2="10"></line>
            <path d="M12 22V2l10 8H2z"></path>
          </svg>
        </div>
        
        <nav style={{ flex: 1, width: "100%" }}>
          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === "/" ? "active" : ""}`} title="Dashboard">
              <Link to="/">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
              </Link>
            </li>
            
            <li className={`sidebar-item ${location.pathname.startsWith("/quotes") ? "active" : ""}`} title="Documents">
              <Link to="/quotes">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </Link>
            </li>

            <li className={`sidebar-item ${location.pathname === "/settings" ? "active" : ""}`} title="Settings">
              <Link to="/settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: "auto", display: "flex", justifyContent: "center", alignItems: "center" }} title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${location.pathname === "/" ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/quotes" className={`bottom-nav-item ${location.pathname.startsWith("/quotes") ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Quotes</span>
        </Link>

        <button onClick={() => setShowSettingsModal(true)} className={`bottom-nav-item ${showSettingsModal ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="header-bar">
          <div>
            {location.pathname === "/" || location.pathname === "/quotes" ? (
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
                Good Morning, {currentUser.name}
              </h2>
            ) : (
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
                {getPageTitle()}
              </h2>
            )}
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>AMB Packaging Corporate Portal</p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {/* Quick Testing Switcher */}
            <div className="role-switcher-container" style={{ display: "flex" }}>
              <span style={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.85rem" }}>Active Role:</span>
              <select className="role-select" value={currentUser.role} onChange={handleRoleChange}>
                <option value="Sales">Sales/SC (Siow)</option>
                <option value="HOD">HOD (Head of Dept)</option>
                <option value="SC_HEAD">SC Head (Supply Chain)</option>
                <option value="GM">GM (General Manager)</option>
                <option value="Planning">Planning Department</option>
              </select>
            </div>

            {/* Profile Avatar / Role Tag */}
            <div className="user-profile-badge">
              <img src={currentUser.avatar} alt="avatar" className="user-avatar" />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: "1.1" }}>{currentUser.name}</span>
                <span className={`role-tag role-${currentUser.role.replace('/', '-').replace(/\s+/g, '-')}`}>{getRoleLabel(currentUser.role)}</span>
              </div>
            </div>
          </div>
        </header>

        {notificationBanner && (
          <div className="notification-banner" role="status">
            <span>{notificationBanner.message}</span>
            <button
              type="button"
              className="notification-banner-close"
              onClick={() => setNotificationBanner(null)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        )}

        {/* Settings Modal (Mobile Role Selector / Logout) */}
        {showSettingsModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem"
            }}
            onClick={() => setShowSettingsModal(false)}
          >
            <div
              className="card"
              style={{ width: "320px", padding: "1.5rem", textAlign: "left" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "1rem" }}>Settings / Switch Role</h3>
              
              <div className="form-group">
                <label className="form-label">Active Role</label>
                <select
                  className="form-control"
                  value={currentUser.role}
                  onChange={(e) => {
                    handleRoleChange(e);
                    setShowSettingsModal(false);
                  }}
                >
                  <option value="Sales">Sales/SC (Siow)</option>
                  <option value="HOD">HOD (Head of Dept)</option>
                  <option value="SC_HEAD">SC Head (Supply Chain)</option>
                  <option value="GM">GM (General Manager)</option>
                  <option value="Planning">Planning Department</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                  Sign Out
                </button>
                <button onClick={() => setShowSettingsModal(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic page render */}
        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
