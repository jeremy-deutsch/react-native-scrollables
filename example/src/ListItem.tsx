import * as React from "react";
import { StyleSheet, View, Text } from "react-native";

export default function ListItem(props: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitleText}>{props.title}</Text>
      <Text style={styles.itemDescriptionText}>{props.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 12,
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  itemTitleText: {
    color: "black",
    fontSize: 20,
  },
  itemDescriptionText: {
    color: "black",
    fontSize: 14,
    marginTop: 6,
  },
});
