import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const Settings = () => {
  const { currentUser, switchRole } = useContext(AuthContext);

  const handleRoleChange = (e) => {
    switchRole(e.target.value);
  };

  return (
    <div className="card fade-in" style={{ textAlign: "left", maxWidth: "600px" }}>
      <h2 style={{ color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        Settings Panel
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>User Information</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "var(--bg-app)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <img src={currentUser.avatar} alt="avatar" style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ffffff" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{currentUser.name}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{currentUser.email}</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 700 }}>Switch Active Role</label>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            Change your role to test the approval workflow from different department perspectives.
          </p>
          <select className="form-control" value={currentUser.role} onChange={handleRoleChange} style={{ fontWeight: 600 }}>
            <option value="Sales">Sales Representative (Siow)</option>
            <option value="HOD">Head Of Dept (HOD)</option>
            <option value="SC_HEAD">Supply Chain Head (SC_HEAD)</option>
            <option value="GM">General Manager (GM)</option>
          </select>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Environment Details</h3>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 0", color: "var(--text-secondary)", fontWeight: 600 }}>System Version:</td>
                <td style={{ padding: "0.5rem 0", fontWeight: 700, textAlign: "right" }}>v1.0.0-staging</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", color: "var(--text-secondary)", fontWeight: 600 }}>Storage Mode:</td>
                <td style={{ padding: "0.5rem 0", fontWeight: 700, textAlign: "right", color: "var(--success)" }}>MongoDB Backend API</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", color: "var(--text-secondary)", fontWeight: 600 }}>API Client:</td>
                <td style={{ padding: "0.5rem 0", fontWeight: 700, textAlign: "right" }}>Axios + Express API</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
