import FreeBenefitsPage from "@/src/app/pages/FreeBenefitsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <FreeBenefitsPage currentPath="/benefits" />;
}
