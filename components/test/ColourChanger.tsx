"use client";

import { colorOptions, TColors } from "@/lib/types";
import { useState } from "react";
import { Button } from "../ui/button";
import { PublicEventCard } from "../calendar/calendar-public-view-event-block";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const ColorCycler = ({ setColor }: { setColor: (color: TColors) => void }) => {
  const [index, setIndex] = useState(0);

  const handleClick = (direction: "next" | "back") => {
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (index + offset + colorOptions.length) % colorOptions.length;
    setIndex(nextIndex);
    setColor(colorOptions[nextIndex]);
  };

  const currentColor: TColors = colorOptions[index];

  return (
    <div className="mb-4 flex flex-col gap-4">
      <p>
        Current color: <strong>{currentColor}</strong>
      </p>
      <div className="mb-4 flex gap-4">
        <Button onClick={() => handleClick("next")}>Next Color</Button>
        <Button onClick={() => handleClick("back")}>Previous Color</Button>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {colorOptions.map((color) => {
          const EventCardClasses = PublicEventCard({ color });
          return (
            <Tooltip key={color}>
              <TooltipTrigger asChild>
                <div className={`${EventCardClasses} w-8 h-8`}></div>
              </TooltipTrigger>
              <TooltipContent className="max-w-64" side="bottom">
                {color}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
