import { EmptyState } from "@/components/ds";

/** A page whose module is on but whose data is not built yet: what it will show, what it needs (no sample numbers). */
export function ModulePending({ title, what, needs }: { title: string; what: string; needs: string }) {
  return (
    <EmptyState title={title}>
      <p>{what}</p>
      <p>{needs}</p>
    </EmptyState>
  );
}
