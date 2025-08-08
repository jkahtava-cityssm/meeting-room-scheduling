import { Button } from "../ui/button";
import { useMultiStepForm } from "./stepped-form";

export const NextButton = ({ onClick, type, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { isLastStep } = useMultiStepForm();

  return (
    <Button variant={isLastStep ? "beneficial" : "default"} type={type ?? "button"} onClick={onClick} {...rest}>
      {isLastStep ? "Create Event" : "Next"}
    </Button>
  );
};
