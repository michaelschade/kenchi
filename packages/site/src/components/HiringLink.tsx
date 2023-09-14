import React, { useCallback, useEffect, useState } from 'react';

export const HiringLink = () => {
  const EXTRA = ' :)';
  const [extraIndex, setExtraIndex] = useState(0);
  const [showSmiley, setShowSmiley] = useState(false);

  const incrExtraIndex = useCallback(() => {
    setExtraIndex((i) => (i + 1) % (EXTRA.length + 1));
  }, []);

  useEffect(() => {
    if (showSmiley) {
      const timeout = setTimeout(incrExtraIndex, 700);
      return () => clearTimeout(timeout);
    } else {
      setExtraIndex(0);
    }
  }, [showSmiley, incrExtraIndex, extraIndex]);

  return (
    <a
      className="cta"
      href="/jobs"
      onFocus={() => setShowSmiley(true)}
      onBlur={() => setShowSmiley(false)}
      onMouseOver={() => setShowSmiley(true)}
      onMouseOut={() => setShowSmiley(false)}
    >
      We're hiring
      {showSmiley && extraIndex > 0 && (
        <span style={{ whiteSpace: 'pre' }}>
          {EXTRA.substring(0, extraIndex)}
        </span>
      )}
    </a>
  );
};
