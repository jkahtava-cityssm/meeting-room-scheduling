import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CombinedSchema } from "@/app/features/event-drawer/event-drawer.validator";

type EventStore = {
  event: CombinedSchema | null;
  setEvent: (event: CombinedSchema) => void;
  resetEvent: () => void;
  getEventState: () => EventStore;
  hasEvent: () => boolean;
};

function getStorageData(): EventStore | null {
  const storageData = localStorage.getItem("new-event-storage");
  if (!storageData) return null;

  const parsedData = JSON.parse(storageData);
  return parsedData.state as EventStore;
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      event: null,

      setEvent: (event) => set({ event }),
      resetEvent: () => set({ event: null }),
      getEventState: () => getStorageData() || get(),
      hasEvent: () => get().event !== null,
    }),
    {
      name: "new-event-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
