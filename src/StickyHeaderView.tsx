import React, { useState, useRef, forwardRef, Ref, useMemo } from "react";
import { View, Animated, LayoutChangeEvent } from "react-native";
import {
  useAnimatedScrollValue,
  useGetPositionInScrollView,
} from "./EnhancedScrollView";
import { setAndForwardRef } from "./helpers";

interface StickyHeaderViewProps {
  children: React.ReactNode;
  stickyHeaderElement: React.ReactNode;
}

// A basic-ish demonstration of what can be done with EnhancedScrollView.
const StickyHeaderView = forwardRef(function StickyHeaderView(
  props: StickyHeaderViewProps,
  ref: Ref<View>
) {
  const [
    { height, yOffset, outerMeasurementsInitialized },
    setOuterMeasurements,
  ] = useState({
    height: 0,
    yOffset: 0,
    outerMeasurementsInitialized: false,
  });
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const areValuesInitialized =
    !!stickyHeaderHeight && outerMeasurementsInitialized;

  const { y: scrollY } = useAnimatedScrollValue();

  // If below view is loading it's possible for the height to be the same as the sticky header height.  This
  // calculation isn't always exact on device so make sure it doesn't go below 0
  const nonHeaderHeight = Math.max(height - stickyHeaderHeight, 0);

  // offset the sticky header by the amount we've scrolled past the start of the outer view
  const stickyHeaderTranslateY = areValuesInitialized
    ? scrollY.interpolate({
        inputRange: [-3000, yOffset, yOffset + nonHeaderHeight],
        outputRange: [0, 0, nonHeaderHeight],
        extrapolate: "clamp",
      })
    : 0;
  const stickyHeaderStyle = {
    transform: [{ translateY: stickyHeaderTranslateY }],
    zIndex: 100,
  };

  const getPositionInScrollView = useGetPositionInScrollView();
  const outerViewRef = useRef<View>();
  const setOuterViewRef = useMemo(
    () =>
      setAndForwardRef({
        getForwardedRef: () => ref,
        setLocalRef: (viewRef: View) => {
          outerViewRef.current = viewRef;
        },
      }),
    []
  );

  return (
    <View
      ref={setOuterViewRef}
      onLayout={async (e) => {
        const height = e.nativeEvent.layout.height;
        if (!outerViewRef.current) return;
        try {
          const { y } = await getPositionInScrollView(outerViewRef.current);
          setOuterMeasurements({
            height,
            yOffset: y,
            outerMeasurementsInitialized: true,
          });
        } catch (e) {
          console.warn("Measuring sticky header y-value failed", e);
        }
      }}
    >
      {!!props.stickyHeaderElement && (
        <Animated.View
          onLayout={(e: LayoutChangeEvent) => {
            setStickyHeaderHeight(e.nativeEvent.layout.height);
          }}
          style={stickyHeaderStyle}
        >
          {props.stickyHeaderElement}
        </Animated.View>
      )}
      {props.children}
    </View>
  );
});

export default StickyHeaderView;
