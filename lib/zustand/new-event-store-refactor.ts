import { CombinedSchema } from "@/app/features/event-drawer/drawer-schema.validator";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type EventStore = {
  event: CombinedSchema | null;
  setEvent: (event: CombinedSchema) => void;
  resetEvent: () => void;
  getEventState: () => EventStore;
  hasEvent: () => boolean;
};

function getStorageData(): EventStore | null {
  const storageData = localStorage.getItem("new-event-storage-refactor");
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
      name: "new-event-storage-refactor",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
