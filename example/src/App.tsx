import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StickyHeaderExample from "./StickyHeaderExample";
import LazyListExample from "./LazyListExample";
import NestedLazyListExample from "./NestedLazyListExample";
import CollapsibleSectionExample from "./CollapsibleSectionExample";
import HideOffscreenExample from "./HideOffscreenExample";
import AnchorExample from "./AnchorExample";

enum Example {
  StickyHeaderExample,
  LazyListExample,
  NestedLazyListExample,
  CollapsibleSectionExample,
  HideOffscreenExample,
  AnchorExample,
}

export default function App() {
  const [exampleToShow, setExampleToShow] = React.useState(
    Example.StickyHeaderExample
  );

  let exampleElement: React.ReactElement;
  if (exampleToShow === Example.StickyHeaderExample) {
    exampleElement = <StickyHeaderExample />;
  } else if (exampleToShow === Example.CollapsibleSectionExample) {
    exampleElement = <CollapsibleSectionExample />;
  } else if (exampleToShow === Example.LazyListExample) {
    exampleElement = <LazyListExample />;
  } else if (exampleToShow === Example.NestedLazyListExample) {
    exampleElement = <NestedLazyListExample />;
  } else if (exampleToShow === Example.HideOffscreenExample) {
    exampleElement = <HideOffscreenExample />;
  } else if (exampleToShow === Example.AnchorExample) {
    exampleElement = <AnchorExample />;
  } else {
    exampleElement = (
      <View style={{ flex: 1 }}>
        <Text>Choose an example!</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{exampleElement}</View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.StickyHeaderExample)}
        >
          <Text>Sticky Headers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.CollapsibleSectionExample)}
        >
          <Text>Collapsible Sections</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.LazyListExample)}
        >
          <Text>Lazy List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.NestedLazyListExample)}
        >
          <Text>Nested Lazy Lists</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.HideOffscreenExample)}
        >
          <Text>Hide Elements Offscreen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExampleToShow(Example.AnchorExample)}
        >
          <Text>Anchors</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 2,
    marginRight: 4,
  },
});
