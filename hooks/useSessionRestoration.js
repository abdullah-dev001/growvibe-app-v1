import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolveTeacherClassId } from '../redux/api/classApi';
import { setBranchId, setClassId, setSessionId, setSessionRestored, setUser } from '../redux/slices/authSlice';
import { supabase } from '../supabaseClient';

export const useSessionRestoration = () => {
  const dispatch = useDispatch();
  const { sessionRestored, user, branchId } = useSelector((state) => state.auth);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          dispatch(setSessionRestored(true));
          return;
        }

        if (session) {
          // Set user from session
          const userData = {
            id: session.user.id,
            email: session.user.email,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            role: session.user.app_metadata?.role,
          };
          dispatch(setUser(userData));

          // Attempt to derive branchId from various possible metadata keys
          const branchIdFromAppMeta = session.user?.app_metadata?.branchId || session.user?.app_metadata?.branch_Id;
          const branchIdFromUserMeta = session.user?.user_metadata?.branchId || session.user?.user_metadata?.branch_Id;
          const restoredBranchId = branchIdFromAppMeta ?? branchIdFromUserMeta ?? null;

          if (restoredBranchId) {
            dispatch(setBranchId(restoredBranchId));
          }

          // Restore classId for teachers and students
          const userRole = session.user.app_metadata?.role;
          if (userRole === "teacher" || userRole === "student") {
            try {
              let classIdToSet = null;

              if (userRole === "student") {
                // For students: get class_Id from raw_app_meta_data (app_metadata)
                const rawAppMetaData = session.user?.raw_app_meta_data || session.user?.app_metadata;
                classIdToSet = rawAppMetaData?.class_Id || rawAppMetaData?.classId || null;
              } else if (userRole === "teacher") {
                classIdToSet = await resolveTeacherClassId(session.user.id);
              }

              if (classIdToSet) {
                dispatch(setClassId(classIdToSet));
              }
            } catch (classErr) {
              console.error("Error fetching classId during session restoration:", classErr);
            }
          }
        } else {
          dispatch(setUser(null));
        }
        
        dispatch(setSessionRestored(true));
      } catch (error) {
        dispatch(setSessionRestored(true));
      }
    };

    if (!sessionRestored) {
      restoreSession();
    }
  }, [dispatch, sessionRestored]);

  // Separate effect to fetch active session when branchId changes for principal/coordinator
  useEffect(() => {
    const fetchActiveSession = async () => {
      // Only fetch for principal and coordinator roles, skip admin and owner
      const userRole = user?.role;
      if (!userRole || userRole === 'admin' || userRole === 'owner') {
        return;
      }

      // Only fetch if user is principal or coordinator and has branchId
      if ((userRole === 'principal' || userRole === 'coordinator') && branchId) {
        try {
          const { data: activeSessions, error: sessionError } = await supabase
            .from("session")
            .select("*")
            .eq("branch_Id", branchId)
            .eq("session_Status", true)
            .limit(1);

          if (!sessionError && activeSessions && activeSessions.length > 0) {
            dispatch(setSessionId(activeSessions[0].id));
          }
        } catch (sessionErr) {
          console.error('Error fetching active session:', sessionErr);
        }
      }
    };

    // Only run if session is restored and we have the necessary data
    if (sessionRestored && user && branchId) {
      fetchActiveSession();
    }
  }, [dispatch, sessionRestored, user, branchId]);

  return { sessionRestored, user };
};
