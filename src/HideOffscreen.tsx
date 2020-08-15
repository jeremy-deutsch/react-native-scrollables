import React, { useRef, useReducer, useEffect } from "react";
import { View, Dimensions } from "react-native";
import {
  useGetPositionInScrollView,
  useScrollEvents,
} from "./EnhancedScrollView";

const defaultHideDistance = Dimensions.get("window").height * 3;

const SHOW_ACTION = { type: "show" } as const;
const HIDE_ACTION = { type: "hide" } as const;

interface HideOffscreenProps {
  children: React.ReactNode;
  hideDistance?: number;
}

/**
 * A component to use for additional optimizations on top of using LazyList.
 * When HideOffscreen is scrolled far offscreen, it removes its children while
 * maintaining their height, and then adds those children back when it comes
 * onscreen.
 */
export default function HideOffscreen(props: HideOffscreenProps) {
  const yOffsetTopRef = useRef<number | null>(null);
  const heightRef = useRef<number | null>(null);
  const outerViewRef = useRef<View>(null);
  const getPositionInScrollView = useGetPositionInScrollView();

  const [state, dispatch] = useReducer(stateReducer, {
    type: "initial",
    willBeVisible: true,
  });

  const scrollEvents = useScrollEvents();
  const hideDistance = props.hideDistance ?? defaultHideDistance;
  useEffect(() => {
    return scrollEvents.subscribe(function hideOffscreenScrollListener(e) {
      if (yOffsetTopRef.current === null || heightRef.current === null) return;
      const yOffset = yOffsetTopRef.current;
      const scrollAmount = e.contentOffset.y;
      const shouldBeVisible =
        scrollAmount - hideDistance < yOffset + heightRef.current &&
        scrollAmount + hideDistance > yOffset;
      if (shouldBeVisible) dispatch(SHOW_ACTION);
      else dispatch(HIDE_ACTION);
    });
  }, [scrollEvents, hideDistance]);

  const areChildrenVisible = state.type === "initial" || state.isVisible;

  return (
    <View
      style={
        state.type === "laidOut" &&
        !areChildrenVisible && { height: state.height }
      }
      ref={outerViewRef}
      onLayout={async (e) => {
        const height = e.nativeEvent.layout.height;
        dispatch({ type: "layoutView", height });
        heightRef.current = height;
        if (!outerViewRef.current) return;
        try {
          const { y } = await getPositionInScrollView(outerViewRef.current);
          yOffsetTopRef.current = y;
        } catch (err) {
          console.warn("Measuring HideOffscreen y-value failed", err);
        }
      }}
    >
      {areChildrenVisible && props.children}
    </View>
  );
}

type HideOffscreenState =
  | { type: "initial"; willBeVisible: boolean }
  | { type: "laidOut"; isVisible: boolean; height: number };

type HideOffscreenAction =
  | { type: "layoutView"; height: number }
  | { type: "hide" }
  | { type: "show" };

function stateReducer(
  state: HideOffscreenState,
  action: HideOffscreenAction
): HideOffscreenState {
  if (action.type === "hide") {
    if (state.type === "initial") {
      if (!state.willBeVisible) return state;
      else return { ...state, willBeVisible: false };
    } else {
      // state.type === "laidOut"
      if (!state.isVisible) return state;
      else return { ...state, isVisible: false };
    }
  } else if (action.type === "show") {
    if (state.type === "initial") {
      if (state.willBeVisible) return state;
      else return { ...state, willBeVisible: true };
    } else {
      // state.type === "laidOut"
      if (state.isVisible) return state;
      else return { ...state, isVisible: true };
    }
  } else {
    // action.type === "layoutView"
    if (state.type === "initial") {
      return {
        type: "laidOut",
        isVisible: state.willBeVisible,
        height: action.height,
      };
    } else {
      // state.type === "laidOut"
      if (Math.round(action.height) === Math.round(state.height)) return state;
      else return { ...state, height: action.height };
    }
  }
}
