package com.royalquads.app.di

import android.content.Context
import com.royalquads.app.data.db.AppDatabase
import com.royalquads.app.data.repository.RoyalQuadRepository
import dagger.Module; import dagger.Provides; import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module @InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton fun provideDb(@ApplicationContext ctx: Context) = AppDatabase.get(ctx)
    @Provides @Singleton fun provideRepo(db: AppDatabase) = RoyalQuadRepository(db)
}
