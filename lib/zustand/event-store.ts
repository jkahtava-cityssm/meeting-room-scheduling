import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FormState = {
  currentStep: number;
  localData: object[];
  formId?: string;
  setSessionStep: (step: number) => void;
  setSessionFormData: (data: object, index: number, id: number) => void;
  setSessionKeyData: (key: string, value: string, index: number) => void;
  setFormId: (id: string) => void;
  resetSessionFormData: () => void;
  getSessionState: () => FormState;
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

      setSessionStep: (step) => set({ currentStep: step }),
      setSessionFormData: (data, index, id) =>
        set((state) => ({
          localData: Object.assign([...state.localData], { [index]: data }),
        })),
      setSessionKeyData: (key, value, index) =>
        set((state) => ({
          localData: Object.assign([...state.localData], { [index]: { [key]: value } }),
        })),
      setFormId: (id) => set({ formId: id }),
      resetSessionFormData: () => set({ currentStep: 1, localData: [{}] }),
      getSessionState: () => getStorageData() || get(),
    }),
    { name: "form-storage", storage: createJSONStorage(() => sessionStorage) }
  )
);
