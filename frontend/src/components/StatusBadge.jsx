import React from "react";

const translateStatus = (status) => {
  if (status === "Pending") return "Pending HOD";
  if (status === "Processing") return "Pending SC";
  if (status === "PendingApproval") return "Pending GM";
  if (status === "AskedForEdit") return "Edit Required";
  return status;
};

export const StatusBadge = ({ status, children }) => {
  const displayLabel = children || translateStatus(status);
  
  return (
    <span className={`status-badge status-${status}`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
