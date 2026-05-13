import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import MatchHero from "@/src/app/features/matches/components/MatchHero";
import MatchFeed from "@/src/app/features/matches/components/MatchFeed";
import { mockProfiles } from "@/src/app/features/matches/mock-data";

export default function MatchesPage() {
  return (
    <div className="page-shell">
      <Header currentPath="/matches" currentRoute="/matches" forceHomeHeader />

      <main className="py-8 md:py-10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <MatchHero />
          <MatchFeed profiles={mockProfiles} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
