import React from "react";
import { View, Text } from "react-native";
import {
  EnhancedScrollView,
  HideOffscreen,
  LazyList,
} from "react-native-scrollables";

// the char code for the letter "a"
const aCharCode = 97;

export default function HideOffscreenExample() {
  const nums: number[] = [];
  for (let i = 0; i < 500; i++) {
    nums.push(i);
  }

  return (
    <EnhancedScrollView>
      <LazyList
        elements={nums.map((num) => (
          <HideOffscreen key={num}>
            <InnerItem num={num} />
          </HideOffscreen>
        ))}
        avgItemHeight={120}
      />
    </EnhancedScrollView>
  );
}

// this is basically a component with an impossible-to-precalculate dynamic height
function InnerItem(props: { num: number }) {
  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        Dynamic Height {props.num}:
      </Text>
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <Text style={{ flex: 1 }}>
            {String.fromCharCode(
              ...Array(100).fill(aCharCode + (props.num % 26))
            )}
          </Text>
          <Text style={{ flex: (props.num % 3) + 1 }}>
            {String.fromCharCode(
              ...Array(100).fill(aCharCode + (props.num % 26))
            )}
          </Text>
          <Text style={{ flex: 1 }}>
            {String.fromCharCode(
              ...Array(100).fill(aCharCode + (props.num % 26))
            )}
          </Text>
        </View>
        <Text>
          {String.fromCharCode(
            ...Array(200).fill(aCharCode + (props.num % 26))
          )}
        </Text>
      </View>
    </View>
  );
}
