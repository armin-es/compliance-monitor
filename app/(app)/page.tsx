import { auth } from "@clerk/nextjs/server";
import { getAnalyses } from "@/server/repositories/analysis";
import { ComplianceMonitor } from "@/components/compliance-monitor";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function Page() {
  const { userId } = await auth();
  const initialAnalyses = await getAnalyses(userId!);

  return (
    <ErrorBoundary>
      <ComplianceMonitor initialAnalyses={initialAnalyses} />
    </ErrorBoundary>
  );
}
