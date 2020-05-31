import * as React from "react";
import { EnhancedScrollView, LazyList } from "react-native-scrollables";
import { Text } from "react-native";
import usStates from "./usStates.json";
import ListItem from "./ListItem";

export default function NestedLazyListExample() {
  React.useState();
  return (
    <EnhancedScrollView>
      {/* using itemsToMountWith */}
      <LazyList
        itemsToMountWith={1}
        elements={[
          <StatesList states={usStates.slice(0, 25)} />,
          <Text>That was the first 25 states! Now for the next 25!</Text>,
          <StatesList states={usStates.slice(25)} />,
        ]}
      />
    </EnhancedScrollView>
  );
}

// LazyList supports composition!
function StatesList(props: { states: typeof usStates }) {
  return (
    <LazyList
      avgItemHeight={64}
      elements={props.states.map((usState) => (
        <ListItem
          key={usState.name}
          title={usState.name}
          description={`Capital: ${usState.capital}`}
        />
      ))}
    />
  );
}
