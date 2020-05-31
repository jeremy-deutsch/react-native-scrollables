import React, { useState, useRef } from "react";
import { View, Animated, LayoutChangeEvent } from "react-native";
import { useAnimatedScrollValue, useScrollViewRef } from "./EnhancedScrollView";

interface StickyHeaderViewProps {
  children: React.ReactNode;
  stickyHeaderElement: React.ReactNode;
}

// A basic demonstration of what can be done with EnhancedScrollView.
export default function StickyHeaderView(props: StickyHeaderViewProps) {
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

  const parentScrollViewRef = useScrollViewRef();
  const outerViewRef = useRef<View>(null);

  return (
    <View
      ref={outerViewRef}
      onLayout={(e) => {
        const height = e.nativeEvent.layout.height;
        const parentViewNode = parentScrollViewRef.current
          ?.getNode()
          ?.getInnerViewNode();
        if (parentViewNode == null) return;
        outerViewRef.current?.measureLayout(
          parentViewNode,
          (_, y) => {
            setOuterMeasurements({
              height,
              yOffset: y,
              outerMeasurementsInitialized: true,
            });
          },
          () => {
            console.warn(`Measuring sticky header y-value failed`);
          }
        );
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
}
