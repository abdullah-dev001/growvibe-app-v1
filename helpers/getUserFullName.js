import { supabase } from '../supabaseClient';

/**
 * Get user's full name from profile tables based on their auth ID
 * @param {string} userId - The user's auth ID
 * @param {string} role - Optional role to directly query the correct profile table (admin, owner, coordinator, principal, teacher, student)
 * @returns {Promise<string>} - Returns the user's full name or "Someone" if not found
 */
export async function getUserFullName(userId, role = null) {
  if (!userId) return "Someone";

  try {
    // If role is provided, query only that specific table for better performance
    if (role) {
      const roleToTableMap = {
        'admin': 'admin_profile',
        'owner': 'owner_profile',
        'coordinator': 'coordinator_profile',
        'principal': 'principal_profile',
        'teacher': 'teacher_profile',
        'student': 'student_profile',
      };

      const tableName = roleToTableMap[role?.toLowerCase()];
      
      if (tableName) {
        const { data, error } = await supabase
          .from(tableName)
          .select('full_Name')
          .eq('auth_Id', userId)
          .maybeSingle();

        if (!error && data?.full_Name) {
          return data.full_Name;
        }
      }
    }

    // If role not provided or not found in specific table, try all profile tables
    const profileTables = [
      'admin_profile',
      'owner_profile',
      'coordinator_profile',
      'principal_profile',
      'teacher_profile',
      'student_profile',
    ];

    for (const table of profileTables) {
      const { data, error } = await supabase
        .from(table)
        .select('full_Name')
        .eq('auth_Id', userId)
        .maybeSingle();

      if (!error && data?.full_Name) {
        return data.full_Name;
      }
    }

    return "Someone";
  } catch (error) {
    console.log('Error fetching user name:', error);
    return "Someone";
  }
}

