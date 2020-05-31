import React, {
  useMemo,
  useRef,
  useCallback,
  createContext,
  useContext,
  useEffect,
} from "react";
import {
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { GetProps } from "./helpers";

export type AnimatedScrollView = typeof Animated.ScrollView;

interface ScrollListener {
  (event: NativeScrollEvent): void;
}

type AddScrollListenerContextValue = (listener: ScrollListener) => () => void;
const AddScrollListenerContext = createContext<AddScrollListenerContextValue>(
  () => {
    if (__DEV__) {
      console.warn(
        "Warning: tried to add a scroll listener from outside a scrollable context"
      );
    }
    return () => {};
  }
);
const AddScrollListenerProvider = React.memo(AddScrollListenerContext.Provider);

/*
 * A React hook that returns a function for subscribing to the scroll events of the
 * closest parent EnhancedScrollView. Use useAnimatedScrollValue() (not this) for
 * animations!
 */
export function useAddScrollListener() {
  return useContext(AddScrollListenerContext);
}

const ScrollViewRefContext = createContext<
  React.RefObject<AnimatedScrollView | null>
>({
  get current() {
    if (__DEV__) {
      console.warn(
        "Warning: tried to use a ScrollView ref from outside a scrollable context"
      );
    }
    return null;
  },
});
const ScrollViewRefProvider = React.memo(ScrollViewRefContext.Provider);

/*
 * A React hook that returns a React ref pointing to the AnimatedScrollView instance
 * of the closest parent EnhancedScrollView.
 */
export function useScrollViewRef() {
  return useContext(ScrollViewRefContext);
}

const defaultValue = new Animated.Value(0);
const ScrollViewAnimationContext = createContext<{
  x: Animated.Value;
  y: Animated.Value;
}>({
  get x() {
    if (__DEV__) {
      console.warn(
        "Warning: tried to use an animated scroll x-value from outside a scrollable context"
      );
    }
    return defaultValue;
  },
  get y() {
    if (__DEV__) {
      console.warn(
        "Warning: tried to use an animated scroll y-value from outside a scrollable context"
      );
    }
    return defaultValue;
  },
});
const ScrollViewAnimationProvider = React.memo(
  ScrollViewAnimationContext.Provider
);

/*
 * A React hook that returns the animated x- and y-values of the closest parent
 * EnhancedScrollView element. We could always add other values, like velocities,
 * in the future.
 */
export function useAnimatedScrollValue() {
  return useContext(ScrollViewAnimationContext);
}

interface Props {
  children: React.ReactNode;
  animatedYTracker?: Animated.Value;
  scrollViewRef?: { current: AnimatedScrollView | null };
}

/*
 * A version of ScrollView for *fancy* interactions, like lazily-loading items,
 * sticky section headers, and parallax images. Note that this doesn't require
 * the concept of a "list" - individual child components can coordinate their
 * own animations, which lets you can mix and match *fancy* elements.
 * In implementation terms, this is just an animated ScrollView with some Context
 * providers that give its children access to its ref, its animated value, and a
 * function to attach scroll listeners. Turns out there's a lot you can do with
 * access to those things!
 */
export default function EnhancedScrollView(
  props: Props & GetProps<typeof ScrollView>
) {
  const scrollListenersRef = useRef<{ [id: number]: ScrollListener }>({});
  const nextListenerIdRef = useRef(0);
  const addScrollListener = useCallback((listener: ScrollListener) => {
    const listenerId = nextListenerIdRef.current++;
    scrollListenersRef.current[listenerId] = listener;
    return () => {
      delete scrollListenersRef.current[listenerId];
    };
  }, []);

  const onScroll = useCallback(
    function topLevelScrollListener(
      e: NativeSyntheticEvent<NativeScrollEvent>
    ) {
      const scrollEvent = e.nativeEvent;
      props.onScroll?.(e);
      for (const listenerId in scrollListenersRef.current) {
        scrollListenersRef.current[listenerId]?.(scrollEvent);
      }
    },
    [props.onScroll]
  );

  const scrollViewRef = useRef<AnimatedScrollView | null>(null);

  const animatedScrollX = useReactAnimatedValue(0);
  const animatedScrollY = useReactAnimatedValue(0);
  const animatedScrollEvent = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: { x: animatedScrollX, y: animatedScrollY },
            },
          },
        ],
        { useNativeDriver: true, listener: onScroll }
      ),
    [animatedScrollX, animatedScrollY, onScroll]
  );

  useEffect(() => {
    // make an animatedYTracker prop track our own scroll value
    if (props.animatedYTracker) {
      const tracker = Animated.timing(props.animatedYTracker, {
        toValue: animatedScrollY,
        duration: 0,
        useNativeDriver: true,
      });
      tracker.start();
      return () => tracker.stop();
    }
  }, [animatedScrollY, props.animatedYTracker]);

  const animatedContextObject = useMemo(
    () => ({
      x: animatedScrollX,
      y: animatedScrollY,
    }),
    [animatedScrollX, animatedScrollY]
  );

  return (
    <AddScrollListenerProvider value={addScrollListener}>
      <ScrollViewRefProvider value={scrollViewRef}>
        <ScrollViewAnimationProvider value={animatedContextObject}>
          <Animated.ScrollView
            scrollEventThrottle={16}
            {...props}
            // @ts-ignore for some reason Animated.ScrollView can't accept a ref prop
            ref={(ref: AnimatedScrollView) => {
              scrollViewRef.current = ref;
              if (props.scrollViewRef) {
                props.scrollViewRef.current = ref;
              }
            }}
            onScroll={animatedScrollEvent}
          >
            {props.children}
          </Animated.ScrollView>
        </ScrollViewAnimationProvider>
      </ScrollViewRefProvider>
    </AddScrollListenerProvider>
  );
}

function useReactAnimatedValue(initial: number) {
  const animatedScroll = useRef<Animated.Value | null>(null);
  if (animatedScroll.current === null) {
    animatedScroll.current = new Animated.Value(initial);
  }
  return animatedScroll.current;
}
