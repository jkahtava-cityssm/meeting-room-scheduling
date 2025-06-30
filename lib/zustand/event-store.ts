import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FormState = {
  currentStep: number;
  localData: object[];
  formId?: string;
  setCurrentStep: (step: number) => void;
  setFormData: (data: object, index: number) => void;
  setFormId: (id: string) => void;
  resetForm: () => void;
  getLatestState: () => FormState;
};

function getStorageData() {
  const storageData = localStorage.getItem("form-storage");
  if (!storageData) return null;

  const parsedData = JSON.parse(storageData);

  return parsedData.state as FormState;
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      localData: [{}],
      setCurrentStep: (step) => set({ currentStep: step }),
      setFormData: (data, index) =>
        set((state) => ({
          localData: Object.assign([...state.localData], { [index]: data }),
        })),
      setFormId: (id) => set({ formId: id }),
      resetForm: () => set({ currentStep: 1, localData: [{}], formId: undefined }),
      getLatestState: () => getStorageData() || get(),
    }),
    { name: "form-storage", storage: createJSONStorage(() => sessionStorage) }
  )
);
