import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Using react-native-safe-area-context

// --- Constants ---
const PRIMARY_COLOR = "#007AFF"; // Main blue color for the glow effect
const TEXT_COLOR = "#1C1C1E"; // Dark text color
const LIGHT_GRAY = "#F2FF7"; // Background color for cards/filters
const BORDER_RADIUS = 12;

// --- Helper Components ---

/**
 * Renders the status indicator circle (I am safe / Я в безпеці)
 */
const MainStatusIndicator = () => (
  <View style={styles.mainStatusContainer}>
    {/* The blurred/glowing background effect is simulated with a View */}
    <View style={styles.mainStatusGlowBackground}>
      <Text style={styles.mainStatusText}>Я в безпеці</Text>
    </View>
    <Text style={styles.mainStatusHelperText}>
      Утримайте, якщо потрібна допомога
    </Text>
  </View>
);

/**
 * Renders a single contact status row
 */
interface ContactStatusProps {
  name: string;
  status: "В безпеці" | "Потрібна допомога" | "Невідомо";
  time: string;
  profileImage: any; // Using 'any' for local image require placeholder
}

const ContactStatusRow: React.FC<ContactStatusProps> = ({
  name,
  status,
  time,
  profileImage,
}) => {
  let statusText: string;
  let StatusIcon: React.ReactNode;
  let statusStyle: any = styles.contactStatusText;

  switch (status) {
    case "В безпеці":
      statusText = "В безпеці";
      StatusIcon = <AntDesign name="checkcircle" size={24} color="#34C759" />;
      break;
    case "Потрібна допомога":
      statusText = "Потрібна допомога";
      StatusIcon = <AntDesign name="warning" size={24} color="#FF3B30" />;
      statusStyle = styles.contactStatusTextAlert;
      break;
    case "Невідомо":
    default:
      statusText = "Невідомо";
      StatusIcon = (
        <AntDesign name="questioncircle" size={24} color="#FFCC00" />
      );
      break;
  }

  return (
    <View style={styles.contactRow}>
      {/* Placeholder Image */}
      <Image source={profileImage} style={styles.profileImage} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{name}</Text>
        <Text style={statusStyle}>{statusText}</Text>
        <Text style={styles.contactTime}>{time}</Text>
      </View>
      <View style={styles.contactStatusIcon}>{StatusIcon}</View>
    </View>
  );
};

/**
 * Renders the Mood/State section
 */
const MoodSection = () => (
  <View style={styles.moodCard}>
    <View>
      <Text style={styles.sectionHeader}>НАСТРІЙ</Text>
      <Text style={styles.moodTitle}>Поганий</Text>
      <Text style={styles.moodDescription}>
        Почуваюсь втомленим, бо погано спав
      </Text>
    </View>
    {/* Placeholder for the Angry Emoji image */}
    <Image
      source={{ uri: "https://via.placeholder.com/60" }} // Placeholder for the 3D emoji
      style={styles.moodEmoji}
    />
  </View>
);

// --- Main Screen Component ---
const DashboardScreen: React.FC = () => {
  // Mock data for profiles (using placeholder URIs for simplicity)
  const profileImagePlaceholder = { uri: "https://via.placeholder.com/50" };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.greeting}>Привіт, Тарасе!</Text>

        {/* Air Raid Alert Card */}
        <View style={styles.alertCard}>
          <View>
            <Text style={styles.alertHeader}>ПОВІТРЯНА ТРИВОГА!</Text>
            <Text style={styles.alertBody}>
              Перейдіть в укриття та оновіть статус
            </Text>
          </View>
          {/* Icon with a circular background */}
          <View style={styles.alertIconWrapper}>
            <MaterialCommunityIcons
              name="volume-high"
              size={24}
              color={TEXT_COLOR}
            />
          </View>
        </View>

        {/* Main Status Indicator */}
        <MainStatusIndicator />

        {/* Status Circle Section */}
        <View style={styles.statusCircleSection}>
          <Text style={styles.sectionHeader}>СТАТУС КОЛА</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilters}
          >
            <TouchableOpacity style={styles.statusFilterActive}>
              <Text style={styles.statusFilterTextActive}>Усі</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusFilter}>
              <Text style={styles.statusFilterText}>Родина</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusFilter}>
              <Text style={styles.statusFilterText}>Друзі</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusFilter}>
              <Text style={styles.statusFilterText}>Близ</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Contact Statuses List */}
          <View style={styles.contactList}>
            <ContactStatusRow
              name="Брат"
              status="Потрібна допомога"
              time="19:02"
              profileImage={profileImagePlaceholder}
            />
            <ContactStatusRow
              name="Тато"
              status="В безпеці"
              time="19:02"
              profileImage={profileImagePlaceholder}
            />
            <ContactStatusRow
              name="Тато"
              status="В безпеці"
              time="19:02"
              profileImage={profileImagePlaceholder}
            />
            <ContactStatusRow
              name="Брат"
              status="Невідомо"
              time="19:02"
              profileImage={profileImagePlaceholder}
            />
          </View>
        </View>

        {/* Mood Section */}
        <MoodSection />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Assuming a white background as per the design
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0, // Padding handled by SafeAreaView
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: TEXT_COLOR,
    marginBottom: 20,
  },
  alertCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: BORDER_RADIUS,
    padding: 16,
    marginBottom: 30,
  },
  alertHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3B30", // Red color for alert
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
    maxWidth: "85%", // Prevent text from overlapping the icon
  },
  alertIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E5EA", // A slightly darker gray for the icon background
    justifyContent: "center",
    alignItems: "center",
  },

  // Main Status Indicator
  mainStatusContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  mainStatusGlowBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    // Simulation of the blurred/glowing effect
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 5, // Android shadow fallback
    opacity: 0.7, // Overall opacity to simulate the lighter glow
  },
  mainStatusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mainStatusHelperText: {
    marginTop: 15,
    fontSize: 12,
    color: "#8E8E93", // Gray text
  },

  // Status Circle Section
  statusCircleSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 10,
  },
  statusFilters: {
    flexDirection: "row",
    marginBottom: 10,
  },
  statusFilter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
    marginRight: 8,
  },
  statusFilterActive: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: TEXT_COLOR,
    borderRadius: 20,
    marginRight: 8,
  },
  statusFilterText: {
    fontSize: 14,
    color: TEXT_COLOR,
    fontWeight: "500",
  },
  statusFilterTextActive: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Contact Status List & Row
  contactList: {
    backgroundColor: "#FFFFFF", // Explicit white background for the list area
    borderRadius: BORDER_RADIUS,
    // Add margin/padding if the list itself was meant to be on a card, but based on design, it's just a section
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA", // Light separator line
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: LIGHT_GRAY, // Placeholder background
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
  },
  contactStatusText: {
    fontSize: 14,
    color: TEXT_COLOR,
  },
  contactStatusTextAlert: {
    fontSize: 14,
    color: "#FF3B30", // Red color for 'Потрібна допомога'
    fontWeight: "500",
  },
  contactTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  contactStatusIcon: {
    marginLeft: 10,
    width: 24, // Fixed size for the icon container
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Mood Section
  moodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: BORDER_RADIUS,
    padding: 16,
    marginTop: 10, // Small separation from the contact list
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 14,
    color: TEXT_COLOR,
    maxWidth: "80%", // Constraint text width to leave space for emoji
  },
  moodEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30, // Assuming circular placeholder
    backgroundColor: "#FF9500", // Placeholder background color
  },
});

export default DashboardScreen;
