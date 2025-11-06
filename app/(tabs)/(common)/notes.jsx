import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../../assets/icons/Plus";
import Button from "../../../components/Button";
import NoteCard from "../../../components/NoteCard";
import SearchBar from "../../../components/SearchBar";
import NoteCardSkeleton from "../../../components/skeletons/NoteCardSkeleton";
import { hp } from "../../../helpers/common";

const Notes = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);

  // TODO: Replace with actual API call
  const notesLoading = false;
  const notesError = null;
  const notesData = []; // Mock data

  if (notesError) {
    Alert.alert("Error", notesError.message || "Failed to load notes");
  }

  const handleEdit = (note) => console.log("Edit note:", note);
  const handleDelete = (note) => console.log("Delete note:", note);
  const handleAddNote = () => router.push("/screens/forms/addNote");

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSubtitle}>
              Manage your notes and announcements
            </Text>
          </View>
          <Button
            title="Add Note"
            onPress={handleAddNote}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#8B5CF6"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Note List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>Note List</Text>
          <View style={styles.listHeaderLine} />
        </View>

        {/* Note Cards */}
        <ScrollView>
          <View style={styles.noteListContainer}>
            {notesLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <NoteCardSkeleton key={index} />
              ))
            ) : notesData && notesData.length > 0 ? (
              notesData.map((note) => (
                <NoteCard
                  key={note.id || note.note_id}
                  note_Title={note.note_Title}
                  note_Description={note.note_Description}
                  expire_Date={note.expire_Date}
                  created_By={note.created_By}
                  is_For_Entire_Branch={note.is_For_Entire_Branch}
                  specific_Class={note.specific_Class}
                  created_at={note.created_at}
                  onEdit={() => handleEdit(note)}
                  onDelete={() => handleDelete(note)}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  No notes found. Create your first note to get started.
                </Text>
                <Button
                  title="Add Note"
                  onPress={handleAddNote}
                  size="small"
                  bgColor="#8B5CF6"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color="#FFFFFF" strokeWidth={2} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    marginTop: hp(0.5),
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 16,
  },
  listHeaderText: {
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: "uppercase",
  },
  listHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 12,
  },
  noteListContainer: {
    flex: 1,
    paddingBottom: 56,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(2),
    textAlign: "center",
  },
});

export default Notes;
