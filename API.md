# API

### Table of Contents

- [EnhancedScrollView](#EnhancedScrollView)
- [useScrollViewRef](#useScrollViewRef)
- [useAnimatedScrollValue](#useAnimatedScrollValue)
- [useAddScrollListener](#useAddScrollListener)
- [useGetPositionInScrollView](#useGetPositionInScrollView)
- [LazyList](#LazyList)
- [StickyHeaderView](#StickyHeaderView)

## Core

### `EnhancedScrollView`

This component is the basis for this library. It wraps an animated [`ScrollView`](https://reactnative.dev/docs/scrollview), and accepts all the props of `ScrollView` as well. The other components and hooks of this library will only work properly when used inside an `EnhancedScrollView`.

`EnhancedScrollView` has two props besides `ScrollView`'s props:

| Prop Name          | Type                                   | Description                                                                                                                                                                                            | Required |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `scrollViewRef`    | `RefObject<{ getNode(): ScrollView }>` | A ref object that will be assigned a ref to the `EnhancedScrollView`'s internal `Animated.ScrollView`. Note that you need to call its `getNode()` method to get a ref to the `ScrollView` inside that. | No       |
| `animatedYTracker` | `Animated.Value`                       | An animated value that will be set to the scroll amount of the `EnhancedScrollView`                                                                                                                    | No       |

#### Example

```jsx
import { EnhancedScrollView } from "react-native-scrollables";

function MyScrollableView() {
  return (
    <EnhancedScrollView>
      <Text>Hello, world! This is inside a scrollable view!</Text>
      <ComponentThatUsesAReactNativeScrollablesHook />
    </EnhancedScrollView>
  );
}
```

### `useScrollViewRef`

A React hook that returns a React ref object containing the internal `Animated.ScrollView` of the closest parent `EnhancedScrollView`. Note that you need to call its `getNode()` method to get a ref to the `ScrollView` inside that.

#### Type

`() => RefObject<{ getNode(): ScrollView }>`

#### Example

```jsx
import { useScrollViewRef } from "react-native-scrollables";

function ScrollToTopButton() {
  const scrollViewRef = useScrollViewRef();

  return (
    <Button
      title="Scroll to top"
      onPress={() => {
        const scrollViewNode =
          scrollViewRef.current && scrollViewRef.current.getNode();
        if (scrollViewNode) {
          scrollViewNode.scrollTo({ y: 0 });
        }
      }}
    />
  );
}
```

### `useAnimatedScrollValue`

A React hook that returns natively driven `Animated.Value`s tracking the x and y scroll of the closest parent `EnhancedScrollView` element.

#### Type

`() => ({ x: Animated.Value; y: Animated.Value })`

#### Example

```jsx
import { useAnimatedScrollValue } from "react-native-scrollables";

function AnimatedHeaderImage({ source }) {
  const scrollY = useAnimatedScrollValue().y;
  return (
    <Animated.Image
      source={source}
      style={{
        width: "100%",
        transform: [{ translateY: Animated.divide(scrollY, 2) }],
      }}
    />
  );
}
```

### `useAddScrollListener`

A React hook that returns a function for subscribing to the scroll events of the closest parent `EnhancedScrollView`. Use [`useAnimatedScrollValue()`](#useAnimatedScrollValue) (not this) for animations!

#### Type

`() => (listener: (scrollEvent: NativeScrollEvent) => void) => () => void`

<details>
<summary>(This hook's type is a little confusing - click here for a breakdown)</summary>

- The hook returns a "subscriber" function, which you can use to subscribe to scroll events.
- The "subscriber" function takes in another function that will run on every scroll event.
- Calling the "subscriber" function returns an "unsubscribe" function, that will un-register the scroll event subscription that was created when the function was called.

</details>

#### Example

```jsx
import { useAddScrollListener } from "react-native-scrollables";

function TermsAndConditionsButton({ termsAndConditionsHeight, onContinue }) {
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);

  const addScrollListener = useAddScrollListener();
  useEffect(() => {
    const removeListener = addScrollListener((scrollEvent) => {
      const scrollAmount = scrollEvent.contentOffset.y;
      if (scrollAmount > termsAndConditionsHeight) {
        setHasScrolledEnough(true);
      }
    });
    return () => {
      removeListener();
    };
  }, [termsAndConditionsHeight, addScrollListener]);

  return (
    <Button
      title="Accept the terms and conditions"
      onPress={onContinue}
      disabled={!hasScrolledEnough}
    />
  );
}
```

### `useGetPositionInScrollView`

A React hook that returns a function for measuring the position of a host component (e.g. a `View`) relative to the nearest parent `EnhancedScrollView`. Since the measurements happen in native code, the function returned by this hook is an async function.

`useGetPositionInScrollView` is mostly useful together with other `react-native-scrollables` hooks. For example, if you know the y-position of an `Animated.View`, you can use [`useAnimatedScrollValue`](#useAnimatedScrollValue) to animate it as you scroll past it!

#### Type

`() => (viewRef: NativeMethods) => Promise<{ x: number; y: number; }>`

The `NativeMethods` part looks weird, but what it means most often in practice is that you can pass in a ref value for a `View`, a `Text`, an `Image`, or a `TextInput`.

#### Example

```jsx
import { useGetPositionInScrollView } from "react-native-scrollables";

function LayoutIndicatorMessage() {
  const getPositionInScrollView = useGetPositionInScrollView();
  const textRef = useRef();
  const [y, setY] = useState(0);

  return (
    <Text
      ref={textRef}
      onLayout={async () => {
        if (!textRef.current) return;
        const position = await getPositionInScrollView(textRef.current);
        setY(position.y);
      }}
    >
      The y-value of this text is {y}
    </Text>
  );
}
```

## Extras

These other components are built using the hooks listed above. They cover a couple common use cases for scroll interactions.

### `LazyList`

Given a list of elements, `LazyList` renders only the elements that the user has reached by scrolling the nearest parent `EnhancedScrollView` (plus a couple elements below, so the user doesn't see a blank space). It starts by rendering as few elements as possible, then adding more and more elements as the user scrolls. It never stops rendering elements once it's started.

`LazyList` is basically an alternative to React Native's built-in `FlatList` and `SectionList`, except that it doesn't scroll by itself. To achieve something similar to `SectionList`, you can put `LazyList`s inside other `LazyList`s (and even put those inside other `LazyList`s).

#### Props

| Prop Name          | Type          | Description                                                                                                                                                                                                                                                                                                        | Required |
| ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `elements`         | `ReactNode[]` | An array of React elements to render lazily.                                                                                                                                                                                                                                                                       | Yes      |
| `avgItemHeight`    | `number`      | The expected height of a single element in the `elements` array, on average. It's highly recommended to pass this prop. It's used to calculate how many items the list should start with, and to pad the bottom of the list with empty space before everything's rendered. Feel free to pass in an educated guess! | No       |
| `itemsToMountWith` | `number`      | Manually sets the number of items the list should start out with. Pass this in if you really can't guess a value for `avgItemHeight`. Also, it's best not to pass this to `LazyList`s that end up containing other `LazyList`s (they'll default to starting with 1 item).                                          | No       |
| `onFullyLoaded`    | `() => void`  | A function that runs when the `LazyList` is finally rendering all its items. Useful for pagination.                                                                                                                                                                                                                | No       |

#### Example

```jsx
import { LazyList } from "react-native-scrollables";

function ListOfFacts({ facts, loadMoreFacts }) {
  return (
    <LazyList
      elements={facts.map((fact) => (
        <FactText key={fact.key} text={fact.text} />
      ))}
      avgItemHeight={30}
      onFullyLoaded={loadMoreFacts}
    />
  );
}
```

### `StickyHeaderView`

A view that's given a "sticky header element", which starts out positioned above the `StickyHeaderView`'s children, but then sticks to the top of the screen as the user scrolls down the nearest parent `EnhancedScrollView`.

#### Props

| Prop Name             | Type                                  | Description                                                                                                                             | Required |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `stickyHeaderElement` | `ReactNode`                           | A React element to render above the children of `StickyHeaderView`, that then sticks to the top of the screen as the user scrolls down. | Yes      |
| `viewRef`             | `RefObject<View> | RefCallback<View>` | A ref object or function to get a ref for the `View` that wraps the `StickyHeaderView`.                                                 | No       |

#### Example

```jsx
import { StickyHeaderView } from "react-native-scrollables";

function DolphinAndSharkFacts({ dolphinFacts, sharkFacts }) {
  return (
    <View>
      <StickyHeaderView stickyHeaderElement={<Text>Dolphin Facts</Text>}>
        {dolphinFacts.map((fact) => (
          <FactText key={fact.key} text={fact.text} />
        ))}
      </StickyHeaderView>
      <StickyHeaderView stickyHeaderElement={<Text>Shark Facts</Text>}>
        {sharkFacts.map((fact) => (
          <FactText key={fact.key} text={fact.text} />
        ))}
      </StickyHeaderView>
    </View>
  );
}
```
