import React, {
  useState,
  useRef,
  useMemo,
  createContext,
  useContext,
} from "react";
import { View, Animated, LayoutChangeEvent } from "react-native";
import {
  useAnimatedScrollValue,
  useGetPositionInScrollView,
} from "./EnhancedScrollView";
import { setAndForwardRef } from "./helpers";

const StickyHeaderHeightContext = createContext(0);
export const useStickyHeaderHeight = () =>
  useContext(StickyHeaderHeightContext);

interface StickyHeaderViewProps {
  children: React.ReactNode;
  stickyHeaderElement: React.ReactNode;
  viewRef?: React.Ref<View>;
}

// A basic-ish demonstration of what can be done with EnhancedScrollView.
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

  const outerHeaderHeight = useStickyHeaderHeight();
  // offset the sticky header by the amount we've scrolled past the start of the outer view
  const stickyHeaderTranslateY = areValuesInitialized
    ? scrollY.interpolate({
        inputRange: [
          -3000,
          yOffset - outerHeaderHeight,
          yOffset + nonHeaderHeight - outerHeaderHeight,
        ],
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
        getForwardedRef: () => props.viewRef,
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
      <StickyHeaderHeightContext.Provider
        value={
          areValuesInitialized
            ? stickyHeaderHeight + outerHeaderHeight
            : outerHeaderHeight
        }
      >
        {props.children}
      </StickyHeaderHeightContext.Provider>
    </View>
  );
}
