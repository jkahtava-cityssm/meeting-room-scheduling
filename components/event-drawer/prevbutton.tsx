import { Button } from "../ui/button";
import { useMultiStepForm } from "./stepped-form";

export const PrevButton = () => {
  const { isFirstStep, previousStep } = useMultiStepForm();

  return (
    <Button variant="outline" type="button" onClick={previousStep} disabled={isFirstStep}>
      Back
    </Button>
  );
};
export default PrevButton;
