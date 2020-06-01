import * as React from "react";
import { EnhancedScrollView, LazyList } from "react-native-scrollables";
import usStates from "./usStates.json";
import ListItem from "./ListItem";

export default function LazyListExample() {
  return (
    <EnhancedScrollView>
      <LazyList
        avgItemHeight={64}
        elements={usStates.map((state) => (
          <ListItem
            title={state.name}
            description={`Capital: ${state.capital}`}
            key={state.name}
          />
        ))}
      />
    </EnhancedScrollView>
  );
}
