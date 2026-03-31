"use client";

import type { AnchorHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { useCallback } from "react";
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

type SearchParamsSetter =
  | URLSearchParams
  | string
  | Record<string, string>
  | ((previous: URLSearchParams) => URLSearchParams);

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams() as T;
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useNextSearchParams();

  const setSearchParams = useCallback(
    (nextInit: SearchParamsSetter) => {
      const previous = new URLSearchParams(searchParams.toString());
      let next: URLSearchParams;

      if (typeof nextInit === "function") {
        next = nextInit(previous);
      } else if (nextInit instanceof URLSearchParams) {
        next = nextInit;
      } else if (typeof nextInit === "string") {
        next = new URLSearchParams(nextInit);
      } else {
        next = new URLSearchParams(nextInit);
      }

      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return [searchParams, setSearchParams] as const;
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const query = searchParams.toString();

  return {
    pathname,
    search: query ? `?${query}` : "",
  };
}

export function useNavigation() {
  return { state: "idle" as const };
}

export function MemoryRouter({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function Outlet() {
  return null;
}

export function createBrowserRouter() {
  return null;
}

export function RouterProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
