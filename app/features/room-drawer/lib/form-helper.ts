import { UseFormReturn } from 'react-hook-form';
import { CombinedSchema } from '../drawer-schema.validator';
import { FormStep } from '../types';

export const isStepValid = async (formStep: FormStep, methods: UseFormReturn<CombinedSchema>): Promise<{ status: boolean; errorList: string[] }> => {
  const formValues = methods.getValues();

  if (formStep.validationSchema) {
    const validationResult = formStep.validationSchema.safeParse(formValues);
    const errorList: string[] = [];

    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        methods.setError(err.path.join('.') as keyof CombinedSchema, {
          type: 'manual',
          message: err.message,
        });

        errorList.push(err.message);
      });
      return { status: false, errorList: errorList };
    }
  }

  return { status: true, errorList: [] };
};

export const isFormValid = async (
  formSteps: FormStep[],
  methods: UseFormReturn<CombinedSchema>,
  skipSteps: number[] = [],
): Promise<{ status: boolean; errorList: string[] }> => {
  let isValid = true;
  const totalErrorList = new Set<string>(); // Use a Set to auto-deduplicate

  for (let step = 0; step < formSteps.length; step++) {
    if (skipSteps.includes(step)) continue;

    const stepValid = await isStepValid(formSteps[step], methods);
    if (!stepValid.status) {
      isValid = false;
      stepValid.errorList.forEach((msg) => totalErrorList.add(msg));
    }
  }

  return { status: isValid, errorList: Array.from(totalErrorList) };
};
