import * as React from "react";
import { useEffect, useState } from "react";
import { MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const PADDING = 10;

interface CounterProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  > {
  start?: number;
  end: number;
  duration?: number;
  className?: string;
  fontSize?: number;
}

export const Counter = ({
  start = 0,
  end,
  duration = end,
  className,
  fontSize = 30,
  ...rest
}: CounterProps) => {
  const [value, setValue] = useState(start);
  // Roll height tracks the actual font size (the original hard-coded this).
  const height = fontSize + PADDING;

  useEffect(() => {
    const interval = setInterval(
      () => setValue((prev) => (prev < end ? prev + 1 : prev)),
      (duration / (end - start)) * 1000,
    );
    return () => clearInterval(interval);
  }, [value, duration, end, start]);

  return (
    <div
      style={{ fontSize }}
      {...rest}
      className={cn(
        "flex overflow-hidden rounded px-2 leading-none text-content-primary font-bold",
        className,
      )}
    >
      {value >= 100000 && <Digit place={100000} value={value} height={height} />}
      {value >= 10000 && <Digit place={10000} value={value} height={height} />}
      {value >= 1000 && <Digit place={1000} value={value} height={height} />}
      {value >= 100 && <Digit place={100} value={value} height={height} />}
      {value >= 10 && <Digit place={10} value={value} height={height} />}
      <Digit place={1} value={value} height={height} />
    </div>
  );
};

function Digit({ place, value, height }: { place: number; value: number; height: number }) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[1ch] tabular-nums">
      {[...Array(10)].map((_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

function Number({ mv, number, height }: { mv: MotionValue; number: number; height: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}
