import { ClientContainer } from "@/calendar/components/client-container";
import { LoaderCircleIcon } from "lucide-react";
import { Suspense } from "react";

async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function PageContent() {
  //await waitFor(4000);
  return <ClientContainer view="year" />;
}

export default function Test() {
  return (
    <Suspense
      fallback={
        <div>
          <LoaderCircleIcon></LoaderCircleIcon>
          <p>TEST LOADING = SUSPENSE</p>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
