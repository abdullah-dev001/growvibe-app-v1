import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../../assets/icons/Plus";
import Button from "../../../components/Button";
import NoteCard from "../../../components/NoteCard";
import SearchBar from "../../../components/SearchBar";
import NoteCardSkeleton from "../../../components/skeletons/NoteCardSkeleton";
import { hp } from "../../../helpers/common";
import { useDeleteNoteMutation, useGetNotesByBranchIdQuery } from "../../../redux/api/noteApi";

const notes = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);
  
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = useGetNotesByBranchIdQuery(branchId, {
    skip: !branchId,
    refetchOnMountOrArgChange: true,
  });

  const [deleteNote] = useDeleteNoteMutation();

  if (notesError) {
    Alert.alert("Error", notesError.message || "Failed to load notes");
  }

  const handleEdit = (note) => {
    // Navigate to edit screen or open modal
    console.log("Edit note:", note);
  };

  const handleDelete = async (note) => {
    try {
      await deleteNote(note.id).unwrap();
      Alert.alert("Success", "Note deleted successfully!");
    } catch (error) {
      const actualError = error?.data?.data || error?.data || error;
      Alert.alert("Error", actualError.message || "Failed to delete note");
    }
  };

  const handleAddNote = () => {
    router.push("/screens/forms/addNote");
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Notes
            </Text>
            <Text style={styles.headerSubtitle}>
              Manage your notes
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
          <Text style={styles.listHeaderText}>
            Note List
          </Text>
          <View style={styles.listHeaderDivider} />
        </View>

        {/* Note Cards */}
        <ScrollView>
          <View style={styles.scrollContent}>
            {notesLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <NoteCardSkeleton key={index} />
              ))
            ) : notesData && notesData.length > 0 ? (
              notesData.map((note) => (
                <NoteCard
                  key={note.id}
                  note_Title={note.note_Title}
                  note_Description={note.note_Description}
                  expire_Date={note.expire_Date}
                  created_By={note.created_By}
                  created_By_Name={note.created_By_Name}
                  created_By_Role={note.created_By_Role}
                  is_For_Entire_Branch={note.is_For_Entire_Branch}
                  specific_Class={note.specific_Class}
                  created_at={note.created_at}
                  onEdit={() => handleEdit(note)}
                  onDelete={() => handleDelete(note)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No notes found. Create your first note to get started.
                </Text>
                <Button
                  title="Add Note"
                  onPress={handleAddNote}
                  size="small"
                  bgColor="#8B5CF6"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default notes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginVertical: 16,
  },
  listHeaderText: {
    color: '#6B7280',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.05,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  listHeaderDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 56,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(2),
    textAlign: "center",
  },
});
