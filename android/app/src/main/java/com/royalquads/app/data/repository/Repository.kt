package com.royalquads.app.data.repository

import com.royalquads.app.data.db.AppDatabase
import com.royalquads.app.data.db.entity.*
import com.royalquads.app.domain.model.*
import dagger.hilt.android.scopes.ViewModelScoped
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.util.Calendar
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.roundToInt

// ── Mappers ───────────────────────────────────────────────────────────────────
fun QuadEntity.toDomain() = Quad(id, name, QuadStatus.valueOf(status), imageUrl, imei)
fun Quad.toEntity() = QuadEntity(id, name, status.name, imageUrl, imei)
fun BookingEntity.toDomain() = Booking(id, quadId, userId, customerName, customerPhone, duration, price, originalPrice, promoCode, startTime, endTime, BookingStatus.valueOf(status), receiptId, rating, feedback, quadName, quadImageUrl, isPrebooked == 1, groupSize, idPhotoUri, waiverSigned == 1, waiverSignedAt, overtimeMinutes, overtimeCharge, depositAmount, depositReturned == 1, mpesaRef, operatorId, guideName, guidePaid == 1)
fun StaffEntity.toDomain() = Staff(id, name, phone, pin, StaffRole.valueOf(role), isActive == 1)
fun PromotionEntity.toDomain() = Promotion(id, code, discountPercentage, isActive == 1)
fun PackageEntity.toDomain() = Package(id, name, description, rides, price, isActive == 1)
fun MaintenanceLogEntity.toDomain() = MaintenanceLog(id, quadId, quadName, MaintenanceType.valueOf(type), description, cost, date, operatorName)
fun DamageReportEntity.toDomain() = DamageReport(id, quadId, quadName, bookingId, customerName, description, photoUri, DamageSeverity.valueOf(severity), repairCost, resolved == 1, date)
fun ShiftEntity.toDomain() = Shift(id, staffId, staffName, startTime, endTime, notes)
fun WaitlistEntity.toDomain() = WaitlistEntry(id, customerName, customerPhone, duration, addedAt, notified == 1)
fun PrebookingEntity.toDomain() = Prebooking(id, quadId, quadName, customerName, customerPhone, duration, price, scheduledFor, PrebookStatus.valueOf(status), createdAt, mpesaRef, notes)
fun IncidentEntity.toDomain() = IncidentReport(id, bookingId, quadName, customerName, IncidentType.valueOf(type), description, date, reportedBy)
fun LoyaltyEntity.toDomain() = LoyaltyAccount(phone, points, totalEarned, totalRides)
fun DynamicPricingEntity.toDomain() = DynamicPricingRule(id, label, startHour, endHour, multiplier, active == 1)

fun normPhone(p: String) = p.replace(Regex("[\\s\\-().]+"), "").let { if (it.startsWith("0")) "254${it.substring(1)}" else it }
fun receiptId() = "RQ-" + System.currentTimeMillis().toString(36).uppercase().takeLast(6)

@Singleton
class RoyalQuadRepository @Inject constructor(private val db: AppDatabase) {

    // ── Quads ──────────────────────────────────────────────────────────────────
    val quads: Flow<List<Quad>> = db.quadDao().observeAll().map { list ->
        val activeIds = db.bookingDao().getActive().map { it.quadId }.toSet()
        list.map { e -> if (e.status == "RENTED" && e.id !in activeIds) e.copy(status = "AVAILABLE") else e }.map { it.toDomain() }
    }
    suspend fun createQuad(name: String, imageUrl: String? = null, imei: String? = null): Quad = withContext(Dispatchers.IO) {
        require(name.isNotBlank()) { "Name is required" }
        val id = db.quadDao().insert(QuadEntity(name = name.trim(), imageUrl = imageUrl, imei = imei)).toInt()
        db.quadDao().getById(id)!!.toDomain()
    }
    suspend fun updateQuad(q: Quad) = withContext(Dispatchers.IO) { db.quadDao().update(q.toEntity()) }
    suspend fun setQuadStatus(id: Int, status: QuadStatus) = withContext(Dispatchers.IO) { db.quadDao().setStatus(id, status.name) }
    suspend fun deleteQuad(id: Int) = withContext(Dispatchers.IO) { db.quadDao().delete(id) }
    suspend fun getQuads() = withContext(Dispatchers.IO) { db.quadDao().getAll().map { it.toDomain() } }

