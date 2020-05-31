import * as React from "react";
import { StyleSheet, View, Text } from "react-native";
import { EnhancedScrollView, StickyHeaderView } from "react-native-scrollables";
import ListItem from "./ListItem";

export default function StickyHeaderExample() {
  return (
    <EnhancedScrollView style={styles.container}>
      <Text style={styles.contextText}>
        Here's some text before any of the sticky headers!
      </Text>
      <StickyHeaderView
        stickyHeaderElement={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Planets</Text>
          </View>
        }
      >
        {listData.planets.map((planet) => (
          <ListItem
            title={planet.name}
            description={`Width: ${planet.width} mi`}
          />
        ))}
      </StickyHeaderView>
      <Text style={styles.contextText}>
        And here's some text *in between* the sticky header list areas!
      </Text>
      <StickyHeaderView
        stickyHeaderElement={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              South American Countries
            </Text>
          </View>
        }
      >
        {listData.southAmericanCountries.map((country) => (
          <ListItem
            title={country.name}
            description={`Area: ${country.area} sq mi`}
          />
        ))}
      </StickyHeaderView>
    </EnhancedScrollView>
  );
}

const listData = {
  planets: [
    { name: "Mercury", width: 3031 },
    { name: "Venus", width: 7520 },
    { name: "Earth", width: 7917 },
    { name: "Mars", width: 4212 },
    { name: "Jupiter", width: 86881 },
    { name: "Saturn", width: 72367 },
    { name: "Uranus", width: 31518 },
    { name: "Neptune", width: 30599 },
  ],
  southAmericanCountries: [
    { name: "Argentina", area: 1068300 },
    { name: "Bolivia", area: 1098580 },
    { name: "Brazil", area: 3287612 },
    { name: "Chile", area: 292260 },
    { name: "Colombia", area: 440831 },
    { name: "Ecuador", area: 109480 },
    { name: "Guyana", area: 83012 },
    { name: "Paraguay", area: 157050 },
    { name: "Peru", area: 496230 },
    { name: "Suriname", area: 63040 },
    { name: "Uruguay", area: 68040 },
    { name: "Venezuela", area: 353841 },
  ],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    width: "100%",
    backgroundColor: "black",
  },
  sectionHeaderText: {
    fontSize: 20,
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
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
  contextText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "white",
    backgroundColor: "black",
  },
});
