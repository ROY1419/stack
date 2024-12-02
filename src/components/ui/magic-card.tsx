"use client";

import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
      x: 0,
      y: 0,
  });

  useEffect(() => {
      const handleMouseMove = (event: globalThis.MouseEvent) => {
          setMousePosition({ x: event.clientX, y: event.clientY });
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
          window.removeEventListener("mousemove", handleMouseMove);
      };
  }, []);

  return mousePosition;
}

interface MagicContainerProps {
  children?: ReactNode;
  className?: any;
}

const MagicContainer = ({ children, className }: MagicContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const [boxes, setBoxes] = useState<Array<HTMLElement>>([]);

  useEffect(() => {
      init();
      containerRef.current &&
          setBoxes(Array.from(containerRef.current.children).map(el => el as HTMLElement));
  }, []);

  useEffect(() => {
      init();
      window.addEventListener("resize", init);

      return () => {
          window.removeEventListener("resize", init);
      };
  }, [setBoxes]);

  useEffect(() => {
      onMouseMove();
  }, [mousePosition]);

  const init = () => {
      if (containerRef.current) {
          containerSize.current.w = containerRef.current.offsetWidth;
          containerSize.current.h = containerRef.current.offsetHeight;
      }
  };

  const onMouseMove = () => {
      if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const { w, h } = containerSize.current;
          const x = mousePosition.x - rect.left;
          const y = mousePosition.y - rect.top;
          const inside = x < w && x > 0 && y < h && y > 0;

          mouse.current.x = x;
          mouse.current.y = y;
          boxes.forEach(box => {
              const boxX = -(box.getBoundingClientRect().left - rect.left) + mouse.current.x;
              const boxY = -(box.getBoundingClientRect().top - rect.top) + mouse.current.y;
              box.style.setProperty("--mouse-x", `${boxX}px`);
              box.style.setProperty("--mouse-y", `${boxY}px`);

              if (inside) {
                  box.style.setProperty("--opacity", `1`);
              } else {
                  box.style.setProperty("--opacity", `0`);
              }
          });
      }
  };

  return (
      <div className={cn("h-full w-full", className)} ref={containerRef}>
          {children}
      </div>
  );
};

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (cardRef.current) {
        const { left, top } = cardRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }
    },
    [mouseX, mouseY],
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      if (!e.relatedTarget) {
        document.removeEventListener("mousemove", handleMouseMove);
        mouseX.set(-gradientSize);
        mouseY.set(-gradientSize);
      }
    },
    [handleMouseMove, mouseX, gradientSize, mouseY],
  );

  const handleMouseEnter = useCallback(() => {
    document.addEventListener("mousemove", handleMouseMove);
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [handleMouseMove, mouseX, gradientSize, mouseY]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseOut]);

  useEffect(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 border text-black dark:text-white",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
    </div>
  );
}
export default MagicContainer