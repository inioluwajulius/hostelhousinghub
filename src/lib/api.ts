import { supabase } from "@/integrations/supabase/client";

// ============= PROPERTIES =============
export const propertiesAPI = {
  async getProperties(filters?: {
    universityId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    genderRestriction?: string;
    amenities?: string[];
    maxDistance?: number;
  }) {
    let query = supabase
      .from("properties")
      .select(`
        *,
        universities(id, name, short_name, latitude, longitude),
        rooms(id, room_type, price_per_session, price_per_month, available_count, photos),
        reviews(id, rating, comment, reviewer_id),
        host:profiles(id, full_name, profile_photo_url)
      `)
      .eq("is_active", true);

    if (filters?.universityId) query = query.eq("university_id", filters.universityId);
    if (filters?.propertyType) query = query.eq("property_type", filters.propertyType);
    if (filters?.genderRestriction) query = query.eq("gender_restriction", filters.genderRestriction);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Post-process filtering in client (for complex filters)
    let filtered = data || [];

    if (filters?.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((p: any) =>
        filters.amenities!.every((a) => (p.amenities || []).includes(a))
      );
    }

    if (filters?.minPrice || filters?.maxPrice) {
      filtered = filtered.filter((p: any) => {
        const prices = (p.rooms || [])
          .map((r: any) => r.price_per_session)
          .filter((v: number) => v > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const min = filters.minPrice || 0;
        const max = filters.maxPrice || Infinity;
        return minPrice >= min && minPrice <= max;
      });
    }

    if (filters?.maxDistance) {
      filtered = filtered.filter(
        (p: any) => !p.distance_to_gate_meters || p.distance_to_gate_meters <= filters.maxDistance
      );
    }

    // Enrich with computed fields
    return filtered.map((p: any) => {
      const ratings = (p.reviews || []).map((r: any) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      const prices = (p.rooms || []).map((r: any) => r.price_per_session).filter((v: number) => v > 0);
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const totalAvailable = (p.rooms || []).reduce((sum: number, r: any) => sum + (r.available_count || 0), 0);
      return { ...p, avgRating, reviewCount: ratings.length, lowestPrice, totalAvailable };
    });
  },

  async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        universities(id, name, short_name, latitude, longitude),
        rooms(id, room_type, price_per_session, price_per_month, available_count, photos, amenities),
        reviews(id, rating, comment, reviewer_id, created_at, reviewer:profiles(full_name, profile_photo_url)),
        host:profiles(id, full_name, phone, profile_photo_url, is_verified)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Enrich
    const ratings = (data.reviews || []).map((r: any) => r.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
    const prices = (data.rooms || []).map((r: any) => r.price_per_session).filter((v: number) => v > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return { ...data, avgRating, reviewCount: ratings.length, lowestPrice };
  },

  async createProperty(hostId: string, propertyData: any) {
    const { data, error } = await supabase
      .from("properties")
      .insert([
        {
          host_id: hostId,
          ...propertyData,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProperty(id: string, updates: any) {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProperty(id: string) {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============= ROOMS =============
export const roomsAPI = {
  async createRoom(propertyId: string, roomData: any) {
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ property_id: propertyId, ...roomData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRoom(id: string, updates: any) {
    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRoom(id: string) {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============= BOOKINGS =============
export const bookingsAPI = {
  async createBooking(studentId: string, bookingData: any) {
    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          student_id: studentId,
          ...bookingData,
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBookingsByStudent(studentId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(*, property:properties(*)),
        property:properties(id, title, address)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBookingsByHost(hostId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        student:profiles(id, full_name, phone, profile_photo_url),
        room:rooms(*, property:properties(*)),
        property:properties(id, title, host_id)
      `)
      .eq("property.host_id", hostId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateBookingStatus(id: string, status: "APPROVED" | "DECLINED" | "COMPLETED" | "PENDING") {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBookingById(id: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        student:profiles(*),
        room:rooms(*),
        property:properties(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= REVIEWS =============
export const reviewsAPI = {
  async createReview(bookingId: string, userId: string, reviewData: any) {
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          booking_id: bookingId,
          reviewer_id: userId,
          ...reviewData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPropertyReviews(propertyId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles(id, full_name, profile_photo_url)
      `)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateReview(id: string, updates: any) {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReview(id: string) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============= MESSAGES =============
export const messagesAPI = {
  async sendMessage(senderId: string, receiverId: string, content: string, bookingId?: string) {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          booking_id: bookingId,
          created_at: new Date().toISOString(),
          read_at: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getConversation(userId1: string, userId2: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(id, full_name, profile_photo_url),
        receiver:profiles(id, full_name, profile_photo_url)
      `)
      .or(
        `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
      )
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(id, full_name, profile_photo_url),
        receiver:profiles(id, full_name, profile_photo_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by conversation partner
    const conversations: Record<string, any> = {};
    (data || []).forEach((msg: any) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partner: msg.sender_id === userId ? msg.receiver : msg.sender,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: msg.read_at ? 0 : msg.receiver_id === userId ? 1 : 0,
        };
      } else {
        if (!msg.read_at && msg.receiver_id === userId) {
          conversations[partnerId].unreadCount++;
        }
      }
    });

    return Object.values(conversations);
  },

  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= INSPECTIONS =============
export const inspectionsAPI = {
  async scheduleInspection(studentId: string, propertyId: string, scheduledAt: string) {
    const { data, error } = await supabase
      .from("inspections")
      .insert([
        {
          student_id: studentId,
          property_id: propertyId,
          scheduled_at: scheduledAt,
          status: "SCHEDULED",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStudentInspections(studentId: string) {
    const { data, error } = await supabase
      .from("inspections")
      .select(`
        *,
        property:properties(id, title, address, host_id),
        host:profiles(id, full_name, phone)
      `)
      .eq("student_id", studentId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPropertyInspections(propertyId: string) {
    const { data, error } = await supabase
      .from("inspections")
      .select(`
        *,
        student:profiles(id, full_name, phone, profile_photo_url)
      `)
      .eq("property_id", propertyId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateInspectionStatus(id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") {
    const { data, error } = await supabase
      .from("inspections")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= SAVED LISTINGS =============
export const savedListingsAPI = {
  async saveListing(userId: string, propertyId: string) {
    const { data, error } = await supabase
      .from("saved_listings")
      .insert([{ user_id: userId, property_id: propertyId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unsaveListing(userId: string, propertyId: string) {
    const { error } = await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", propertyId);

    if (error) throw error;
  },

  async getSavedListings(userId: string) {
    const { data, error } = await supabase
      .from("saved_listings")
      .select(`
        property:properties(
          *,
          universities(id, name, short_name),
          rooms(id, room_type, price_per_session, price_per_month, available_count),
          reviews(rating)
        )
      `)
      .eq("user_id", userId);

    if (error) throw error;

    return (data || []).map((sl: any) => {
      const p = sl.property;
      const ratings = (p.reviews || []).map((r: any) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      const prices = (p.rooms || []).map((r: any) => r.price_per_session).filter((v: number) => v > 0);
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return { ...p, avgRating, reviewCount: ratings.length, lowestPrice };
    });
  },

  async isListed(userId: string, propertyId: string) {
    const { data, error } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .single();

    return !!data && !error;
  },
};

// ============= NOTIFICATIONS =============
export const notificationsAPI = {
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createNotification(userId: string, type: string, message: string, relatedId?: string) {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          type,
          message,
          related_id: relatedId,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= PROFILES =============
export const profilesAPI = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, universities(id, name, short_name)")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async verifyStudent(userId: string, matricNumber: string) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_student_verified: true, matric_number: matricNumber })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= UNIVERSITIES =============
export const universitiesAPI = {
  async getUniversities() {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUniversityById(id: string) {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= USER ROLES =============
export const userRolesAPI = {
  async assignRole(userId: string, role: "student" | "host" | "admin") {
    const { data, error } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeRole(userId: string, role: string) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw error;
  },

  async getUserRoles(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((r: any) => r.role);
  },
};

// ============= MATRIC VERIFICATION =============
export const matricVerificationAPI = {
  async submitMatricVerification(userId: string, universityId: string, matricNumber: string, matricPhotoUrl: string) {
    const { data, error } = await supabase
      .from("matric_verifications")
      .insert([
        {
          user_id: userId,
          university_id: universityId,
          matric_number: matricNumber,
          matric_photo_url: matricPhotoUrl,
          status: "PENDING",
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMatricVerificationStatus(userId: string) {
    const { data, error } = await supabase
      .from("matric_verifications")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Not found
    }
    if (error) throw error;
    return data;
  },

  async approveMatricVerification(verificationId: string, adminId: string) {
    const { data, error } = await supabase
      .from("matric_verifications")
      .update({
        status: "APPROVED",
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq("id", verificationId)
      .select()
      .single();

    if (error) throw error;

    // Update profile to mark as verified
    if (data && data.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user_id)
        .single();

      if (!profileError) {
        await supabase
          .from("profiles")
          .update({ is_verified: true })
          .eq("id", data.user_id);
      }
    }

    return data;
  },

  async rejectMatricVerification(verificationId: string, adminId: string, rejectionReason: string) {
    const { data, error } = await supabase
      .from("matric_verifications")
      .update({
        status: "REJECTED",
        verified_at: new Date().toISOString(),
        verified_by: adminId,
        rejection_reason: rejectionReason,
      })
      .eq("id", verificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingVerifications(universityId?: string) {
    let query = supabase
      .from("matric_verifications")
      .select(`
        *,
        user:profiles(id, full_name, profile_photo_url, email),
        university:universities(id, name, short_name)
      `)
      .eq("status", "PENDING");

    if (universityId) {
      query = query.eq("university_id", universityId);
    }

    const { data, error } = await query.order("submitted_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async isStudentVerified(userId: string) {
    const { data, error } = await supabase
      .from("matric_verifications")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "APPROVED")
      .single();

    if (error && error.code === "PGRST116") {
      return false; // Not found
    }
    if (error) throw error;
    return !!data;
  },
};

// ============= PASSWORD RESET =============
export const passwordResetAPI = {
  async requestPasswordReset(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  async verifyResetToken(token: string) {
    // This will be called when user arrives with token in URL
    // The token is already verified by Supabase if it's valid
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (error) throw error;
      return !!data.user;
    } catch (err) {
      return false;
    }
  },
};

// ============= PHOTO UPLOAD =============
export const photoUploadAPI = {
  async uploadPropertyPhoto(propertyId: string, file: File): Promise<string> {
    const fileName = `${propertyId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("property-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("property-photos")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  },

  async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // Replace if exists
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  },

  async uploadMatricPhoto(userId: string, file: File): Promise<string> {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("matric-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("matric-photos")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  },

  async deletePhoto(bucket: string, filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  },

  async deletePropertyPhoto(photoPath: string): Promise<void> {
    await this.deletePhoto("property-photos", photoPath);
  },

  async deleteProfilePhoto(photoPath: string): Promise<void> {
    await this.deletePhoto("profile-photos", photoPath);
  },

  async deleteMatricPhoto(photoPath: string): Promise<void> {
    await this.deletePhoto("matric-photos", photoPath);
  },

  async uploadMultiplePropertyPhotos(propertyId: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadPropertyPhoto(propertyId, file)
    );

    return Promise.all(uploadPromises);
  },
};

// ============= BOOKING AVAILABILITY =============
export const availabilityAPI = {
  async setPropertyAvailability(propertyId: string, roomId: string, availableCount: number) {
    const { data, error } = await supabase
      .from("rooms")
      .update({ available_count: availableCount })
      .eq("id", roomId)
      .eq("property_id", propertyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPropertyAvailability(propertyId: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_type, available_count, price_per_month, price_per_session")
      .eq("property_id", propertyId);

    if (error) throw error;
    return data || [];
  },

  async blockDates(propertyId: string, startDate: string, endDate: string, reason: string) {
    const { data, error } = await supabase
      .from("blocked_dates")
      .insert([
        {
          property_id: propertyId,
          start_date: startDate,
          end_date: endDate,
          reason,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBlockedDates(propertyId: string) {
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("property_id", propertyId)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async unblockDates(blockedDateId: string) {
    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("id", blockedDateId);

    if (error) throw error;
  },

  async getAvailableRoomsOnDate(propertyId: string, date: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("property_id", propertyId)
      .gt("available_count", 0);

    if (error) throw error;

    // Check if date is blocked
    const blockedData = await this.getBlockedDates(propertyId);
    const isBlocked = blockedData.some((block: any) => {
      return date >= block.start_date && date <= block.end_date;
    });

    return {
      rooms: isBlocked ? [] : (data || []),
      isBlocked,
    };
  },

  async getCalendarData(propertyId: string, month: number, year: number) {
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const blockedDates = await this.getBlockedDates(propertyId);

    // Create calendar object with availability info
    const calendar = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split("T")[0];
      const isBlocked = blockedDates.some((block: any) => {
        return dateStr >= block.start_date && dateStr <= block.end_date;
      });

      (calendar as any)[dateStr] = {
        available: !isBlocked,
        blocked: isBlocked,
      };
    }

    return { calendar, blockedDates };
  },
};

// ============= ANALYTICS & EARNINGS =============
export const analyticsAPI = {
  async getHostEarnings(hostId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from("bookings")
      .select("amount, status, created_at, property:properties(id, title)")
      .eq("host_id", hostId)
      .eq("status", "COMPLETED");

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const total = (data || []).reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
    return {
      total,
      transactions: data || [],
      count: (data || []).length,
    };
  },

  async getPropertyAnalytics(propertyId: string) {
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("status, amount, created_at")
      .eq("property_id", propertyId);

    if (bookingsError) throw bookingsError;

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating, created_at")
      .eq("property_id", propertyId);

    if (reviewsError) throw reviewsError;

    // Calculate metrics
    const totalBookings = (bookings || []).length;
    const completedBookings = (bookings || []).filter((b: any) => b.status === "COMPLETED").length;
    const totalEarnings = (bookings || [])
      .filter((b: any) => b.status === "COMPLETED")
      .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    const avgRating =
      (reviews || []).length > 0
        ? (reviews || []).reduce((sum: number, r: any) => sum + r.rating, 0) / (reviews || []).length
        : 0;

    // Bookings per month
    const bookingsByMonth: { [key: string]: number } = {};
    (bookings || []).forEach((b: any) => {
      const month = new Date(b.created_at).toISOString().substring(0, 7);
      bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
    });

    return {
      totalBookings,
      completedBookings,
      totalEarnings,
      avgRating,
      reviewCount: (reviews || []).length,
      bookingsByMonth,
      recentBookings: bookings || [],
    };
  },

  async getHostDashboard(hostId: string) {
    const { data: properties, error: propsError } = await supabase
      .from("properties")
      .select("id, title, is_active")
      .eq("host_id", hostId);

    if (propsError) throw propsError;

    // Get earnings for all properties
    const earnings = await this.getHostEarnings(hostId);

    // Get analytics for each property
    const propertyAnalytics = await Promise.all(
      (properties || []).map((p: any) => this.getPropertyAnalytics(p.id))
    );

    return {
      properties: properties || [],
      totalEarnings: earnings.total,
      earnings,
      propertyAnalytics,
      activeProperties: (properties || []).filter((p: any) => p.is_active).length,
      totalProperties: (properties || []).length,
    };
  },

  async getMonthlyRevenue(hostId: string, months: number = 12) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from("bookings")
      .select("amount, created_at")
      .eq("host_id", hostId)
      .eq("status", "COMPLETED")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) throw error;

    const revenueByMonth: { [key: string]: number } = {};
    (data || []).forEach((b: any) => {
      const month = new Date(b.created_at).toISOString().substring(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (b.amount || 0);
    });

    return revenueByMonth;
  },

  async getBookingMetrics(hostId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select("status")
      .eq("host_id", hostId);

    if (error) throw error;

    const metrics = {
      total: (data || []).length,
      pending: (data || []).filter((b: any) => b.status === "PENDING").length,
      confirmed: (data || []).filter((b: any) => b.status === "CONFIRMED").length,
      completed: (data || []).filter((b: any) => b.status === "COMPLETED").length,
      cancelled: (data || []).filter((b: any) => b.status === "CANCELLED").length,
    };

    return metrics;
  },
};

// ============= ROOMMATE FINDER =============
export const roommateFinderAPI = {
  async createRoommateProfile(userId: string, profileData: {
    bio: string;
    genderPreference?: string;
    budgetRange?: { min: number; max: number };
    university?: string;
    interests?: string[];
    sleepSchedule?: "early" | "normal" | "late";
    cleanlinessLevel?: "low" | "medium" | "high";
    smokingAllowed?: boolean;
  }) {
    const { data, error } = await supabase
      .from("roommate_profiles")
      .insert([
        {
          user_id: userId,
          bio: profileData.bio,
          gender_preference: profileData.genderPreference,
          budget_min: profileData.budgetRange?.min,
          budget_max: profileData.budgetRange?.max,
          university: profileData.university,
          interests: profileData.interests,
          sleep_schedule: profileData.sleepSchedule,
          cleanliness_level: profileData.cleanlinessLevel,
          smoking_allowed: profileData.smokingAllowed,
          active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRoommateProfile(userId: string) {
    const { data, error } = await supabase
      .from("roommate_profiles")
      .select(`
        *,
        user:profiles(id, full_name, profile_photo_url, university_id)
      `)
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Not found
    }
    if (error) throw error;
    return data;
  },

  async searchRoommates(filters?: {
    genderPreference?: string;
    budgetMin?: number;
    budgetMax?: number;
    university?: string;
    cleanlinessLevel?: string;
    sleepSchedule?: string;
  }) {
    let query = supabase
      .from("roommate_profiles")
      .select(`
        *,
        user:profiles(id, full_name, profile_photo_url, email)
      `)
      .eq("active", true);

    if (filters?.genderPreference) query = query.eq("gender_preference", filters.genderPreference);
    if (filters?.budgetMin) query = query.gte("budget_max", filters.budgetMin);
    if (filters?.budgetMax) query = query.lte("budget_min", filters.budgetMax);
    if (filters?.university) query = query.eq("university", filters.university);
    if (filters?.cleanlinessLevel) query = query.eq("cleanliness_level", filters.cleanlinessLevel);
    if (filters?.sleepSchedule) query = query.eq("sleep_schedule", filters.sleepSchedule);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async sendRoommateRequest(senderId: string, recipientId: string, message?: string) {
    const { data, error } = await supabase
      .from("roommate_requests")
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          message,
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRoommateRequests(userId: string) {
    const { data, error } = await supabase
      .from("roommate_requests")
      .select(`
        *,
        sender:profiles(id, full_name, profile_photo_url),
        senderProfile:roommate_profiles(bio, interests)
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async acceptRoommateRequest(requestId: string) {
    const { data, error } = await supabase
      .from("roommate_requests")
      .update({ status: "ACCEPTED" })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectRoommateRequest(requestId: string) {
    const { data, error } = await supabase
      .from("roommate_requests")
      .update({ status: "REJECTED" })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAcceptedMatches(userId: string) {
    const { data, error } = await supabase
      .from("roommate_requests")
      .select(`
        *,
        sender:profiles(id, full_name, profile_photo_url, email),
        senderProfile:roommate_profiles(bio, interests, cleanliness_level)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "ACCEPTED");

    if (error) throw error;
    return data || [];
  },

  async updateRoommateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from("roommate_profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= ENHANCED NOTIFICATIONS =============
export const enhancedNotificationsAPI = {
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  },

  async getNotificationsWithDetails(userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
  },

  async subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    const subscription = supabase
      .from(`notifications:user_id=eq.${userId}`)
      .on("INSERT", (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return subscription;
  },
};

// ============= COMMUNITY VERIFICATION =============
export const communityVerificationAPI = {
  async upvoteProperty(propertyId: string, userId: string) {
    // Check if already upvoted
    const { data: existing, error: checkError } = await supabase
      .from("property_votes")
      .select("id")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .eq("vote_type", "upvote")
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;
    if (existing) return { error: "Already upvoted" };

    // Remove downvote if exists
    await supabase
      .from("property_votes")
      .delete()
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .eq("vote_type", "downvote");

    // Add upvote
    const { data, error } = await supabase
      .from("property_votes")
      .insert([
        {
          property_id: propertyId,
          user_id: userId,
          vote_type: "upvote",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async downvoteProperty(propertyId: string, userId: string) {
    // Check if already downvoted
    const { data: existing, error: checkError } = await supabase
      .from("property_votes")
      .select("id")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .eq("vote_type", "downvote")
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;
    if (existing) return { error: "Already downvoted" };

    // Remove upvote if exists
    await supabase
      .from("property_votes")
      .delete()
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .eq("vote_type", "upvote");

    // Add downvote
    const { data, error } = await supabase
      .from("property_votes")
      .insert([
        {
          property_id: propertyId,
          user_id: userId,
          vote_type: "downvote",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async flagProperty(propertyId: string, userId: string, reason: string, description?: string) {
    const { data, error } = await supabase
      .from("property_flags")
      .insert([
        {
          property_id: propertyId,
          reported_by: userId,
          reason,
          description,
          status: "REPORTED",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPropertyVotes(propertyId: string) {
    const { data, error } = await supabase
      .from("property_votes")
      .select("vote_type")
      .eq("property_id", propertyId);

    if (error) throw error;

    const votes = data || [];
    const upvotes = votes.filter((v: any) => v.vote_type === "upvote").length;
    const downvotes = votes.filter((v: any) => v.vote_type === "downvote").length;

    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      totalVotes: upvotes + downvotes,
    };
  },

  async getUserVote(propertyId: string, userId: string) {
    const { data, error } = await supabase
      .from("property_votes")
      .select("vote_type")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Not found
    }
    if (error) throw error;
    return data?.vote_type || null;
  },

  async getPropertyFlags(propertyId: string) {
    const { data, error } = await supabase
      .from("property_flags")
      .select(`
        *,
        reporter:profiles(full_name, profile_photo_url)
      `)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async resolveFlag(flagId: string, adminId: string, resolution: string) {
    const { data, error } = await supabase
      .from("property_flags")
      .update({
        status: "RESOLVED",
        resolution,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", flagId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCommunityScore(propertyId: string) {
    const [votes, flags] = await Promise.all([
      this.getPropertyVotes(propertyId),
      this.getPropertyFlags(propertyId),
    ]);

    const unsolvedFlags = flags.filter((f: any) => f.status !== "RESOLVED").length;
    const trustScore = Math.max(
      0,
      100 - unsolvedFlags * 10 + (votes.score > 0 ? Math.min(20, votes.upvotes) : 0)
    );

    return {
      trustScore: Math.min(100, trustScore),
      votes,
      flagCount: unsolvedFlags,
      isSuspicious: unsolvedFlags > 2,
    };
  },
};

// ============= PAYMENT WEBHOOKS =============
export const paymentWebhookAPI = {
  async handlePaymentSuccess(reference: string) {
    // Fetch booking by payment reference
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, student_id, property_id, host_id, amount")
      .eq("payment_reference", reference)
      .single();

    if (bookingError) {
      throw new Error("Booking not found for payment reference");
    }

    // Update booking status to CONFIRMED
    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "CONFIRMED",
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification for student
    await notificationsAPI.createNotification(
      booking.student_id,
      "payment",
      `Payment confirmed for booking at ${booking.property_id}. Your reservation is confirmed!`,
      booking.id
    );

    // Create notification for host
    await notificationsAPI.createNotification(
      booking.host_id,
      "booking",
      `Payment received! New booking confirmed. Amount: ₦${booking.amount?.toLocaleString()}`,
      booking.id
    );

    return updated;
  },

  async handlePaymentFailed(reference: string, reason: string) {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, student_id")
      .eq("payment_reference", reference)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!booking) return;

    // Update booking status to CANCELLED
    await supabase
      .from("bookings")
      .update({
        status: "CANCELLED",
      })
      .eq("id", booking.id);

    // Notify student
    await notificationsAPI.createNotification(
      booking.student_id,
      "payment",
      `Payment failed: ${reason}. Please try again or contact support.`,
      booking.id
    );
  },

  async getPaymentStatus(bookingId: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select("status, amount, paid_at, payment_reference")
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    return {
      bookingId,
      status: data.status,
      amount: data.amount,
      paidAt: data.paid_at,
      isPaid: data.status === "CONFIRMED" || !!data.paid_at,
      reference: data.payment_reference,
    };
  },

  async recordPaymentAttempt(bookingId: string, reference: string, amount: number) {
    const { data, error } = await supabase
      .from("payment_attempts")
      .insert([
        {
          booking_id: bookingId,
          reference,
          amount,
          status: "PENDING",
          attempted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentAttempt(attemptId: string, status: "SUCCESS" | "FAILED", details?: any) {
    const { data, error } = await supabase
      .from("payment_attempts")
      .update({
        status,
        response: details,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentHistory(bookingId: string) {
    const { data, error } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("booking_id", bookingId)
      .order("attempted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async generateWebhookSignature(payload: any, secret: string): Promise<string> {
    // This would use crypto to generate HMAC
    // For now, returning a placeholder
    return btoa(JSON.stringify(payload));
  },

  async verifyWebhookSignature(payload: any, signature: string, secret: string): Promise<boolean> {
    // Verify the webhook came from Paystack
    try {
      const expectedSignature = await this.generateWebhookSignature(payload, secret);
      return signature === expectedSignature;
    } catch (err) {
      return false;
    }
  },
};
