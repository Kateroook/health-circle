import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button } from "@/src/components/Button";
import { theme } from "@/src/theme/theme";

import { Circle } from "@/src/types";

interface GroupFiltersProps {
  groups: Circle[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
}

export const GroupFilters = ({ groups, selectedGroupId, onSelectGroup }: GroupFiltersProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Button
        label="Усі"
        hierarchy={selectedGroupId === "ALL" ? "primary" : "secondary"}
        shape="pill"
        size="small"
        onPress={() => onSelectGroup("ALL")}
        style={styles.filterButton}
      />

      {groups.map((group) => (
        <Button
          key={group.id}
          label={group.name}
          hierarchy={selectedGroupId === group.id ? "primary" : "secondary"}
          shape="pill"
          size="small"
          onPress={() => onSelectGroup(group.id)}
          style={styles.filterButton}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: theme.spacing[8],
  },
  contentContainer: {
    paddingRight: 16,
  },
  filterButton: {
    marginRight: theme.spacing[8],
  },
});
