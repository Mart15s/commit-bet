export function usePathname() {
  return window.location.pathname === "/" ? "/app" : window.location.pathname;
}
export function useRouter() {
  return {
    replace: () => undefined,
    refresh: () => undefined,
    push: () => undefined,
  };
}
