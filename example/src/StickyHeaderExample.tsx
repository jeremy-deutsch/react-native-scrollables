import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import {
  EnhancedScrollView,
  StickyHeaderView,
  createAnchorHandle,
  AnchorView,
} from "react-native-scrollables";
import ListItem from "./ListItem";

export default function StickyHeaderExample() {
  const planetAnchors = listData.planets.map(() => createAnchorHandle());
  const countryAnchors = listData.southAmericanCountries.map(() =>
    createAnchorHandle()
  );

  return (
    <EnhancedScrollView style={styles.container}>
      <Text style={styles.contextText}>
        Here's some text before any of the sticky headers!
      </Text>
      <StickyHeaderView
        stickyHeaderElement={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Mega-header</Text>
          </View>
        }
      >
        <Text>These are anchor links!</Text>
        {planetAnchors.map((anchor, i) => (
          <Pressable onPress={() => anchor.scrollTo()}>
            <Text style={styles.link}>{listData.planets[i].name}</Text>
          </Pressable>
        ))}
        {countryAnchors.map((anchor, i) => (
          <Pressable onPress={() => anchor.scrollTo()}>
            <Text style={styles.link}>
              {listData.southAmericanCountries[i].name}
            </Text>
          </Pressable>
        ))}
        <StickyHeaderView
          stickyHeaderElement={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Planets</Text>
            </View>
          }
        >
          {listData.planets.map((planet, i) => (
            <AnchorView anchorHandle={planetAnchors[i]} key={planet.name}>
              <ListItem
                title={planet.name}
                description={`Width: ${planet.width} mi`}
              />
            </AnchorView>
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
          {listData.southAmericanCountries.map((country, i) => (
            <AnchorView anchorHandle={countryAnchors[i]} key={country.name}>
              <ListItem
                title={country.name}
                description={`Area: ${country.area} sq mi`}
              />
            </AnchorView>
          ))}
        </StickyHeaderView>
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
  link: {
    padding: 8,
    color: "green",
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
