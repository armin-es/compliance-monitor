import { auth } from "@clerk/nextjs/server";
import { getAnalyses } from "@/server/repositories/analysis";
import { ComplianceMonitor } from "@/components/compliance-monitor";
import { ErrorBoundary } from "@/components/error-boundary";
import { OrgBootstrap } from "@/components/org-bootstrap";

export default async function Page() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <OrgBootstrap />;
  }

  const initialAnalyses = await getAnalyses(orgId);

  return (
    <ErrorBoundary>
      <ComplianceMonitor initialAnalyses={initialAnalyses} />
    </ErrorBoundary>
  );
}
