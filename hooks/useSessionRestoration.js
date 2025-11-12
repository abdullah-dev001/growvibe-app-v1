import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolveTeacherClassId, useLazyGetClassByIdQuery } from '../redux/api/classApi';
import { useLazyGetProfileByRoleQuery } from '../redux/api/profileApi';
import { useLazyGetActiveSessionByBranchIdQuery } from '../redux/api/sessionApi';
import { setBranchId, setClassId, setClassInfo, setSessionId, setSessionRestored, setUser } from '../redux/slices/authSlice';
import { supabase } from '../supabaseClient';

export const useSessionRestoration = () => {
  const dispatch = useDispatch();
  const { sessionRestored, user, branchId, classId, className } = useSelector((state) => state.auth);
  const [fetchProfile] = useLazyGetProfileByRoleQuery();
  const [fetchClass] = useLazyGetClassByIdQuery();
  const [fetchActiveSession] = useLazyGetActiveSessionByBranchIdQuery();
  const hasRestoredSession = useRef(false);
  const hasFetchedActiveSession = useRef(null); // Track which branchId we've fetched for

  useEffect(() => {
    // Prevent duplicate session restoration calls
    if (sessionRestored || hasRestoredSession.current) {
      return;
    }

    const restoreSession = async () => {
      // Mark as started to prevent duplicate calls
      hasRestoredSession.current = true;
      
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
                
                // Fetch class name and section
                try {
                  const classResult = await fetchClass(classIdToSet).unwrap();
                  if (classResult) {
                    dispatch(setClassInfo({
                      className: classResult.class_Name,
                      section: classResult.section,
                    }));
                  }
                } catch (classInfoErr) {
                  console.error("Error fetching class info during session restoration:", classInfoErr);
                }
              }
            } catch (classErr) {
              console.error("Error fetching classId during session restoration:", classErr);
            }
          }

          // Fetch profile based on role (RTK Query will cache it, no need to store in Redux)
          if (userRole) {
            try {
              await fetchProfile({ userId: session.user.id, role: userRole });
            } catch (profileErr) {
              console.error("Error fetching profile during session restoration:", profileErr);
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

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, sessionRestored]);

  // Separate effect to fetch active session when branchId changes for principal/coordinator
  useEffect(() => {
    // Prevent duplicate session fetches for the same branchId
    if (!sessionRestored || !user || !branchId || hasFetchedActiveSession.current === branchId) {
      return;
    }

    const fetchActiveSessionData = async () => {
      // Only fetch for principal and coordinator roles, skip admin and owner
      const userRole = user?.role;
      if (!userRole || userRole === 'admin' || userRole === 'owner') {
        return;
      }

      // Only fetch if user is principal or coordinator and has branchId
      if ((userRole === 'principal' || userRole === 'coordinator') && branchId) {
        // Mark as fetched for this branchId to prevent duplicate calls
        hasFetchedActiveSession.current = branchId;
        
        try {
          // Use RTK Query for proper caching and deduplication
          const result = await fetchActiveSession(branchId).unwrap();
          
          if (result && result.length > 0) {
            dispatch(setSessionId(result[0].id));
          }
        } catch (sessionErr) {
          console.error('Error fetching active session:', sessionErr);
        }
      }
    };

    fetchActiveSessionData();
  }, [dispatch, sessionRestored, user, branchId, fetchActiveSession]);

  // Fetch class name and section when classId is available (if not already fetched)
  useEffect(() => {
    const fetchClassInfo = async () => {
      // Only fetch if we have classId, session is restored, but don't have className yet
      if (classId && sessionRestored && !className) {
        try {
          const classResult = await fetchClass(classId).unwrap();
          if (classResult) {
            dispatch(setClassInfo({
              className: classResult.class_Name,
              section: classResult.section,
            }));
          }
        } catch (classInfoErr) {
          console.error("Error fetching class info:", classInfoErr);
        }
      }
    };

    if (classId && sessionRestored && !className) {
      fetchClassInfo();
    }
  }, [dispatch, classId, sessionRestored, className, fetchClass]);

  return { sessionRestored, user };
};
