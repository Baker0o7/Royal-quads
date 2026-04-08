package com.royalquads.app.domain.model

enum class QuadStatus { AVAILABLE, RENTED, MAINTENANCE }
enum class BookingStatus { ACTIVE, COMPLETED }
enum class PrebookStatus { PENDING, CONFIRMED, CANCELLED, CONVERTED }
enum class MaintenanceType { SERVICE, FUEL, REPAIR, INSPECTION }
enum class DamageSeverity { MINOR, MODERATE, SEVERE }
enum class StaffRole { OPERATOR, MANAGER }
enum class IncidentType { FALL, MECHANICAL, MEDICAL, OTHER }

data class Quad(val id: Int = 0, val name: String, val status: QuadStatus = QuadStatus.AVAILABLE, val imageUrl: String? = null, val imei: String? = null)
data class Booking(val id: Int = 0, val quadId: Int, val userId: Int? = null, val customerName: String, val customerPhone: String, val duration: Int, val price: Int, val originalPrice: Int, val promoCode: String? = null, val startTime: Long = System.currentTimeMillis(), val endTime: Long? = null, val status: BookingStatus = BookingStatus.ACTIVE, val receiptId: String, val rating: Int? = null, val feedback: String? = null, val quadName: String, val quadImageUrl: String? = null, val isPrebooked: Boolean = false, val groupSize: Int = 1, val idPhotoUri: String? = null, val waiverSigned: Boolean = false, val waiverSignedAt: Long? = null, val overtimeMinutes: Int = 0, val overtimeCharge: Int = 0, val depositAmount: Int = 0, val depositReturned: Boolean = false, val mpesaRef: String? = null, val operatorId: Int? = null, val guideName: String? = null, val guidePaid: Boolean = false)
data class User(val id: Int = 0, val name: String, val phone: String, val role: String = "user", val password: String)
data class Promotion(val id: Int = 0, val code: String, val discountPercentage: Int, val isActive: Boolean = true)
data class Package(val id: Int = 0, val name: String, val description: String, val rides: Int, val price: Int, val isActive: Boolean = true)
data class MaintenanceLog(val id: Int = 0, val quadId: Int, val quadName: String, val type: MaintenanceType, val description: String, val cost: Int, val date: Long = System.currentTimeMillis(), val operatorName: String? = null)
data class DamageReport(val id: Int = 0, val quadId: Int, val quadName: String, val bookingId: Int? = null, val customerName: String? = null, val description: String, val photoUri: String? = null, val severity: DamageSeverity, val repairCost: Int = 0, val resolved: Boolean = false, val date: Long = System.currentTimeMillis())
data class Staff(val id: Int = 0, val name: String, val phone: String, val pin: String, val role: StaffRole = StaffRole.OPERATOR, val isActive: Boolean = true)
data class Shift(val id: Int = 0, val staffId: Int, val staffName: String, val startTime: Long = System.currentTimeMillis(), val endTime: Long? = null, val notes: String = "")
data class WaitlistEntry(val id: Int = 0, val customerName: String, val customerPhone: String, val duration: Int, val addedAt: Long = System.currentTimeMillis(), val notified: Boolean = false)
data class Prebooking(val id: Int = 0, val quadId: Int? = null, val quadName: String? = null, val customerName: String, val customerPhone: String, val duration: Int, val price: Int, val scheduledFor: Long, val status: PrebookStatus = PrebookStatus.PENDING, val createdAt: Long = System.currentTimeMillis(), val mpesaRef: String? = null, val notes: String? = null)
data class IncidentReport(val id: Int = 0, val bookingId: Int? = null, val quadName: String, val customerName: String, val type: IncidentType, val description: String, val date: Long = System.currentTimeMillis(), val reportedBy: String)
data class LoyaltyAccount(val phone: String, val points: Int = 0, val totalEarned: Int = 0, val totalRides: Int = 0)
data class DynamicPricingRule(val id: Int = 0, val label: String, val startHour: Int, val endHour: Int, val multiplier: Float, val active: Boolean = false)
data class PriceTier(val duration: Int, val price: Int, val label: String)

val PRICING_TIERS = listOf(PriceTier(5,1000,"5 min"),PriceTier(10,1800,"10 min"),PriceTier(15,2200,"15 min"),PriceTier(20,2500,"20 min"),PriceTier(30,3500,"30 min"),PriceTier(60,6000,"1 hour"))
const val OVERTIME_RATE = 100
const val GUIDE_COMMISSION_PCT = 0.20f
const val TILL_NUMBER = "6685024"
const val BUSINESS_NAME = "Royal Quads Mambrui"
const val DEFAULT_ADMIN_PIN = "1234"
