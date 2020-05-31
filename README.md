# react-native-scrollables

React Native components and hooks for leveling up your scrollable views.

## Installation

```sh
yarn add react-native-scrollables
```

## Usage

Actual docs to come! Check out the `example` folder for now.

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
