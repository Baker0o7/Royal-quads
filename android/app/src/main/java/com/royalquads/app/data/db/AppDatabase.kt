package com.royalquads.app.data.db

import android.content.Context
import androidx.room.*
import com.royalquads.app.data.db.dao.*
import com.royalquads.app.data.db.entity.*

@Database(
    entities = [QuadEntity::class, BookingEntity::class, UserEntity::class,
        PromotionEntity::class, PackageEntity::class, MaintenanceLogEntity::class,
        DamageReportEntity::class, StaffEntity::class, ShiftEntity::class,
        WaitlistEntity::class, PrebookingEntity::class, IncidentEntity::class,
        LoyaltyEntity::class, DynamicPricingEntity::class],
    version = 1, exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun quadDao(): QuadDao
    abstract fun bookingDao(): BookingDao
    abstract fun userDao(): UserDao
    abstract fun promotionDao(): PromotionDao
    abstract fun packageDao(): PackageDao
    abstract fun maintenanceDao(): MaintenanceDao
    abstract fun damageDao(): DamageDao
    abstract fun staffDao(): StaffDao
    abstract fun shiftDao(): ShiftDao
    abstract fun waitlistDao(): WaitlistDao
    abstract fun prebookingDao(): PrebookingDao
    abstract fun incidentDao(): IncidentDao
    abstract fun loyaltyDao(): LoyaltyDao
    abstract fun dynamicPricingDao(): DynamicPricingDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null
        fun get(context: Context): AppDatabase = INSTANCE ?: synchronized(this) {
            Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "royal_quads.db")
                .fallbackToDestructiveMigration()
                .build()
                .also { INSTANCE = it }
        }
    }
}
