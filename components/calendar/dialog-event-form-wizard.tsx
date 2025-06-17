"use client";

import React, { Children, useState } from "react";
import { Button } from "../ui/button";

export function EventFormWizard({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => Promise<void> }) {
  const totalChildren: number = Children.toArray(children).length - 1;
  const totalChildren2: number = Children.count(children);
  const [step, setStep] = useState(0);
  console.log(totalChildren, totalChildren2, step);
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && index === step) {
          return child;
        }
      })}
      {step <= totalChildren && step > 0 && (
        <Button
          onClick={() => {
            setStep((prev) => {
              return prev - 1;
            });
          }}
        >
          Back
        </Button>
      )}
      {step !== totalChildren && (
        <Button
          onClick={() => {
            setStep((prev) => {
              return prev + 1;
            });
          }}
        >
          Next
        </Button>
      )}
      {step === totalChildren && (
        <Button
          onClick={() => {
            onSubmit();
          }}
        >
          Submit
        </Button>
      )}
    </>
  );
}
