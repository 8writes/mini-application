"use client";
import { useEffect, useState } from "react";

const CountUpTimer = ({ start = 0, end = 60, speed = 1000 }) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (count >= end) return;

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev + 1 >= end) {
          clearInterval(interval);
          return end;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [count, end, speed]);

  return (
    <span className="text-center text-base  text-white">
      {count}s
    </span>
  );
};

export default CountUpTimer;
