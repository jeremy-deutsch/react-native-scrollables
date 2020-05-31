import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
  useReducer,
  useMemo,
} from "react";
import { GetProps } from "./helpers";
import { View, Dimensions, ScaledSize } from "react-native";
import { useAddScrollListener } from "./EnhancedScrollView";

const LazyListCompletionContext = createContext<
  (id: number, isDoneMountingItems: boolean) => void
>(() => {});

const LazyListCompletionProvider = React.memo(
  LazyListCompletionContext.Provider
);

interface LazyListProps {
  elements: React.ReactNode[];
  // itemsToMountWith should only be used by LazyLists that don't have other
  // LazyLists inside of them
  itemsToMountWith?: number;
  // restricts the number of elements that the LazyList can grow by at once
  // recommended to set to 1 for LazyLists that have other LazyLists inside them
  incrementThrottle?: number;
  onFullyLoaded?: () => void;
}

export default function LazyList(props: LazyListProps) {
  const { itemsToMountWith = 1, incrementThrottle, onFullyLoaded } = props;

  // user might pass in null/undefined list for elements
  const elements = props.elements as React.ReactNode[] | null | undefined;

  // use Math.max as a reducer so that numElementsToRender can never decrease
  const [numElementsToRender, setNumElementsToRender] = useReducer(
    (prevNumElements: number, newNumElements: number) =>
      Math.max(prevNumElements, newNumElements),
    itemsToMountWith
  );

  const areThereStillElementsToRender =
    !!elements && numElementsToRender < elements.length;

  const childrenStillGrowingRef = useRef(new Set<number>());

  const notifyParentDoneLoading = useContext(LazyListCompletionContext);
  const id = useUniqueId();

  const windowHeight = useDimensions("window").height;
  const parentYOffset = useLayoutAwareYOffset();

  const listEndYRef = useRef(0);
  const furthestScrollRef = useRef(0);
  const wasDoneLoadingRef = useRef(false);
  const hiPriorityIncrementsRef = useRef(0);
  const checkShouldGrow = () => {
    const areChildrenStillGrowing = childrenStillGrowingRef.current.size !== 0;
    const isDoneLoading =
      !areThereStillElementsToRender && !areChildrenStillGrowing;
    if (isDoneLoading && !wasDoneLoadingRef.current) {
      // only call onFullyLoaded when we transition from not being done to being done
      onFullyLoaded?.();
    }
    wasDoneLoadingRef.current = isDoneLoading;
    // The assumption being made here is that checkShouldGrow will be called by the deepest children
    // first, so that child will notify LazyLists up the tree that they shouldn't start incrementing yet.
    notifyParentDoneLoading(id, isDoneLoading);

    // the distance, in units, between the amount we've scrolled and the list end's y-value
    const amountUntilEnd =
      listEndYRef.current + parentYOffset - furthestScrollRef.current;
    // calculate the number of increments to schedule in reverse: 3 is the baseline, but we
    // increment less for each windowHeight between our scroll amount and the end of the list.
    // This might not be aggressive enough, and doesn't really account for the height of items
    // being added, so we probably want to calculate this differently later.
    let incrementAmount = 3 - Math.floor(amountUntilEnd / windowHeight);
    if (incrementThrottle)
      incrementAmount = Math.min(incrementAmount, incrementThrottle);
    if (
      areThereStillElementsToRender &&
      !areChildrenStillGrowing &&
      incrementAmount > 0
    ) {
      // schedule more growth as necessary using hiPriorityIncrementsRef
      hiPriorityIncrementsRef.current = incrementAmount - 1;
      // increase using the closed-over numElementsToRender instead of passing a function,
      // so that we ensure we don't increment more than we want
      setNumElementsToRender(numElementsToRender + 1);
    } else {
      hiPriorityIncrementsRef.current = 0;
    }
  };
  // useEffect runs earlier than onLayout, so we can create "high priority" list increments
  // by scheduling them in useEffect. Until hiPriorityIncrementsRef is exhausted, we decrement
  // it and schedule another increment of numElementsToRender.
  useEffect(() => {
    // note: should this somehow call checkShouldGrow()? There are some complications if yes.
    if (hiPriorityIncrementsRef.current > 0) {
      hiPriorityIncrementsRef.current--;
      setNumElementsToRender(numElementsToRender + 1);
    }
  }, [numElementsToRender]);

  const addScrollListener = useAddScrollListener();
  useEffect(() => {
    // use a named function for easier profiling
    return addScrollListener(function lazyListScrollListener(e) {
      const scrollAmount = e.contentOffset.y;
      if (scrollAmount > furthestScrollRef.current)
        furthestScrollRef.current = scrollAmount;
      checkShouldGrow();
    });
  });

  // a function for children to report whether they've finished loading
  const notifyDoneLoading = (id: number, childIsDoneLoading: boolean) => {
    if (childIsDoneLoading) {
      childrenStillGrowingRef.current.delete(id);
    } else {
      childrenStillGrowingRef.current.add(id);
    }
    checkShouldGrow();
  };

  return (
    <LazyListCompletionProvider
      value={notifyDoneLoading}
      // React won't re-render child elements when LazyList re-renders, since they'll be
      // referentially equal to the last child elements
    >
      {elements?.slice(0, numElementsToRender)}
      <View
        // use a new key on every increment so onLayout always runs again
        key={`LazyListEndMarker${numElementsToRender}#${elements?.length}`}
        onLayout={(e) => {
          listEndYRef.current = e.nativeEvent.layout.y;
          checkShouldGrow();
        }}
      />
    </LazyListCompletionProvider>
  );
}

