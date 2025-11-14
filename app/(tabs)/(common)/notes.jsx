import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../../assets/icons/Plus";
import Button from "../../../components/Button";
import NoteCard from "../../../components/NoteCard";
import SearchBar from "../../../components/SearchBar";
import NoteCardSkeleton from "../../../components/skeletons/NoteCardSkeleton";
import { hp } from "../../../helpers/common";
import { useDeleteNoteMutation, useGetNotesByBranchIdPaginatedQuery, useLazyGetNotesByBranchIdPaginatedQuery } from "../../../redux/api/noteApi";

const PAGE_SIZE = 5;

const notes = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);
  
  const [notesList, setNotesList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetNotesByBranchIdPaginatedQuery(
    { branchId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: notesError }] = useLazyGetNotesByBranchIdPaginatedQuery();

  const [deleteNote] = useDeleteNoteMutation();

  useEffect(() => {
    if (notesError) {
      Alert.alert("Error", notesError.message || "Failed to load notes");
    }
  }, [notesError]);

  useEffect(() => {
    // Show skeleton for minimum 1s only on cold load (no cached data)
    if (!initialData?.items?.length) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [initialData]);

  const getNoteKey = (n) => String(n?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setNotesList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getNoteKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getNoteKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // handled by notesError alert above
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (notesList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setNotesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (notesList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setNotesList(initialData.items);
        setOffset(initialData.items.length);
        setHasMore(initialData.items.length === PAGE_SIZE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setNotesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false);
  };

  const handleEdit = (note) => {
    router.push({
      pathname: '/screens/forms/addNote',
      params: {
        noteId: note.id,
      },
    });
  };

  const handleDelete = async (note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.note_Title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote({ noteId: note.id, branchId }).unwrap();
              // Remove from list immediately
              setNotesList((prev) => prev.filter((n) => n.id !== note.id));
              Alert.alert("Success", "Note deleted successfully!");
            } catch (error) {
              const actualError = error?.data?.data || error?.data || error;
              Alert.alert("Error", actualError.message || "Failed to delete note");
            }
          },
        },
      ]
    );
  };

  const handleAddNote = () => {
    router.push("/screens/forms/addNote");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={styles.container}>
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
        <FlatList
          data={notesList}
          keyExtractor={(note) => getNoteKey(note)}
          renderItem={({ item: note }) => (
            <NoteCard
              note_Title={note.note_Title}
              note_Description={note.note_Description}
              expire_Date={note.expire_Date}
              created_By={note.created_By}
              created_By_Name={note.created_By_Name}
              created_By_Role={note.created_By_Role}
              is_For_Entire_Branch={note.is_For_Entire_Branch}
              specific_Class={note.specific_Class}
              class_Name={note.class_Name}
              created_at={note.created_at}
              onEdit={() => handleEdit(note)}
              onDelete={() => handleDelete(note)}
            />
          )}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (notesList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <NoteCardSkeleton key={index} />
                ))}
              </>
            ) : notesList.length === 0 ? (
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
            ) : null
          }
          ListFooterComponent={
            notesList.length > 0 && !isRefreshing && isLoadingMore ? (
              <NoteCardSkeleton />
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={PAGE_SIZE}
          windowSize={PAGE_SIZE * 2}
        />
      </View>
    </View>
  );
};

export default notes;

const styles = StyleSheet.create({
  container: {
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
