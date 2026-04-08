package com.royalquads.app.data.db.dao

import androidx.room.*
import com.royalquads.app.data.db.entity.*
import kotlinx.coroutines.flow.Flow

@Dao interface QuadDao {
    @Query("SELECT * FROM quads ORDER BY id ASC") fun observeAll(): Flow<List<QuadEntity>>
    @Query("SELECT * FROM quads ORDER BY id ASC") suspend fun getAll(): List<QuadEntity>
    @Query("SELECT * FROM quads WHERE id = :id") suspend fun getById(id: Int): QuadEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(q: QuadEntity): Long
    @Update suspend fun update(q: QuadEntity)
    @Query("UPDATE quads SET status = :status WHERE id = :id") suspend fun setStatus(id: Int, status: String)
    @Query("DELETE FROM quads WHERE id = :id") suspend fun delete(id: Int)
}

@Dao interface BookingDao {
    @Query("SELECT * FROM bookings WHERE status = 'ACTIVE' ORDER BY startTime DESC") fun observeActive(): Flow<List<BookingEntity>>
    @Query("SELECT * FROM bookings WHERE status = 'ACTIVE' ORDER BY startTime DESC") suspend fun getActive(): List<BookingEntity>
    @Query("SELECT * FROM bookings WHERE status = 'COMPLETED' ORDER BY endTime DESC") suspend fun getCompleted(): List<BookingEntity>
    @Query("SELECT * FROM bookings WHERE id = :id") suspend fun getById(id: Int): BookingEntity?
    @Query("SELECT * FROM bookings WHERE userId = :uid ORDER BY id DESC") suspend fun getByUser(uid: Int): List<BookingEntity>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(b: BookingEntity): Long
    @Update suspend fun update(b: BookingEntity)
    @Query("UPDATE bookings SET status='COMPLETED', endTime=:end, overtimeMinutes=:ot, overtimeCharge=:charge WHERE id=:id") suspend fun complete(id: Int, end: Long, ot: Int, charge: Int)
    @Query("UPDATE bookings SET waiverSigned=1, waiverSignedAt=:t WHERE id=:id") suspend fun signWaiver(id: Int, t: Long)
    @Query("UPDATE bookings SET rating=:r, feedback=:f WHERE id=:id") suspend fun submitFeedback(id: Int, r: Int, f: String)
    @Query("UPDATE bookings SET depositReturned=1 WHERE id=:id") suspend fun returnDeposit(id: Int)
    @Query("UPDATE bookings SET guidePaid = CASE WHEN guidePaid=0 THEN 1 ELSE 0 END WHERE id=:id") suspend fun toggleGuidePaid(id: Int)
    @Query("UPDATE bookings SET duration=duration+:mins, price=price+:amt WHERE id=:id") suspend fun extend(id: Int, mins: Int, amt: Int)
    @Query("UPDATE bookings SET mpesaRef=:ref WHERE id=:id") suspend fun updateMpesa(id: Int, ref: String)
    @Query("UPDATE bookings SET startTime=:t WHERE id=:id") suspend fun updateStartTime(id: Int, t: Long)
}

@Dao interface UserDao {
    @Query("SELECT * FROM users") suspend fun getAll(): List<UserEntity>
    @Query("SELECT * FROM users WHERE phone = :phone LIMIT 1") suspend fun getByPhone(phone: String): UserEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(u: UserEntity): Long
}

@Dao interface PromotionDao {
    @Query("SELECT * FROM promotions ORDER BY id DESC") fun observeAll(): Flow<List<PromotionEntity>>
    @Query("SELECT * FROM promotions WHERE code=:code AND isActive=1 LIMIT 1") suspend fun findActive(code: String): PromotionEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(p: PromotionEntity): Long
    @Query("UPDATE promotions SET isActive=:a WHERE id=:id") suspend fun setActive(id: Int, a: Int)
    @Query("DELETE FROM promotions WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface PackageDao {
    @Query("SELECT * FROM packages ORDER BY id ASC") fun observeAll(): Flow<List<PackageEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(p: PackageEntity): Long
    @Query("UPDATE packages SET isActive=:a WHERE id=:id") suspend fun setActive(id: Int, a: Int)
    @Query("DELETE FROM packages WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface MaintenanceDao {
    @Query("SELECT * FROM maintenance_logs ORDER BY date DESC") fun observeAll(): Flow<List<MaintenanceLogEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(m: MaintenanceLogEntity): Long
    @Query("DELETE FROM maintenance_logs WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface DamageDao {
    @Query("SELECT * FROM damage_reports ORDER BY date DESC") fun observeAll(): Flow<List<DamageReportEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(d: DamageReportEntity): Long
    @Query("UPDATE damage_reports SET resolved=1 WHERE id=:id") suspend fun resolve(id: Int)
    @Query("DELETE FROM damage_reports WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface StaffDao {
    @Query("SELECT * FROM staff ORDER BY name ASC") fun observeAll(): Flow<List<StaffEntity>>
    @Query("SELECT * FROM staff ORDER BY name ASC") suspend fun getAll(): List<StaffEntity>
    @Query("SELECT * FROM staff WHERE id=:id") suspend fun getById(id: Int): StaffEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(s: StaffEntity): Long
    @Update suspend fun update(s: StaffEntity)
    @Query("DELETE FROM staff WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface ShiftDao {
    @Query("SELECT * FROM shifts ORDER BY startTime DESC") fun observeAll(): Flow<List<ShiftEntity>>
    @Query("SELECT * FROM shifts WHERE staffId=:sid AND endTime IS NULL LIMIT 1") suspend fun getActiveShift(sid: Int): ShiftEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(s: ShiftEntity): Long
    @Query("UPDATE shifts SET endTime=:end, notes=:notes WHERE id=:id") suspend fun clockOut(id: Int, end: Long, notes: String)
}

@Dao interface WaitlistDao {
    @Query("SELECT * FROM waitlist ORDER BY addedAt ASC") fun observeAll(): Flow<List<WaitlistEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(w: WaitlistEntity): Long
    @Query("UPDATE waitlist SET notified=1 WHERE id=:id") suspend fun notify(id: Int)
    @Query("DELETE FROM waitlist WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface PrebookingDao {
    @Query("SELECT * FROM prebookings ORDER BY scheduledFor ASC") fun observeAll(): Flow<List<PrebookingEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(p: PrebookingEntity): Long
    @Query("UPDATE prebookings SET status=:s WHERE id=:id") suspend fun setStatus(id: Int, s: String)
}

@Dao interface IncidentDao {
    @Query("SELECT * FROM incidents ORDER BY date DESC") fun observeAll(): Flow<List<IncidentEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(i: IncidentEntity): Long
    @Query("DELETE FROM incidents WHERE id=:id") suspend fun delete(id: Int)
}

@Dao interface LoyaltyDao {
    @Query("SELECT * FROM loyalty WHERE phone=:phone") suspend fun get(phone: String): LoyaltyEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(l: LoyaltyEntity)
}

@Dao interface DynamicPricingDao {
    @Query("SELECT * FROM dynamic_pricing ORDER BY id ASC") fun observeAll(): Flow<List<DynamicPricingEntity>>
    @Query("SELECT * FROM dynamic_pricing ORDER BY id ASC") suspend fun getAll(): List<DynamicPricingEntity>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertAll(rules: List<DynamicPricingEntity>)
    @Update suspend fun update(r: DynamicPricingEntity)
    @Query("DELETE FROM dynamic_pricing") suspend fun clear()
}
