import { Button } from "../ui/button";
import { useMultiStepForm } from "./stepped-form";

export const PrevButton = () => {
  const { isFirstStep, previousStep } = useMultiStepForm();

  return (
    <Button variant="outline" type="button" className="mt-5" onClick={previousStep} disabled={isFirstStep}>
      Previous
    </Button>
  );
};
export default PrevButton;
