import React, { useRef, useLayoutEffect } from "react";
import { View } from "react-native";
import {
  useScrollViewRef,
  useGetPositionInScrollView,
} from "./EnhancedScrollView";
import { useStickyHeaderHeight } from "./StickyHeaderView";

interface AnchorHandle {
  scrollTo: (params?: { animated?: boolean }) => void;
}

const defaultScrollTo = () => {};

export const AnchorView = (props: {
  anchorHandle: AnchorHandle;
  children?: React.ReactNode;
}) => {
  const viewRef = useRef<View>(null);
  const scrollViewRef = useScrollViewRef();
  const getPosition = useGetPositionInScrollView();
  const stickyHeaderHeight = useStickyHeaderHeight();
  useLayoutEffect(() => {
    let cancelled = false;
    if (props.anchorHandle.scrollTo !== defaultScrollTo) {
      console.warn(
        "Attempted to pass an anchor handle to multiple Anchors. This behavior is unsupported."
      );
      return;
    }
    props.anchorHandle.scrollTo = async (params) => {
      if (!viewRef.current) return;
      const position = await getPosition(viewRef.current);
      if (cancelled) return;
      scrollViewRef.current?.scrollTo({
        y: position.y - stickyHeaderHeight,
        animated: params?.animated,
      });
    };
    return () => {
      cancelled = true;
      props.anchorHandle.scrollTo = defaultScrollTo;
    };
  }, [scrollViewRef, getPosition, props.anchorHandle]);
  return <View ref={viewRef}>{props.children}</View>;
};

export function createAnchorHandle(): AnchorHandle {
  return {
    scrollTo: defaultScrollTo,
  };
}
