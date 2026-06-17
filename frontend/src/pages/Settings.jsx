import React, { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";

// Initial mock data containing default parameters matching the pricing setup
const INITIAL_PARAMETERS = {
  boxStyle: [
    { code: "STYLE_RSC", name: "RSC Carton", description: "Regular Slotted Carton - standard packing box", factor: 0.00 },
    { code: "STYLE_FOL", name: "FOL Carton", description: "Full Overlap Slotted Carton - extra top/bottom strength", factor: 0.03 },
    { code: "STYLE_TWO_PIECE", name: "Two-piece Carton", description: "Box with separate lid and base", factor: 0.07 },
    { code: "STYLE_TRAY", name: "Tray Carton", description: "Open top tray style box", factor: 0.05 },
    { code: "STYLE_SLEEVE", name: "Sleeve Carton", description: "Slide-on sleeve wrapping", factor: 0.06 },
    { code: "STYLE_OFFSET", name: "Offset Carton", description: "Offset printed folding carton", factor: 0.04 },
  ],
  type: [
    { code: "TYPE_CORRUGATED", name: "Corrugated Cardboard", description: "Standard brown shipping corrugated board", factor: 0.00 },
    { code: "TYPE_OFFSET", name: "Offset Board", description: "High-quality offset printing paper board", factor: 0.08 },
    { code: "TYPE_OFFSET_LAMINATED", name: "Offset Laminated Board", description: "Laminated surface offset board", factor: 0.16 },
  ],
  fluteType: [
    { code: "FLUTE_B", name: "B Flute", description: "B flute wave - 3.2mm thickness", factor: 0.04 },
    { code: "FLUTE_C", name: "C Flute", description: "C flute wave - 4.0mm thickness", factor: 0.06 },
    { code: "FLUTE_E", name: "E Flute", description: "E flute wave - 1.6mm thickness - thin box", factor: 0.03 },
    { code: "FLUTE_F", name: "F Flute", description: "F flute wave - micro flute 0.8mm", factor: 0.02 },
    { code: "FLUTE_BC", name: "BC Double Wall", description: "BC double wall combination - heavy duty", factor: 0.11 },
    { code: "FLUTE_BE", name: "BE Double Wall", description: "BE double wall combination - medium duty", factor: 0.09 },
    { code: "FLUTE_NA", name: "N/A (No Flute)", description: "Used for non-corrugated cartons", factor: 0.00 },
  ],
  boardQuality: [
    { code: "QUALITY_125_GSM", name: "125 GSM", description: "125 grams per square meter board strength", factor: 0.00 },
    { code: "QUALITY_150_GSM", name: "150 GSM", description: "150 grams per square meter board strength", factor: 0.04 },
    { code: "QUALITY_200_GSM", name: "200 GSM", description: "200 grams per square meter board strength", factor: 0.08 },
    { code: "QUALITY_250_GSM", name: "250 GSM", description: "250 grams per square meter board strength", factor: 0.14 },
    { code: "QUALITY_300_GSM", name: "300 GSM", description: "300 grams per square meter board strength", factor: 0.20 },
  ],
  colors: [
    { code: "COLOR_1", name: "1 Color Flexo", description: "Single color flexographic printing", factor: 0.00 },
    { code: "COLOR_2", name: "2 Colors Flexo", description: "Two colors flexographic printing", factor: 0.05 },
    { code: "COLOR_4", name: "4 Colors Process", description: "Four colors process printing", factor: 0.10 },
    { code: "COLOR_UP_TO_4", name: "Up to 4 Colors", description: "High-quality flexo up to 4 colors", factor: 0.12 },
    { code: "COLOR_4_VARNISH", name: "4 Colors + Varnish", description: "Four colors printing plus protective varnish coating", factor: 0.18 },
  ],
  joints: [
    { code: "JOINT_GLUE", name: "Glue Joint", description: "Standard adhesive side seam joint", factor: 0.00 },
    { code: "JOINT_STITCH", name: "Stitch Joint", description: "Metal wire stitching side seam joint", factor: 0.04 },
  ],
  moq: [
    { code: "MOQ_ENQUIRY", name: "Based on enquiry", description: "Quantity determined upon direct sales enquiry", factor: 1.00 },
    { code: "MOQ_1K", name: "1k (1,000)", description: "1,000 units minimum order quantity", factor: 1.00 },
    { code: "MOQ_3K", name: "3k (3,000)", description: "3,000 units bulk tier (2% discount)", factor: 0.98 },
    { code: "MOQ_5K", name: "5k (5,000)", description: "5,000 units bulk tier (4% discount)", factor: 0.96 },
    { code: "MOQ_10K", name: "10k (10,000)", description: "10,000 units major bulk tier (7% discount)", factor: 0.93 },
  ],
  dimension: [
    { code: "DIM_ID_STD", name: "ID (L x W x H mm)", description: "Inside dimensions measured internally", factor: 0.00 },
    { code: "DIM_OD_STD", name: "OD (L x W x H mm)", description: "Outside dimensions measured externally", factor: 0.02 },
    { code: "DIM_ID_400", name: "ID 400x300x200", description: "Fixed standard size inside dimension", factor: 0.05 },
    { code: "DIM_OD_600", name: "OD 600x400x300", description: "Fixed large size outside dimension", factor: 0.08 },
    { code: "DIM_ID_250", name: "ID 250x180x120", description: "Fixed mini size inside dimension", factor: 0.03 },
  ],
};

// Mock database constraint system representing parameters actively used by customer quotations
const PROTECTED_DB_CODES = new Set([
  "STYLE_RSC",
  "TYPE_CORRUGATED",
  "FLUTE_B",
  "QUALITY_150_GSM",
  "COLOR_2",
  "JOINT_GLUE",
  "MOQ_5K",
  "DIM_ID_STD",
]);

const TAB_METADATA = [
  { key: "boxStyle", label: "Box Style", description: "Governs base structural shapes and processing fees." },
  { key: "type", label: "Type", description: "Defines raw packaging board categories and laminate costs." },
  { key: "fluteType", label: "Flute Type", description: "Determines physical sheet thickness and waste factor." },
  { key: "boardQuality", label: "Board Quality", description: "Determines base paper density (GSM) and paper costing." },
  { key: "colors", label: "Colors", description: "Handles flexographic print run setup and color varnish additions." },
  { key: "joints", label: "Joints", description: "Determines joint sealing method (stapling vs adhesive gluing)." },
  { key: "moq", label: "MOQ Tiers", description: "Sets commercial bulk discount scaling brackets." },
  { key: "dimension", label: "Dimension", description: "Coordinates length, width, height, and surface area ratios." },
];

export const Settings = () => {
  const { currentUser, switchRole, login } = useContext(AuthContext);

  // Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState("profile"); // 'profile' | 'masterData' | 'userManagement'

  // Core Master Data State
  const [parameters, setParameters] = useState(INITIAL_PARAMETERS);
  const [activeTab, setActiveTab] = useState("boxStyle");
  const [toasts, setToasts] = useState([]);

  // User List State
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDeleteOpen, setIsUserDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State for User
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState("");
  const [userFormErrors, setUserFormErrors] = useState({});
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Master Data Modal Lifecycles
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [selectedRow, setSelectedRow] = useState(null);

  // Form State for Master Data
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFactor, setFormFactor] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Sandbox State
  const [sandboxBoxStyle, setSandboxBoxStyle] = useState("STYLE_RSC");
  const [sandboxType, setSandboxType] = useState("TYPE_CORRUGATED");
  const [sandboxFlute, setSandboxFlute] = useState("FLUTE_B");
  const [sandboxQuality, setSandboxQuality] = useState("QUALITY_150_GSM");
  const [sandboxColors, setSandboxColors] = useState("COLOR_2");
  const [sandboxJoints, setSandboxJoints] = useState("JOINT_GLUE");
  const [sandboxMoq, setSandboxMoq] = useState("MOQ_5K");
  const [sandboxDimension, setSandboxDimension] = useState("DIM_ID_STD");
  const [sandboxQty, setSandboxQty] = useState(5000);

  const isGM = currentUser?.role === "GM";

  // Load User List from API
  useEffect(() => {
    const fetchUsersList = async () => {
      try {
        const response = await apiService.getUsers();
        // Append a default password property for mock editing if not present
        const fetchedUsers = (response.data || []).map((u) => ({
          ...u,
          password: u.password || "demo1234",
        }));
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    fetchUsersList();
  }, []);

  // Filter users list based on roles
  const visibleUsers = useMemo(() => {
    if (isGM) return users;
    return users.filter((u) => u.id === currentUser?.id);
  }, [users, isGM, currentUser]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Open Form Modal (Add case)
  const handleOpenAdd = () => {
    if (!isGM) {
      showToast("Access Denied: Only GM has permission to modify configuration parameters.", "error");
      return;
    }
    setModalMode("add");
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormFactor(0);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Form Modal (Edit case)
  const handleOpenEdit = (row) => {
    if (!isGM) {
      showToast("Access Denied: Only GM has permission to modify configuration parameters.", "error");
      return;
    }
    setModalMode("edit");
    setSelectedRow(row);
    setFormCode(row.code);
    setFormName(row.name);
    setFormDescription(row.description);
    setFormFactor(row.factor);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Submit Handler for Master Data
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isGM) return;

    const errors = {};
    if (!formCode.trim()) errors.code = "Parameter Code is strictly mandatory.";
    if (!formName.trim()) errors.name = "Display Name is strictly mandatory.";
    if (!formDescription.trim()) errors.description = "Description is strictly mandatory.";
    if (isNaN(formFactor)) errors.factor = "Value Factor must be a valid number.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitLoading(true);

    setTimeout(() => {
      const codeUpper = formCode.trim().toUpperCase();
      const newOption = {
        code: codeUpper,
        name: formName.trim(),
        description: formDescription.trim(),
        factor: Number(formFactor),
      };

      if (modalMode === "add") {
        const codeExists = parameters[activeTab].some((item) => item.code === codeUpper);
        if (codeExists) {
          setFormErrors({ code: "This Parameter Code already exists in this configuration." });
          setIsSubmitLoading(false);
          return;
        }

        setParameters((prev) => ({
          ...prev,
          [activeTab]: [...prev[activeTab], newOption],
        }));
        showToast(`Option "${newOption.name}" successfully created!`);
      } else {
        setParameters((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].map((item) => (item.code === selectedRow.code ? newOption : item)),
        }));
        showToast(`Option "${newOption.name}" successfully updated!`);
      }

      setIsSubmitLoading(false);
      setIsFormOpen(false);
    }, 800);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (row) => {
    if (!isGM) {
      showToast("Access Denied: Only GM has permission to modify configuration parameters.", "error");
      return;
    }
    setSelectedRow(row);
    setIsDeleteOpen(true);
  };

  // Delete Handler
  const handleDeleteConfirm = () => {
    if (!selectedRow || !isGM) return;

    setIsSubmitLoading(true);

    setTimeout(() => {
      if (PROTECTED_DB_CODES.has(selectedRow.code)) {
        showToast(`Cannot delete this option because it is actively applied to ongoing orders.`, "error");
        setIsSubmitLoading(false);
        setIsDeleteOpen(false);
        return;
      }

      setParameters((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((item) => item.code !== selectedRow.code),
      }));

      showToast(`Option "${selectedRow.name}" successfully deleted!`);
      setIsSubmitLoading(false);
      setIsDeleteOpen(false);
    }, 600);
  };

  // Open User Edit Modal
  const handleOpenUserEdit = (user) => {
    const isOwnAccount = user.id === currentUser?.id;
    if (!isGM && !isOwnAccount) {
      showToast("Access Denied: You cannot edit other users' profiles.", "error");
      return;
    }

    setSelectedUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPassword(user.password || "demo1234");
    setUserFormRole(user.role);
    setUserFormErrors({});
    setShowUserPassword(false);
    setIsUserModalOpen(true);
  };

  // User Form Submit
  const handleUserSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!userFormName.trim()) errors.name = "Name is required.";
    if (!userFormEmail.trim()) errors.email = "Email is required.";
    if (!userFormPassword.trim()) errors.password = "Password cannot be empty.";

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    setIsSubmitLoading(true);

    setTimeout(async () => {
      try {
        const response = await apiService.updateUser(selectedUser.id, {
          name: userFormName.trim(),
          email: userFormEmail.trim(),
          password: userFormPassword.trim(),
          role: userFormRole,
        });
        const updatedUser = response.data;

        // Update in local users state
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));

        // If edited own account, sync context immediately
        if (selectedUser.id === currentUser?.id) {
          login(updatedUser);
        }

        showToast(`Account ${updatedUser.name} successfully updated!`);
        setIsSubmitLoading(false);
        setIsUserModalOpen(false);
      } catch (err) {
        console.error(err);
        showToast("An error occurred while updating the account.", "error");
        setIsSubmitLoading(false);
      }
    }, 700);
  };

  // Open User Delete Modal
  const handleOpenUserDelete = (user) => {
    if (!isGM) {
      showToast("Access Denied: Only GM has permission to delete user accounts.", "error");
      return;
    }
    if (user.id === currentUser?.id) {
      showToast("You cannot delete your own General Manager account!", "error");
      return;
    }
    setSelectedUser(user);
    setIsUserDeleteOpen(true);
  };

  // Confirm User Delete Handler
  const handleUserDeleteConfirm = () => {
    if (!selectedUser || !isGM) return;

    setIsSubmitLoading(true);

    setTimeout(async () => {
      try {
        await apiService.deleteUser(selectedUser.id);
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        showToast(`Account ${selectedUser.name} successfully deleted!`);
        setIsSubmitLoading(false);
        setIsUserDeleteOpen(false);
      } catch (err) {
        console.error(err);
        showToast("An error occurred while deleting the account.", "error");
        setIsSubmitLoading(false);
      }
    }, 600);
  };

  // Pricing Sandbox Calculations
  const calculatedQuotePrice = useMemo(() => {
    const styleObj = parameters.boxStyle.find((p) => p.code === sandboxBoxStyle) || { factor: 0 };
    const typeObj = parameters.type.find((p) => p.code === sandboxType) || { factor: 0 };
    const fluteObj = parameters.fluteType.find((p) => p.code === sandboxFlute) || { factor: 0 };
    const qualityObj = parameters.boardQuality.find((p) => p.code === sandboxQuality) || { factor: 0 };
    const colorsObj = parameters.colors.find((p) => p.code === sandboxColors) || { factor: 0 };
    const jointsObj = parameters.joints.find((p) => p.code === sandboxJoints) || { factor: 0 };
    const moqObj = parameters.moq.find((p) => p.code === sandboxMoq) || { factor: 1 };
    const dimObj = parameters.dimension.find((p) => p.code === sandboxDimension) || { factor: 0 };

    const basePaperCost = 0.45 + (qualityObj.factor || 0);
    const fluteWasteFactor = 1.05 + (fluteObj.factor || 0);
    const dimAreaFactor = 1.1 + (dimObj.factor || 0);

    const boardCost = basePaperCost * fluteWasteFactor * dimAreaFactor;
    const processingFees = (styleObj.factor || 0) + (typeObj.factor || 0) + (colorsObj.factor || 0) + (jointsObj.factor || 0);
    const moqMultiplier = moqObj.factor || 1;

    const unitPrice = Math.max((boardCost + processingFees) * moqMultiplier, 0.15);
    const lineTotal = unitPrice * Number(sandboxQty || 0);

    return {
      unitPrice: Number(unitPrice.toFixed(4)),
      lineTotal: Number(lineTotal.toFixed(2)),
      boardCost: Number(boardCost.toFixed(4)),
      processingFees: Number(processingFees.toFixed(4)),
      moqDiscount: ((1 - moqMultiplier) * 100).toFixed(0),
    };
  }, [
    parameters,
    sandboxBoxStyle,
    sandboxType,
    sandboxFlute,
    sandboxQuality,
    sandboxColors,
    sandboxJoints,
    sandboxMoq,
    sandboxDimension,
    sandboxQty,
  ]);

  return (
    <div className="space-y-6 pb-16 text-left max-w-7xl mx-auto px-4" style={{ fontFamily: "var(--font-sans)" }}>
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`shadow-lg rounded-lg p-4 text-white font-semibold flex items-center gap-3 transition-all transform translate-y-0 opacity-100 ${
              toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
            }`}
          >
            {toast.type === "error" ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Settings Navigation Menu (Sub-tabs) */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 py-2">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === "profile"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Profile & Environment
          </button>
          <button
            onClick={() => setActiveSubTab("masterData")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === "masterData"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Master Data Configuration
          </button>
          <button
            onClick={() => setActiveSubTab("userManagement")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === "userManagement"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            User & Role Management
          </button>
        </nav>
      </div>

      {/* SUB-TAB 1: PROFILE & ENVIRONMENT TESTING */}
      {activeSubTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <img src={currentUser.avatar} alt="User Avatar" className="w-16 h-16 rounded-full border border-slate-200 bg-slate-50" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">{currentUser.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{currentUser.email}</p>
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-sky-50 text-[#003366] font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-sky-100">
                    {currentUser.role === "Sales" ? "Sales/SC" : currentUser.role === "SC_HEAD" ? "SC Head" : currentUser.role}
                  </span>
                </div>
              </div>

              {/* Switches active roles context directly inside profile subtab */}
              <div className="space-y-2 max-w-sm">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Switch Active Role</label>
                <p className="text-xs text-slate-400 font-medium">Change your active role to test layout permissions and workflow approvals.</p>
                <div className="relative mt-2">
                  <select
                    value={currentUser.role}
                    onChange={(e) => switchRole(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 py-2.5 pl-4 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer w-full"
                  >
                    <option value="Sales">Sales Representative (Siow)</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="SC_HEAD">Supply Chain Head (SC Head)</option>
                    <option value="GM">General Manager (GM)</option>
                    <option value="Planning">Planning Department</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental details card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Environment Details</h3>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-500 font-semibold">System Version:</td>
                    <td className="py-3 font-bold text-right text-slate-800">v1.0.2 - Staging Mode</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-500 font-semibold">Storage Mode:</td>
                    <td className="py-3 font-bold text-right text-emerald-600">MongoDB Backend API</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-500 font-semibold">API Driver:</td>
                    <td className="py-3 font-bold text-right text-slate-800">Axios + Express Server</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-slate-500 font-semibold">Master Data Access:</td>
                    <td className="py-3 font-bold text-right text-slate-800">
                      {isGM ? "Full Write Access (GM)" : "Read Only (Sales/SC/HOD/SC Head)"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: MASTER DATA CONFIGURATION */}
      {activeSubTab === "masterData" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Title Section */}
            <div className="border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Master Data Configuration</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {isGM ? "Create, modify or delete packaging parameter configurations." : "View active packaging parameters (GM only editing privileges)."}
                </p>
              </div>
              {isGM && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 bg-[#003366] hover:bg-[#001e40] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all transform hover:-translate-y-[1px] cursor-pointer"
                >
                  <span>➕</span> Add New Option
                </button>
              )}
            </div>

            {/* Horizontal parameter sub-tabs */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 overflow-x-auto">
              <nav className="flex gap-2 min-w-max py-3">
                {TAB_METADATA.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const count = parameters[tab.key]?.length || 0;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#003366] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Description Banner */}
            <div className="bg-sky-50/40 px-6 py-2.5 border-b border-slate-100/60 flex items-center gap-2.5 text-xs text-sky-800 font-bold">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{TAB_METADATA.find((t) => t.key === activeTab)?.description}</span>
            </div>

            {/* Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="px-6 py-4">Parameter Code</th>
                    <th className="px-6 py-4">Display Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Value Factor</th>
                    {isGM && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters[activeTab].map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-700">{row.code}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{row.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium max-w-sm truncate">{row.description}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                          {row.factor >= 0 ? `+${row.factor}` : row.factor}
                        </span>
                      </td>
                      {isGM && (
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              title="Edit parameter"
                              className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                            >
                              📝
                            </button>
                            <button
                              onClick={() => handleOpenDelete(row)}
                              title="Delete parameter"
                              className="p-1 bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 text-red-600 rounded transition-colors cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Sandbox */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Pricing Formula Sandbox</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Test the pricing formula live based on active system parameters.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Box Style</label>
                <select
                  value={sandboxBoxStyle}
                  onChange={(e) => setSandboxBoxStyle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.boxStyle.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Type</label>
                <select
                  value={sandboxType}
                  onChange={(e) => setSandboxType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.type.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Flute</label>
                <select
                  value={sandboxFlute}
                  onChange={(e) => setSandboxFlute(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.fluteType.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">GSM Quality</label>
                <select
                  value={sandboxQuality}
                  onChange={(e) => setSandboxQuality(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.boardQuality.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Colors</label>
                <select
                  value={sandboxColors}
                  onChange={(e) => setSandboxColors(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.colors.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Joints</label>
                <select
                  value={sandboxJoints}
                  onChange={(e) => setSandboxJoints(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.joints.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (+{p.factor})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">MOQ Discount</label>
                <select
                  value={sandboxMoq}
                  onChange={(e) => setSandboxMoq(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                >
                  {parameters.moq.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} ({p.factor}x)</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Quantity (pcs)</label>
                <input
                  type="number"
                  value={sandboxQty}
                  onChange={(e) => setSandboxQty(Math.max(1, Number(e.target.value || 1)))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 font-bold text-xs"
                  min="1"
                />
              </div>
            </div>

            <div className="bg-sky-50/40 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4 border border-sky-100/50">
              <div>
                <span className="text-[10px] font-black text-sky-800 uppercase block">Estimated Unit Price</span>
                <span className="text-xl font-mono font-black text-[#003366] block mt-1">S${calculatedQuotePrice.unitPrice}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-sky-800 uppercase block">Sandbox Line Total</span>
                <span className="text-lg font-mono font-bold text-slate-700 block mt-1">
                  S${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(calculatedQuotePrice.lineTotal)}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: USER MANAGEMENT & ROLE UPGRADE */}
      {activeSubTab === "userManagement" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-extrabold text-slate-800">Account & Role Management</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isGM
                ? "Upgrade user roles, edit passwords and manage employee accounts."
                : "Edit your personal information and update your password."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((u) => {
                  const isOwn = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <img src={u.avatar} alt="User Avatar" className="w-8 h-8 rounded-full bg-slate-50" />
                        <span className="font-bold text-slate-800">
                          {u.name} {isOwn && <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-black ml-1">YOU</span>}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono font-medium">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`role-tag role-${u.role.replace('/', '-').replace(/\s+/g, '-')}`}>
                          {u.role === "Sales" ? "Sales/SC" : u.role === "SC_HEAD" ? "SC Head" : u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserEdit(u)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#003366] px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            {isGM ? "Upgrade / Edit" : "Edit Details"}
                          </button>
                          {isGM && (
                            <button
                              onClick={() => handleOpenUserDelete(u)}
                              disabled={isOwn}
                              className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                                isOwn
                                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-50 hover:bg-red-50 hover:border-red-200 border-slate-200 text-red-600 cursor-pointer"
                              }`}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER PROFILE & ROLE EDIT MODAL POPUP */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#003366] text-white flex justify-between items-center">
              <h3 className="text-sm font-extrabold">
                {isGM ? `Upgrade Role / Edit User` : `Edit Account Information`}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white hover:text-white/80 font-bold text-lg cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Employee Name</label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none ${
                    userFormErrors.name ? "border-red-500" : "focus:border-sky-500"
                  }`}
                />
                {userFormErrors.name && <span className="text-[10px] font-bold text-red-500">{userFormErrors.name}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Corporate Email</label>
                <input
                  type="email"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none ${
                    userFormErrors.email ? "border-red-500" : "focus:border-sky-500"
                  }`}
                />
                {userFormErrors.email && <span className="text-[10px] font-bold text-red-500">{userFormErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">New Password</label>
                <div className="relative">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 pr-10 text-xs font-bold focus:outline-none ${
                      userFormErrors.password ? "border-red-500" : "focus:border-sky-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showUserPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {userFormErrors.password && <span className="text-[10px] font-bold text-red-500">{userFormErrors.password}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Role (Role Upgrade)</label>
                  {!isGM && <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-bold">View Only</span>}
                </div>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value)}
                  disabled={!isGM}
                  className={`w-full border text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none ${
                    !isGM ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 focus:border-sky-500 cursor-pointer"
                  }`}
                >
                  <option value="Sales">Sales Representative (Sales/SC)</option>
                  <option value="HOD">Head of Department (HOD)</option>
                  <option value="SC_HEAD">Supply Chain Head (SC Head)</option>
                  <option value="GM">General Manager (GM)</option>
                  <option value="Planning">Planning Department</option>
                </select>
                {!isGM && (
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Only General Manager (GM) accounts can upgrade user roles.</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-[#003366] hover:bg-[#001e40] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitLoading && (
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* USER DELETE CONFIRMATION MODAL POPUP */}
      {isUserDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl">
              ⚠️
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete user account <strong className="text-slate-800">{selectedUser?.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => setIsUserDeleteOpen(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={handleUserDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitLoading && (
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Delete Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MASTER DATA FORM MODAL popup (Create / Edit Case) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden transform scale-100 transition-transform">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#003366] text-white">
              <h3 className="text-xs font-extrabold">
                {modalMode === "add" ? `➕ Add New Option` : `📝 Edit Option`}
              </h3>
              <button
                disabled={isSubmitLoading}
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white transition-colors text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Parameter Code</label>
                <input
                  type="text"
                  placeholder="e.g. FLUTE_B"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  disabled={modalMode === "edit"}
                  className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    modalMode === "edit" ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-slate-50 text-slate-800 border-slate-200 focus:border-sky-500"
                  } ${formErrors.code ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/10" : ""}`}
                />
                {formErrors.code && <span className="text-[10px] font-bold text-red-500">{formErrors.code}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. B Flute"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                    formErrors.name ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/10" : ""
                  }`}
                />
                {formErrors.name && <span className="text-[10px] font-bold text-red-500">{formErrors.name}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Provide details about the physical specification..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                    formErrors.description ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/10" : ""
                  }`}
                />
                {formErrors.description && <span className="text-[10px] font-bold text-red-500">{formErrors.description}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Value Factor (Base Adjustment)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formFactor}
                  onChange={(e) => setFormFactor(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                    formErrors.factor ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/10" : ""
                  }`}
                />
                {formErrors.factor && <span className="text-[10px] font-bold text-red-500">{formErrors.factor}</span>}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitLoading}
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-[#003366] hover:bg-[#001e40] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitLoading && (
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isSubmitLoading ? "Saving..." : "Save Configuration"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl">
              ⚠️
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Confirm Option Deletion</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{selectedRow?.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => setIsDeleteOpen(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitLoading && (
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSubmitLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