    // ── Bookings ───────────────────────────────────────────────────────────────
    val activeBookings: Flow<List<Booking>> = db.bookingDao().observeActive().map { l -> l.map { it.toDomain() } }
    suspend fun getActive() = withContext(Dispatchers.IO) { db.bookingDao().getActive().map { it.toDomain() } }
    suspend fun getCompleted() = withContext(Dispatchers.IO) { db.bookingDao().getCompleted().map { it.toDomain() } }
    suspend fun getBookingById(id: Int) = withContext(Dispatchers.IO) { db.bookingDao().getById(id)?.toDomain() }
    suspend fun createBooking(quadId: Int, userId: Int?, customerName: String, customerPhone: String, duration: Int, price: Int, originalPrice: Int, promoCode: String? = null, isPrebooked: Boolean = false, groupSize: Int = 1, idPhotoUri: String? = null, waiverSigned: Boolean = false, depositAmount: Int = 0, mpesaRef: String? = null, operatorId: Int? = null, guideName: String? = null): Booking = withContext(Dispatchers.IO) {
        val quad = db.quadDao().getById(quadId) ?: error("Quad not found")
        require(quad.status == "AVAILABLE") { "Quad is not available" }
        val entity = BookingEntity(quadId = quadId, userId = userId, customerName = customerName.trim(), customerPhone = normPhone(customerPhone), duration = duration, price = price, originalPrice = originalPrice, promoCode = promoCode, receiptId = receiptId(), quadName = quad.name, quadImageUrl = quad.imageUrl, isPrebooked = if (isPrebooked) 1 else 0, groupSize = groupSize, idPhotoUri = idPhotoUri, waiverSigned = if (waiverSigned) 1 else 0, waiverSignedAt = if (waiverSigned) System.currentTimeMillis() else null, depositAmount = depositAmount, mpesaRef = mpesaRef?.trim()?.uppercase(), operatorId = operatorId, guideName = guideName?.trim()?.ifBlank { null })
        val id = db.bookingDao().insert(entity).toInt()
        db.quadDao().setStatus(quadId, "RENTED")
        db.bookingDao().getById(id)!!.toDomain()
    }
    suspend fun completeBooking(id: Int, overtimeMinutes: Int = 0) = withContext(Dispatchers.IO) {
        val b = db.bookingDao().getById(id) ?: return@withContext
        db.bookingDao().complete(id, System.currentTimeMillis(), overtimeMinutes, overtimeMinutes * OVERTIME_RATE)
        db.quadDao().setStatus(b.quadId, "AVAILABLE")
    }
    suspend fun signWaiver(id: Int) = withContext(Dispatchers.IO) { db.bookingDao().signWaiver(id, System.currentTimeMillis()) }
    suspend fun submitFeedback(id: Int, rating: Int, feedback: String) = withContext(Dispatchers.IO) { db.bookingDao().submitFeedback(id, rating, feedback) }
    suspend fun returnDeposit(id: Int) = withContext(Dispatchers.IO) { db.bookingDao().returnDeposit(id) }
    suspend fun toggleGuidePaid(id: Int) = withContext(Dispatchers.IO) { db.bookingDao().toggleGuidePaid(id) }
    suspend fun extendBooking(id: Int, addMins: Int, addPrice: Int) = withContext(Dispatchers.IO) { db.bookingDao().extend(id, addMins, addPrice) }
    suspend fun updateMpesa(id: Int, ref: String) = withContext(Dispatchers.IO) { db.bookingDao().updateMpesa(id, ref.trim().uppercase()) }
    suspend fun updateStartTime(id: Int, t: Long) = withContext(Dispatchers.IO) { db.bookingDao().updateStartTime(id, t) }

