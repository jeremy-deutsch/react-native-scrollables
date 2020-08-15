import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  useGetPositionInScrollView,
  useScrollViewRef,
  useScrollEvents,
  StickyHeaderView,
  EnhancedScrollView,
} from "react-native-scrollables";
// A bunch of long character bios copy-pasted from The Good Place Wiki
import goodPlaceBios from "./goodPlaceBios.json";

// A collapsible page section with a sticky header. Uses three different
// react-native-scrollable hooks to keep the page from jumping too much
// when the header is stuck to the top and the user collapses the section.
function CollapsibleSection(props: {
  renderStickyHeader: (args: {
    isCollapsed: boolean;
    toggleCollapsed: () => void;
  }) => React.ReactElement | null;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getPositionInScrollView = useGetPositionInScrollView();

  const stickyHeaderViewRef = React.useRef<View>(null);
  const scrollViewRef = useScrollViewRef();

  const scrollEvents = useScrollEvents();

  const toggleCollapsed = async () => {
    if (!isCollapsed) {
      if (!stickyHeaderViewRef.current) return;
      // if we're not collapsed, but the sticky header is stuck to
      // the top, we might have to jump the scroll view upwards so
      // the sticky header is still at the top in the end.
      try {
        const { y } = await getPositionInScrollView(
          stickyHeaderViewRef.current
        );
        if (scrollEvents.latest && scrollEvents.latest.contentOffset.y > y) {
          scrollViewRef.current?.scrollTo({ y, animated: false });
        }
      } catch (e) {
        console.warn("Getting the sticky header position failed", e);
      }
    }
    setIsCollapsed(!isCollapsed);
  };

  return (
    <StickyHeaderView
      viewRef={stickyHeaderViewRef}
      stickyHeaderElement={props.renderStickyHeader({
        isCollapsed,
        toggleCollapsed,
      })}
    >
      {!isCollapsed && props.children}
    </StickyHeaderView>
  );
}

function SectionTitle(props: {
  children: React.ReactNode;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}) {
  return (
    <TouchableOpacity onPress={props.toggleCollapsed}>
      <Text style={styles.title}>{props.children}</Text>
    </TouchableOpacity>
  );
}

export default function CollapsibleSectionExample() {
  return (
    <EnhancedScrollView>
      <CollapsibleSection
        renderStickyHeader={({ isCollapsed, toggleCollapsed }) => (
          <SectionTitle {...{ isCollapsed, toggleCollapsed }}>
            Ellenor Shellstrop
          </SectionTitle>
        )}
      >
        <Text style={styles.body}>{goodPlaceBios.ellenor}</Text>
      </CollapsibleSection>
      <CollapsibleSection
        renderStickyHeader={({ isCollapsed, toggleCollapsed }) => (
          <SectionTitle {...{ isCollapsed, toggleCollapsed }}>
            Chidi Anagonye
          </SectionTitle>
        )}
      >
        <Text style={styles.body}>{goodPlaceBios.chidi}</Text>
      </CollapsibleSection>
      <CollapsibleSection
        renderStickyHeader={({ isCollapsed, toggleCollapsed }) => (
          <SectionTitle {...{ isCollapsed, toggleCollapsed }}>
            Jason Mendoza
          </SectionTitle>
        )}
      >
        <Text style={styles.body}>{goodPlaceBios.jason}</Text>
      </CollapsibleSection>
      <CollapsibleSection
        renderStickyHeader={({ isCollapsed, toggleCollapsed }) => (
          <SectionTitle {...{ isCollapsed, toggleCollapsed }}>
            Tahani Al-Jamil
          </SectionTitle>
        )}
      >
        <Text style={styles.body}>{goodPlaceBios.tahani}</Text>
      </CollapsibleSection>
    </EnhancedScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 20,
    backgroundColor: "white",
  },
  body: {
    paddingHorizontal: 8,
  },
});
