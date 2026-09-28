export function formatApiError(detail, fallback = "Request failed. Please try again.") {
  const message = (value) => {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object") return "";
    if (typeof value.msg === "string") {
      const field = Array.isArray(value.loc)
        ? value.loc.filter((part) => typeof part === "string" && !["body", "query", "path"].includes(part)).join(".")
        : "";
      return `${field ? `${field}: ` : ""}${value.msg}`;
    }
    return typeof value.message === "string" ? value.message : "";
  };
  return (Array.isArray(detail) ? detail.map(message).filter(Boolean).join("; ") : message(detail)) || fallback;
}

export function normalizeApiError(error) {
  const data = error.response?.data;
  if (data && typeof data === "object" && !(data instanceof Blob)) {
    error.validationDetails = data.detail;
    data.detail = formatApiError(data.detail);
  }
  return error;
}
