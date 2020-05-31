# react-native-scrollables

React Native components and hooks for leveling up your scrollable views.

Normally, when building scrollable views in React Native, all scroll-based behavior needs to be controlled through props to the ScrollView, FlatList, or SectionList. That means any animations, sticky headers, virtual list data, etc.

`react-native-scrollables` turns that paradigm upside down: with the `EnhancedScrollView` component, child components can respond to scrolling and interact with their parent scrollable view. This means you can split up that logic among various reusable components, instead of having it all be concentrated at the top!

## Installation

```sh
yarn add react-native-scrollables
```

## Usage

Actual docs to come! Check out the `example` directory for now.

```jsx
// Create cool UIs through composition!
import { EnhancedScrollView, StickyHeaderView } from "react-native-scrollables";

function StickyHeaderScreen({ lists }) {
  return (
    <EnhancedScrollView>
      {lists.map(({ title, items }) => (
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
  const animatedScrollValue = useAnimatedScrollValue();
  return (
    <Animated.Image
      source={source}
      style={[
        style,
        {
          transform: [{ translateY: Animated.divide(animatedScrollValue, 2) }],
        },
      ]}
    />
  );
}

function ArticlePage({ imgSrc, title, text }) {
  return (
    <EnhancedScrollView>
      <AnimatedHeaderImage source={imgSrc} style={{ width: "100%" }} />
      <ArticleBody title={title} text={text} />
    </EnhancedScrollView>
  );
}
```

## License

MIT
