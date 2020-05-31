import { ComponentType, MutableRefObject, RefCallback } from "react";

export type GetProps<Component> = Component extends ComponentType<infer Props>
  ? Props
  : never;

// taken from the RN codebase
export function setAndForwardRef<T>({
  getForwardedRef,
  setLocalRef,
}: {
  getForwardedRef: () =>
    | RefCallback<unknown>
    | MutableRefObject<unknown>
    | null;
  setLocalRef: (ref: T) => any;
}) {
  return function forwardRef(ref: T) {
    const forwardedRef = getForwardedRef();

    setLocalRef(ref);

    // Forward to user ref prop (if one has been specified)
    if (typeof forwardedRef === "function") {
      // Handle function-based refs. String-based refs are handled as functions.
      forwardedRef(ref);
    } else if (typeof forwardedRef === "object" && forwardedRef != null) {
      // Handle createRef-based refs
      forwardedRef.current = ref;
    }
  };
}
