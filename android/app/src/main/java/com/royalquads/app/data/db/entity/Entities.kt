package com.royalquads.app.data.db.entity

import androidx.room.*

@Entity(tableName = "quads")
data class QuadEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val name: String, val status: String = "AVAILABLE", val imageUrl: String? = null, val imei: String? = null)

@Entity(tableName = "bookings")
data class BookingEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val quadId: Int, val userId: Int? = null, val customerName: String, val customerPhone: String, val duration: Int, val price: Int, val originalPrice: Int, val promoCode: String? = null, val startTime: Long = System.currentTimeMillis(), val endTime: Long? = null, val status: String = "ACTIVE", val receiptId: String, val rating: Int? = null, val feedback: String? = null, val quadName: String, val quadImageUrl: String? = null, val isPrebooked: Int = 0, val groupSize: Int = 1, val idPhotoUri: String? = null, val waiverSigned: Int = 0, val waiverSignedAt: Long? = null, val overtimeMinutes: Int = 0, val overtimeCharge: Int = 0, val depositAmount: Int = 0, val depositReturned: Int = 0, val mpesaRef: String? = null, val operatorId: Int? = null, val guideName: String? = null, val guidePaid: Int = 0)

@Entity(tableName = "users")
data class UserEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val name: String, val phone: String, val role: String = "user", val password: String)

@Entity(tableName = "promotions")
data class PromotionEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val code: String, val discountPercentage: Int, val isActive: Int = 1)

@Entity(tableName = "packages")
data class PackageEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val name: String, val description: String, val rides: Int, val price: Int, val isActive: Int = 1)

@Entity(tableName = "maintenance_logs")
data class MaintenanceLogEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val quadId: Int, val quadName: String, val type: String, val description: String, val cost: Int, val date: Long = System.currentTimeMillis(), val operatorName: String? = null)

@Entity(tableName = "damage_reports")
data class DamageReportEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val quadId: Int, val quadName: String, val bookingId: Int? = null, val customerName: String? = null, val description: String, val photoUri: String? = null, val severity: String, val repairCost: Int = 0, val resolved: Int = 0, val date: Long = System.currentTimeMillis())

@Entity(tableName = "staff")
data class StaffEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val name: String, val phone: String, val pin: String, val role: String = "OPERATOR", val isActive: Int = 1)

@Entity(tableName = "shifts")
data class ShiftEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val staffId: Int, val staffName: String, val startTime: Long = System.currentTimeMillis(), val endTime: Long? = null, val notes: String = "")

@Entity(tableName = "waitlist")
data class WaitlistEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val customerName: String, val customerPhone: String, val duration: Int, val addedAt: Long = System.currentTimeMillis(), val notified: Int = 0)

@Entity(tableName = "prebookings")
data class PrebookingEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val quadId: Int? = null, val quadName: String? = null, val customerName: String, val customerPhone: String, val duration: Int, val price: Int, val scheduledFor: Long, val status: String = "PENDING", val createdAt: Long = System.currentTimeMillis(), val mpesaRef: String? = null, val notes: String? = null)

@Entity(tableName = "incidents")
data class IncidentEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val bookingId: Int? = null, val quadName: String, val customerName: String, val type: String, val description: String, val date: Long = System.currentTimeMillis(), val reportedBy: String)

@Entity(tableName = "loyalty")
data class LoyaltyEntity(@PrimaryKey val phone: String, val points: Int = 0, val totalEarned: Int = 0, val totalRides: Int = 0)

@Entity(tableName = "dynamic_pricing")
data class DynamicPricingEntity(@PrimaryKey(autoGenerate = true) val id: Int = 0, val label: String, val startHour: Int, val endHour: Int, val multiplier: Float, val active: Int = 0)
