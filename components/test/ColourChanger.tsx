"use client";

import { COLOR_OPTIONS, TColors } from "@/lib/types";
import { useState } from "react";
import { Button } from "../ui/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ButtonColored } from "../ui/button-colored";
import { PublicEventCard } from "@/app/features/calendar/components/calendar-scroll-public-event-block";

export const ColorCycler = () => {
  const [index, setIndex] = useState(0);

  const handleClick = (direction: "next" | "back") => {
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (index + offset + COLOR_OPTIONS.length) % COLOR_OPTIONS.length;
    setIndex(nextIndex);
  };

  const currentColor: TColors = COLOR_OPTIONS[index];

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
        {COLOR_OPTIONS.map((color) => {
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
      <div>
        <div className="grid grid-cols-6 gap-1">
          {COLOR_OPTIONS.map((color) => {
            return (
              <Tooltip key={color}>
                <TooltipTrigger asChild>
                  <ButtonColored color={color} className={`w-22 h-10`}>
                    {color}
                  </ButtonColored>
                </TooltipTrigger>
                <TooltipContent className="max-w-64" side="bottom">
                  {color}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
