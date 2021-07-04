import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  useGetPositionInScrollView,
  useScrollEvents,
} from "./EnhancedScrollView";
import { View, Dimensions } from "react-native";

interface LazyListProps {
  elements: React.ReactNode[];
  onFullyLoaded?: () => void;
  avgItemHeight?: number;
  // itemsToMountWith should only be used as an alternative to avgItemHeight,
  // and when you don't expect other LazyLists to be contained inside this one
  itemsToMountWith?: number;
}

// This class implements the expansion logic for LazyLists.
class LazyListManager {
  state: "incomplete" | "expanding" | "complete";
  setNumItemsToShow: (num: number) => void;
  currentlyShowing: number;
  furthestScrollY: number;
  listEndY: number | null = null;
  isExpansionQueued = false;
  parent: LazyListManager | null;
  children = new Set<LazyListManager>();
  avgItemHeight: number | undefined;
  constructor(args: {
    currentlyShowing: number;
    totalToShow: number;
    setNumItemsToShow: LazyListManager["setNumItemsToShow"];
    parent: LazyListManager | null;
    avgItemHeight: number | undefined;
  }) {
    if (args.currentlyShowing >= args.totalToShow) {
      this.state = "complete";
    } else {
      this.state = "incomplete";
    }
    this.setNumItemsToShow = args.setNumItemsToShow;
    this.currentlyShowing = args.currentlyShowing;
    this.parent = args.parent;
    if (this.parent) {
      this.furthestScrollY = this.parent.furthestScrollY;
    } else {
      this.furthestScrollY = 0;
    }
    this.avgItemHeight = args.avgItemHeight;
  }

  tryToExpand() {
    this.isExpansionQueued = false;
    if (this.state !== "incomplete" || this.listEndY == null) return;
    const spaceToAdd = Dimensions.get("window").height * 3;
    if (this.furthestScrollY > this.listEndY - spaceToAdd) {
      for (const child of this.children) {
        if (child.state !== "complete") {
          this.isExpansionQueued = true;
          return;
        }
      }
      let numToExpandBy: number;
      if (this.avgItemHeight) {
        numToExpandBy = Math.ceil(
          (this.furthestScrollY - this.listEndY + spaceToAdd) /
            this.avgItemHeight
        );
      } else {
        numToExpandBy = 1;
      }
      this.state = "expanding";
      this.setNumItemsToShow(this.currentlyShowing + numToExpandBy);
    }
  }

  registerChild(child: LazyListManager) {
    this.children.add(child);
    return () => {
      this.children.delete(child);
      this.tryToExpand();
    };
  }

  // we don't do this automatically in the constructor, since that's an external side
  // effect, and LazyListManager gets created in render. instead, we call this from
  // useEffect.
  registerWithParent() {
    return this.parent?.registerChild(this);
  }

  // This is the method that marks the completion of an expansion. It gets run when
  // we mount a new end marker element.
  onLayoutNewExpansion(args: {
    currentlyShowing: number;
    totalToShow: number;
    distanceFromTop: number;
    onFullyLoaded: (() => void) | undefined;
  }) {
    if (args.currentlyShowing < this.currentlyShowing) {
      // currentlyShowing should never decrease - this indicates something
      // got messed up asynchronously
      return;
    }
    this.listEndY = args.distanceFromTop;
    this.currentlyShowing = args.currentlyShowing;
    if (args.currentlyShowing < args.totalToShow) {
      this.state = "incomplete";
      this.tryToExpand();
    } else {
      const wasNotComplete = this.state !== "complete";
      this.state = "complete";
      if (wasNotComplete) {
        args.onFullyLoaded?.();
        if (this.parent?.isExpansionQueued) {
          this.parent.tryToExpand();
        }
      }
    }
  }

  onScroll(scrollAmount: number) {
    if (scrollAmount > this.furthestScrollY) {
      this.furthestScrollY = scrollAmount;
      this.tryToExpand();
    }
  }
}

const ListManagerContext = React.createContext<LazyListManager | null>(null);

export default function LazyList(props: LazyListProps) {
  const itemsToMountWith = useMemo(() => {
    if (props.itemsToMountWith) return props.itemsToMountWith;
    if (!props.avgItemHeight) return 1;
    return Math.ceil(Dimensions.get("window").height / props.avgItemHeight) + 1;
  }, []);
  const [numItemsToShow, setNumItemsToShow] = useState(itemsToMountWith);

  const parentListManager = useContext(ListManagerContext);
  const listManagerRef = useRef<LazyListManager>();
  if (!listManagerRef.current) {
    listManagerRef.current = new LazyListManager({
      currentlyShowing: numItemsToShow,
      totalToShow: props.elements.length,
      setNumItemsToShow: (numItems) => {
        setNumItemsToShow((prevItems) => Math.max(prevItems, numItems));
      },
      parent: parentListManager,
      avgItemHeight: props.avgItemHeight,
    });
  }

  useEffect(() => {
    return listManagerRef.current?.registerWithParent();
  }, []);

  const scrollEvents = useScrollEvents();
  useEffect(() => {
    return scrollEvents.subscribe((scrollEvent) => {
      listManagerRef.current?.onScroll(scrollEvent.contentOffset.y);
    });
  }, [scrollEvents]);

  const numItemsNotShown = props.elements
    ? props.elements.length - numItemsToShow
    : 0;

  const getPositionInScrollView = useGetPositionInScrollView();

  // use a new key for the end marker on every increment so onLayout always runs again
  // bc increasing the number of items doesn't necessarily change the end's y-position
  const endMarkerKey = `LazyListEndMarker${numItemsToShow}#${props.elements?.length}`;
  // we save the endMarkerKey along with the ref so we can identify which render's
  // list-end element this ref "belongs" to
  const lazyListEndMarkerRefAndKey = useRef<{
    key: string;
    ref: View | null;
  }>();

  return (
    <ListManagerContext.Provider value={listManagerRef.current}>
      {props.elements?.slice(0, numItemsToShow)}
      <View
        // add some whitespace for the still-missing items
        style={
          props.avgItemHeight && numItemsNotShown > 0
            ? { height: numItemsNotShown * props.avgItemHeight }
            : null
        }
        key={endMarkerKey}
        ref={(ref) => {
          lazyListEndMarkerRefAndKey.current = { key: endMarkerKey, ref };
        }}
        onLayout={async () => {
          const refAndKey = lazyListEndMarkerRefAndKey.current;
          // this is me being paranoid - since we're creating a new end marker element on
          // every increment, and onLayout runs asynchronously, I just want to be sure we
          // aren't measuring using a ref from a future render. this is also why we save
          // the end marker key along with the end marker ref
          if (refAndKey?.key !== endMarkerKey || !refAndKey.ref) return;
          try {
            const { y } = await getPositionInScrollView(refAndKey.ref);
            listManagerRef.current?.onLayoutNewExpansion({
              currentlyShowing: numItemsToShow,
              distanceFromTop: y,
              totalToShow: props.elements?.length,
              onFullyLoaded: props.onFullyLoaded,
            });
          } catch (e) {
            console.warn(`Measuring ${endMarkerKey} y-value failed`, e);
          }
        }}
      />
    </ListManagerContext.Provider>
  );
}
