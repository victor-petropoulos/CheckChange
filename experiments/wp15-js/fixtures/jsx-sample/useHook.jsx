import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  if (count > 0) {
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
  }
  return <div>0</div>;
}