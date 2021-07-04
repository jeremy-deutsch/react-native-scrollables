# react-native-scrollables

React Native components and hooks for leveling up your scrollable views. By leveraging composition, `react-native-scrollables` lets you build complex scrollable UIs with components and hooks that are (subjectively) simpler to use than React Native's built-in `FlatList` and `SectionList` compponents.

This library simplifies:

- Putting any content in the middle of a list
- 3-level lists (lists of lists of lists)
- Reusing scroll animations or scroll behavior across screens
- Scrolling to specific elements on a page
- Everything related to sticky headers

## Installation

```sh
yarn add react-native-scrollables
```

## Usage

### [Check out the API Docs here!](API.md)

Normally, when building scrollable views in React Native, all scroll-based behavior needs to be controlled through props to the ScrollView, FlatList, or SectionList. That means any animations, sticky headers, virtual list data, etc. These APIs can be a pain when you're building smaller, reusable components, or if you just want to make a UI that's a little more complex.

`react-native-scrollables` turns that paradigm upside down: with the `EnhancedScrollView` component, child components can respond to scrolling and interact with their parent scrollable view. This means you can split up that logic among various reusable components, instead of having it all be concentrated at the top!

```jsx
// Create cool UIs through composition!
import { EnhancedScrollView, StickyHeaderView } from "react-native-scrollables";

function StickyHeaderScreen({ lists }) {
  return (
    <EnhancedScrollView>
      {lists.map(({ title, items }) => (
        {/* StickyHeaderView can even be part of another component! */}
        {/* (and also be inside of another StickyHeaderView) */}
        <StickyHeaderView
          key={title}
          stickyHeaderElement={<Title>{title}</Title>}
        >
          {items.map((item) => (
            <Item key={item.key} data={item} />
          ))}
        </StickyHeaderView>
      ))}
    </EnhancedScrollView>
  );
}

// Use the included hooks to build your own scrollable components!
import { useAnimatedScrollValue } from "react-native-scrollables";

function AnimatedHeaderImage({ source, style }) {
  const animatedScrollY = useAnimatedScrollValue().y;
  return (
    <Animated.Image
      source={source}
      style={[
        style,
        { transform: [{ translateY: Animated.divide(animatedScrollY, 2) }] },
      ]}
    />
  );
}

function ArticlePage({ imgSrc, title, text }) {
  return (
    <EnhancedScrollView>
      {/* Now you can drop AnimatedHeaderImage into any scrollable page! */}
      <AnimatedHeaderImage source={imgSrc} style={{ width: "100%" }} />
      <ArticleBody title={title} text={text} />
    </EnhancedScrollView>
  );
}
```

The [`example`](example) directory shows off some other ways to use the library!

## License

MIT
