import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  useGetPositionInScrollView,
  useScrollViewRef,
  useAddScrollListener,
  StickyHeaderView,
  EnhancedScrollView,
} from "react-native-scrollables";
// A bunch of long character bios copy-pasted from The Good Place Wiki
import goodPlaceBios from "./goodPlaceBios.json";

// A collapsible page section with a sticky header. Uses three different
// react-native-scrollable hooks to keep the page from jumping too much
// when the header is stuck to the top and the user collapses the section.
function CollapsibleSection(props: { title: string; body: string }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getPositionInScrollView = useGetPositionInScrollView();

  const stickyHeaderViewRef = React.useRef<View>(null);
  const scrollViewRef = useScrollViewRef();

  const scrollAmountRef = React.useRef(0);
  const addScrollListener = useAddScrollListener();
  React.useEffect(() => {
    return addScrollListener((e) => {
      scrollAmountRef.current = e.contentOffset.y;
    });
  }, [addScrollListener]);

  return (
    <StickyHeaderView
      viewRef={stickyHeaderViewRef}
      stickyHeaderElement={
        <TouchableOpacity
          onPress={async () => {
            if (!stickyHeaderViewRef.current) return;
            if (!isCollapsed) {
              // if we're not collapsed, but the sticky header is stuck to
              // the top, we might have to jump the scroll view upwards so
              // the sticky header is still at the top in the end.
              try {
                const { y } = await getPositionInScrollView(
                  stickyHeaderViewRef.current
                );
                if (scrollAmountRef.current > y) {
                  scrollViewRef.current
                    ?.getNode()
                    .scrollTo({ y, animated: false });
                }
              } catch (e) {
                console.warn("Getting the sticky header position failed", e);
              }
            }
            setIsCollapsed(!isCollapsed);
          }}
        >
          <Text style={styles.title}>{props.title}</Text>
        </TouchableOpacity>
      }
    >
      {!isCollapsed && <Text style={styles.body}>{props.body}</Text>}
    </StickyHeaderView>
  );
}

export default function CollapsibleSectionExample() {
  return (
    <EnhancedScrollView>
      <CollapsibleSection
        title="Ellenor Shellstrop"
        body={goodPlaceBios.ellenor}
      />
      <CollapsibleSection title="Chidi Anagonye" body={goodPlaceBios.chidi} />
      <CollapsibleSection title="Jason Mendoza" body={goodPlaceBios.jason} />
      <CollapsibleSection title="Tahani Al-Jamil" body={goodPlaceBios.tahani} />
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
