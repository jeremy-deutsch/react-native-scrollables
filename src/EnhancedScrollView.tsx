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
  NativeMethods,
} from "react-native";
import { GetProps } from "./helpers";

export type AnimatedScrollView = typeof Animated.ScrollView;

interface ScrollListener {
  (event: NativeScrollEvent): void;
}

interface ScrollEventHandler {
  latest: NativeScrollEvent | null;
  subscribe(scrollListener: (event: NativeScrollEvent) => void): () => void;
}

const defaultScrollEventHandler: ScrollEventHandler = {
  get latest() {
    console.warn(
      "Warning: tried to read the latest scroll event from outside a scrollable context"
    );
    return null;
  },
  subscribe() {
    if (__DEV__) {
      console.warn(
        "Warning: tried to add a scroll event listener from outside a scrollable context"
      );
    }
    return () => {};
  },
};

const ScrollEventsContext = createContext<ScrollEventHandler>(
  defaultScrollEventHandler
);
const ScrollEventsProvider = React.memo(ScrollEventsContext.Provider);

/**
 * A React hook that returns an object for reading and subscribing to the scroll events
 * of the closest parent EnhancedScrollView. Use useAnimatedScrollValue() (not this) for
 * animations!
 */
export function useScrollEvents() {
  return useContext(ScrollEventsContext);
}

/**
 * @deprecated
 * A React hook that returns a function for subscribing to the scroll events of the
 * closest parent EnhancedScrollView. This is deprecated and will be removed soon -
 * use useScrollEvents() instead!
 */
export function useAddScrollListener() {
  const hasWarnedAboutUseAddScrollListener = useRef(false);
  if (__DEV__ && !hasWarnedAboutUseAddScrollListener.current) {
    console.warn(
      "useAddScrollListener is deprecated. Use useScrollEvents instead."
    );
    hasWarnedAboutUseAddScrollListener.current = true;
  }
  const scrollEvents = useScrollEvents();
  return (listener: ScrollListener) => scrollEvents.subscribe(listener);
}

const ScrollViewRefContext = createContext<React.RefObject<ScrollView | null>>({
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

/**
 * A React hook that returns a React ref pointing to the ScrollView instance
 * of the closest parent EnhancedScrollView.
 */
export function useScrollViewRef() {
  return useContext(ScrollViewRefContext);
}

/*
 * A React hook that returns a function for measuring the position of a host component
 * (e.g. a View) inside an EnhancedScrollView. Right now this is implemented just using
 * useScrollViewRef, but the React Native APIs for this kind of stuff are in flux right
 * now, so it will likely be implemented differently in the future.
 */
export function useGetPositionInScrollView() {
  const scrollViewRef = useContext(ScrollViewRefContext);
  return (viewRef: NativeMethods) => {
    const scrollViewNode =
      scrollViewRef.current?.getInnerViewNode() ?? scrollViewRef.current;
    if (!scrollViewNode) {
      return Promise.reject("No parent scroll view node found.");
    }
    return new Promise<{ x: number; y: number }>((resolve, reject) => {
      viewRef.measureLayout(
        scrollViewNode,
        (x, y) => {
          resolve({ x, y });
        },
        () => {
          reject("Failed to measure layout in scroll view.");
        }
      );
    });
  };
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
  scrollViewRef?: { current: ScrollView | null };
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
  const scrollEventListenersRef = useRef(new Set<ScrollListener>());
  const scrollEventHandlerRef = useRef<ScrollEventHandler>();
  if (scrollEventHandlerRef.current == null) {
    scrollEventHandlerRef.current = {
      latest: null,
      subscribe(listener: ScrollListener) {
        scrollEventListenersRef.current.add(listener);
        return () => {
          scrollEventListenersRef.current.delete(listener);
        };
      },
    };
  }

  const onScroll = useCallback(
    function topLevelScrollListener(
      e: NativeSyntheticEvent<NativeScrollEvent>
    ) {
      const scrollEvent = e.nativeEvent;
      (scrollEventHandlerRef.current as ScrollEventHandler).latest = scrollEvent;
      props.onScroll?.(e);
      for (const listener of scrollEventListenersRef.current) {
        listener(scrollEvent);
      }
    },
    [props.onScroll]
  );

  const scrollViewRef = useRef<ScrollView | null>(null);

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
    <ScrollEventsProvider value={scrollEventHandlerRef.current}>
      <ScrollViewRefProvider value={scrollViewRef}>
        <ScrollViewAnimationProvider value={animatedContextObject}>
          <Animated.ScrollView
            scrollEventThrottle={16}
            {...(props as any)}
            ref={(ref: { getNode(): ScrollView } | ScrollView | null) => {
              // older versions of RN require calling getNode() on the ref
              if (ref && "scrollTo" in ref) {
                scrollViewRef.current = ref;
              } else {
                scrollViewRef.current = ref?.getNode() ?? null;
                if (__DEV__ && scrollViewRef.current) {
                  // @ts-ignore
                  scrollViewRef.current.getNode = () => {
                    console.warn(
                      "Warning: Stop using getNode() to read the parent ScrollView."
                    );
                  };
                }
              }
              if (props.scrollViewRef) {
                props.scrollViewRef.current = scrollViewRef.current;
              }
            }}
            onScroll={animatedScrollEvent}
          >
            {props.children}
          </Animated.ScrollView>
        </ScrollViewAnimationProvider>
      </ScrollViewRefProvider>
    </ScrollEventsProvider>
  );
}

function useReactAnimatedValue(initial: number) {
  const animatedScroll = useRef<Animated.Value | null>(null);
  if (animatedScroll.current === null) {
    animatedScroll.current = new Animated.Value(initial);
  }
  return animatedScroll.current;
}

class ScrollViewMocker {
  private scrollListeners = new Set<ScrollListener>();
  private scrollEventHandler: ScrollEventHandler = {
    latest: null,
    subscribe: (listener: ScrollListener) => this.addScrollListener(listener),
  };
  private addScrollListener = (listener: ScrollListener) => {
    this.scrollListeners.add(listener);
    return () => {
      this.scrollListeners.delete(listener);
    };
  };
  sendScrollEvent(e: NativeScrollEvent) {
    this.scrollEventHandler.latest = e;
    this.scrollListeners.forEach((listener) => {
      listener(e);
    });
  }

  MockScrollView(props: { children: React.ReactNode }) {
    return (
      <ScrollEventsProvider value={this.scrollEventHandler}>
        {props.children}
      </ScrollEventsProvider>
    );
  }
}
