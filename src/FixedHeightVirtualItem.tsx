import React, { useRef, useState, useReducer, useEffect } from "react";
import { Dimensions, View } from "react-native";
import { useAddScrollListener } from "./EnhancedScrollView";

// The distance from the top of the screen at which we hide the virtual cell
const virtualDistance = Dimensions.get("screen").height * 3;

export default function FixedHeightVirtualItem(props: {
  children: React.ReactNode;
}) {
  const yOffsetRef = useRef(Infinity);
  const hasLaidOutRef = useRef(false);
  const [visible, setVisible] = useState(true);
  // heightInitialized starts as false, and we set it to true the first time we set the
  // height. Once heightInitialized is true, we can no longer change the height.
  const [{ height, heightInitialized }, setHeightOnce] = useReducer(
    (
      prevState: { height: number; heightInitialized: boolean },
      height: number
    ) =>
      !prevState.heightInitialized
        ? { heightInitialized: true, height }
        : prevState,
    { height: 0, heightInitialized: false }
  );
  const addScrollListener = useAddScrollListener();
  useEffect(() => {
    return addScrollListener(function virtualCellScrollListener(e) {
      if (!hasLaidOutRef.current) return;
      const yOffset = yOffsetRef.current;
      const scrollAmount = e.contentOffset.y;
      const shouldBeVisible =
        scrollAmount - virtualDistance < yOffset &&
        scrollAmount + virtualDistance > yOffset;
      setVisible(shouldBeVisible);
    });
  }, [addScrollListener]);
  return (
    <View
      onLayout={e => {
        hasLaidOutRef.current = true;
        yOffsetRef.current = e.nativeEvent.layout.y;
        if (visible && !heightInitialized) {
          // wait a frame to set height so that we don't block the layout
          // (we need to extract the new height, because synthetic events
          // don't play well with async closures)
          const newHeight = e.nativeEvent.layout.height;
          requestAnimationFrame(() => setHeightOnce(newHeight));
        }
      }}
      style={heightInitialized && { height }}
    >
      {visible ? props.children : null}
    </View>
  );
}
