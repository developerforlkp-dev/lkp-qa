import React from "react";

export default function BackToTop({ scroll }) {
  // Handle click event
  const handleClick = (e) => {
    e.preventDefault(); // Prevent default behavior
    window.scrollTo({ top: 0, behavior: "smooth" }); // Smooth scroll
  };

  return (
    <>
      {scroll && (
        <button
          onClick={handleClick}
          className="scroll-to-target scroll-to-top"
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up" />
        </button>
      )}
    </>
  );
}
