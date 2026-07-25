import React from "react";

/**
 * Simple full-page loading spinner used while auth or pages load.
 */
function PageLoader({ message = "Loading..." }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <p className="page-loader-text">{message}</p>
    </div>
  );
}

export default PageLoader;
