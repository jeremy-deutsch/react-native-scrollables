import React from "react";
import {
  createAnchorHandle,
  EnhancedScrollView,
  AnchorView,
} from "react-native-scrollables";
import ListItem from "./ListItem";
import { View, StyleSheet, Text, Pressable } from "react-native";

// remember - you should be able to create anchor handles in render
// (even without useMemo) and have it work fine

export default function AnchorExample() {
  const anchors = data.map(() => createAnchorHandle());
  return (
    <EnhancedScrollView>
      <View>
        {data.map((planet, i) => (
          <Pressable
            onPress={() => {
              anchors[i].scrollTo();
            }}
          >
            <Text style={styles.indexLink}>{planet.name}</Text>
          </Pressable>
        ))}
      </View>
      {data.map((planet, i) => (
        <AnchorView anchorHandle={anchors[i]}>
          <ListItem
            key={planet.name}
            title={planet.name}
            description={`Width: ${planet.width} mi`}
          />
        </AnchorView>
      ))}
      {/* some extra space to make room for anchors */}
      <View style={{ height: 500 }} />
    </EnhancedScrollView>
  );
}

const data = [
  { name: "Mercury", width: 3031 },
  { name: "Venus", width: 7520 },
  { name: "Earth", width: 7917 },
  { name: "Mars", width: 4212 },
  { name: "Jupiter", width: 86881 },
  { name: "Saturn", width: 72367 },
  { name: "Uranus", width: 31518 },
  { name: "Neptune", width: 30599 },
];

const styles = StyleSheet.create({
  indexLink: {
    padding: 8,
    color: "green",
  },
});
