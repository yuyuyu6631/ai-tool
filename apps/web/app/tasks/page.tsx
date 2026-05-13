import { redirect } from "next/navigation";
import { withPublicPath } from "@/src/app/lib/public-path";

export default function Page() {
  redirect(withPublicPath("/scenarios"));
}