    // ── Analytics ─────────────────────────────────────────────────────────────
    suspend fun getSales() = withContext(Dispatchers.IO) {
        val done = getCompleted(); val now = System.currentTimeMillis()
        val todayStart = Calendar.getInstance().also { it.set(Calendar.HOUR_OF_DAY,0); it.set(Calendar.MINUTE,0); it.set(Calendar.SECOND,0) }.timeInMillis
        fun rev(b: Booking) = b.price + b.overtimeCharge
        SalesData(done.sumOf { rev(it) }, done.filter { (it.endTime ?: 0) >= todayStart }.sumOf { rev(it) }, done.filter { (it.endTime ?: 0) >= now - 7*86400_000L }.sumOf { rev(it) }, done.filter { (it.endTime ?: 0) >= now - 30*86400_000L }.sumOf { rev(it) }, done.sumOf { it.overtimeCharge })
    }
    suspend fun getRevenueChart() = withContext(Dispatchers.IO) {
        val done = getCompleted(); val result = mutableListOf<Triple<String,Int,Int>>()
        for (i in 6 downTo 0) {
            val cal = Calendar.getInstance().also { it.add(Calendar.DAY_OF_YEAR, -i) }
            val label = "${cal.getDisplayName(Calendar.MONTH, Calendar.SHORT, java.util.Locale.getDefault())} ${cal.get(Calendar.DAY_OF_MONTH)}"
            val dayStart = cal.also { it.set(Calendar.HOUR_OF_DAY,0); it.set(Calendar.MINUTE,0); it.set(Calendar.SECOND,0) }.timeInMillis
            val dayEnd = dayStart + 86400_000L
            val dayBookings = done.filter { (it.endTime ?: 0) in dayStart until dayEnd }
            result.add(Triple(label, dayBookings.sumOf { it.price + it.overtimeCharge }, dayBookings.size))
        }
        result
    }
    suspend fun getPeakHours() = withContext(Dispatchers.IO) {
        val done = getCompleted(); val hours = Array(24) { 0 }
        done.forEach { b -> val h = Calendar.getInstance().also { it.timeInMillis = b.startTime }.get(Calendar.HOUR_OF_DAY); hours[h]++ }
        hours.mapIndexed { h, c -> Pair(h, c) }
    }
    suspend fun getQuadUtilisation() = withContext(Dispatchers.IO) {
        val done = getCompleted(); val map = mutableMapOf<String, Triple<Int,Int,Int>>()
        done.forEach { b -> val (rides,rev,mins) = map.getOrDefault(b.quadName, Triple(0,0,0)); map[b.quadName] = Triple(rides+1, rev+b.price, mins+b.duration) }
        map.entries.sortedByDescending { it.value.second }.map { (name,v) -> listOf(name, v.first, v.second, v.third) }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    suspend fun login(phone: String, password: String): User? = withContext(Dispatchers.IO) {
        db.userDao().getByPhone(normPhone(phone))?.takeIf { it.password == password }?.let { User(it.id, it.name, it.phone, it.role, it.password) }
    }
    suspend fun register(name: String, phone: String, password: String): User = withContext(Dispatchers.IO) {
        require(name.isNotBlank()) { "Name required" }; require(password.length >= 4) { "Password must be 4+ chars" }
        val norm = normPhone(phone); require(norm.length >= 9) { "Invalid phone" }
        require(db.userDao().getByPhone(norm) == null) { "Phone already registered" }
        val id = db.userDao().insert(UserEntity(name = name.trim(), phone = norm, password = password)).toInt()
        User(id, name.trim(), norm, "user", password)
    }
    suspend fun getUserBookings(userId: Int) = withContext(Dispatchers.IO) { db.bookingDao().getByUser(userId).map { it.toDomain() } }

    // ── Promotions ────────────────────────────────────────────────────────────
    val promotions: Flow<List<Promotion>> = db.promotionDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun createPromotion(code: String, discount: Int): Promotion = withContext(Dispatchers.IO) {
        require(code.isNotBlank()) { "Code required" }; require(discount in 1..100) { "Discount 1-100%" }
        val upper = code.trim().uppercase()
        require(db.promotionDao().findActive(upper) == null) { "Code exists" }
        val id = db.promotionDao().insert(PromotionEntity(code = upper, discountPercentage = discount)).toInt()
        Promotion(id, upper, discount)
    }
    suspend fun validatePromo(code: String) = withContext(Dispatchers.IO) { db.promotionDao().findActive(code.trim().uppercase())?.toDomain() }
    suspend fun togglePromo(id: Int, active: Boolean) = withContext(Dispatchers.IO) { db.promotionDao().setActive(id, if (active) 1 else 0) }
    suspend fun deletePromo(id: Int) = withContext(Dispatchers.IO) { db.promotionDao().delete(id) }

    // ── Packages ──────────────────────────────────────────────────────────────
    val packages: Flow<List<Package>> = db.packageDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun createPackage(p: Package) = withContext(Dispatchers.IO) { db.packageDao().insert(PackageEntity(name = p.name, description = p.description, rides = p.rides, price = p.price)) }
    suspend fun togglePackage(id: Int, active: Boolean) = withContext(Dispatchers.IO) { db.packageDao().setActive(id, if (active) 1 else 0) }
    suspend fun deletePackage(id: Int) = withContext(Dispatchers.IO) { db.packageDao().delete(id) }

    // ── Maintenance ───────────────────────────────────────────────────────────
    val maintenanceLogs: Flow<List<MaintenanceLog>> = db.maintenanceDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun addMaintenance(m: MaintenanceLog) = withContext(Dispatchers.IO) { db.maintenanceDao().insert(MaintenanceLogEntity(quadId = m.quadId, quadName = m.quadName, type = m.type.name, description = m.description, cost = m.cost, operatorName = m.operatorName)) }
    suspend fun deleteMaintenance(id: Int) = withContext(Dispatchers.IO) { db.maintenanceDao().delete(id) }

    // ── Damage ────────────────────────────────────────────────────────────────
    val damageReports: Flow<List<DamageReport>> = db.damageDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun addDamage(d: DamageReport) = withContext(Dispatchers.IO) { db.damageDao().insert(DamageReportEntity(quadId = d.quadId, quadName = d.quadName, bookingId = d.bookingId, customerName = d.customerName, description = d.description, photoUri = d.photoUri, severity = d.severity.name, repairCost = d.repairCost)) }
    suspend fun resolveDamage(id: Int) = withContext(Dispatchers.IO) { db.damageDao().resolve(id) }
    suspend fun deleteDamage(id: Int) = withContext(Dispatchers.IO) { db.damageDao().delete(id) }

    // ── Staff ─────────────────────────────────────────────────────────────────
    val staff: Flow<List<Staff>> = db.staffDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun addStaff(s: Staff) = withContext(Dispatchers.IO) { db.staffDao().insert(StaffEntity(name = s.name, phone = s.phone, pin = s.pin, role = s.role.name)) }
    suspend fun updateStaff(s: Staff) = withContext(Dispatchers.IO) { db.staffDao().update(StaffEntity(s.id, s.name, s.phone, s.pin, s.role.name, if (s.isActive) 1 else 0)) }
    suspend fun deleteStaff(id: Int) = withContext(Dispatchers.IO) { db.staffDao().delete(id) }
    suspend fun clockIn(staffId: Int): Shift = withContext(Dispatchers.IO) {
        val s = db.staffDao().getById(staffId) ?: error("Staff not found")
        val id = db.shiftDao().insert(ShiftEntity(staffId = staffId, staffName = s.name)).toInt()
        db.shiftDao().getActiveShift(staffId)?.toDomain() ?: error("Shift not found")
    }
    suspend fun clockOut(shiftId: Int, notes: String = "") = withContext(Dispatchers.IO) { db.shiftDao().clockOut(shiftId, System.currentTimeMillis(), notes) }
    val shifts: Flow<List<Shift>> = db.shiftDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun getActiveShift(staffId: Int) = withContext(Dispatchers.IO) { db.shiftDao().getActiveShift(staffId)?.toDomain() }

    // ── Waitlist ──────────────────────────────────────────────────────────────
    val waitlist: Flow<List<WaitlistEntry>> = db.waitlistDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun addWaitlist(w: WaitlistEntry) = withContext(Dispatchers.IO) { db.waitlistDao().insert(WaitlistEntity(customerName = w.customerName, customerPhone = w.customerPhone, duration = w.duration)) }
    suspend fun notifyWaitlist(id: Int) = withContext(Dispatchers.IO) { db.waitlistDao().notify(id) }
    suspend fun removeWaitlist(id: Int) = withContext(Dispatchers.IO) { db.waitlistDao().delete(id) }

    // ── Prebookings ───────────────────────────────────────────────────────────
    val prebookings: Flow<List<Prebooking>> = db.prebookingDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun createPrebook(p: Prebooking) = withContext(Dispatchers.IO) { db.prebookingDao().insert(PrebookingEntity(quadId = p.quadId, quadName = p.quadName, customerName = p.customerName, customerPhone = normPhone(p.customerPhone), duration = p.duration, price = p.price, scheduledFor = p.scheduledFor, mpesaRef = p.mpesaRef, notes = p.notes)) }
    suspend fun setPrebookStatus(id: Int, s: PrebookStatus) = withContext(Dispatchers.IO) { db.prebookingDao().setStatus(id, s.name) }

    // ── Incidents ─────────────────────────────────────────────────────────────
    val incidents: Flow<List<IncidentReport>> = db.incidentDao().observeAll().map { l -> l.map { it.toDomain() } }
    suspend fun addIncident(i: IncidentReport) = withContext(Dispatchers.IO) { db.incidentDao().insert(IncidentEntity(bookingId = i.bookingId, quadName = i.quadName, customerName = i.customerName, type = i.type.name, description = i.description, reportedBy = i.reportedBy)) }
    suspend fun deleteIncident(id: Int) = withContext(Dispatchers.IO) { db.incidentDao().delete(id) }

    // ── Loyalty ───────────────────────────────────────────────────────────────
    suspend fun getLoyalty(phone: String) = withContext(Dispatchers.IO) { db.loyaltyDao().get(normPhone(phone))?.toDomain() }
    suspend fun addLoyaltyPoints(phone: String, pts: Int) = withContext(Dispatchers.IO) {
        val norm = normPhone(phone); val e = db.loyaltyDao().get(norm)
        db.loyaltyDao().upsert(if (e != null) e.copy(points = e.points + pts, totalEarned = e.totalEarned + pts, totalRides = e.totalRides + 1) else LoyaltyEntity(norm, pts, pts, 1))
    }
    suspend fun redeemPoints(phone: String, pts: Int) = withContext(Dispatchers.IO) {
        val norm = normPhone(phone); val e = db.loyaltyDao().get(norm) ?: return@withContext
        db.loyaltyDao().upsert(e.copy(points = maxOf(0, e.points - pts)))
    }

    // ── Dynamic Pricing ───────────────────────────────────────────────────────
    val dynamicPricing: Flow<List<DynamicPricingRule>> = db.dynamicPricingDao().observeAll().map { l -> if (l.isEmpty()) defaultPricingRules() else l.map { it.toDomain() } }
    suspend fun saveDynamicPricing(rules: List<DynamicPricingRule>) = withContext(Dispatchers.IO) {
        db.dynamicPricingDao().clear()
        db.dynamicPricingDao().insertAll(rules.map { DynamicPricingEntity(it.id, it.label, it.startHour, it.endHour, it.multiplier, if (it.active) 1 else 0) })
    }
    suspend fun getCurrentMultiplier(): Float = withContext(Dispatchers.IO) {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val rules = db.dynamicPricingDao().getAll().map { it.toDomain() }.ifEmpty { defaultPricingRules() }
        rules.firstOrNull { r -> r.active && if (r.startHour <= r.endHour) hour in r.startHour until r.endHour else hour >= r.startHour || hour < r.endHour }?.multiplier ?: 1f
    }
    private fun defaultPricingRules() = listOf(
        DynamicPricingRule(1,"Early Bird",6,9,0.9f,false), DynamicPricingRule(2,"Morning",9,12,1f,true),
        DynamicPricingRule(3,"Afternoon",12,16,1f,true), DynamicPricingRule(4,"Peak (4-6pm)",16,18,1.25f,false),
        DynamicPricingRule(5,"Sunset",18,20,1.5f,false), DynamicPricingRule(6,"Off-peak",20,6,0.8f,false)
    )
}

data class SalesData(val total: Int, val today: Int, val thisWeek: Int, val thisMonth: Int, val overtimeRevenue: Int)