let nextId = 0;
function useUniqueId() {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    idRef.current = nextId++;
  }
  return idRef.current;
}

function useDimensions(dimension: "window" | "screen") {
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get("screen")
  );

  useEffect(() => {
    const onChange = ({
      window,
      screen,
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => {
      setWindowDimensions(window);
      setScreenDimensions(screen);
    };
    Dimensions.addEventListener("change", onChange);
    onChange({
      window: Dimensions.get("window"),
      screen: Dimensions.get("screen"),
    });
    return () => Dimensions.removeEventListener("change", onChange);
  }, [screenDimensions, windowDimensions]);

  return dimension === "window" ? windowDimensions : screenDimensions;
}

const YOffsetContext = createContext<{ initialized: boolean; offset: number }>({
  initialized: true,
  offset: 0,
});
const YOffsetProvider = React.memo(YOffsetContext.Provider);

/*
 * A React hook that returns the layout y-value of the nearest parent ScrollFriendlyView.
 * The given y-value is the offset between that ScrollFriendlyView and its nearest parent
 * non-LayoutAware view element (including View, ScrollView, or EnhancedScrollView).
 * The intended use case for this is to nest ScrollFriendlyViews inside an EnhancedScrollView
 * so that children can use their y-offset for scroll animations.
 */
export function useLayoutAwareYOffset() {
  return useContext(YOffsetContext).offset;
}

/*
 * A wrapper around View that puts its y-value into a React Context. Useful for coordinating
 * scroll animations. Nested ScrollFriendlyViews sum up their y-values to be read by useLayoutAwareY.
 */
export function ScrollFriendlyView(
  props: GetProps<typeof View> & { children: React.ReactNode }
) {
  const [{ yOffset, isInitialized }, setYOffset] = useReducer(
    (prevState: { yOffset: number; isInitialized: boolean }, y: number) => {
      if (!prevState.isInitialized || y !== prevState.yOffset) {
        return { isInitialized: true, yOffset: y };
      } else {
        return prevState;
      }
    },
    { yOffset: 0, isInitialized: false }
  );

  const { offset: parentYOffset, initialized: parentInitialized } = useContext(
    YOffsetContext
  );

  const view = useMemo(
    () => (
      <View
        {...props}
        onLayout={(e) => {
          setYOffset(e.nativeEvent.layout.y);
          if (props.onLayout) props.onLayout(e);
        }}
      />
    ),
    [props]
  );

  const initialized = isInitialized && parentInitialized;
  const offset = initialized ? yOffset + parentYOffset : 0;
  const providerValue = useMemo(() => ({ initialized, offset }), [
    initialized,
    offset,
  ]);

  return <YOffsetProvider value={providerValue}>{view}</YOffsetProvider>;
}
