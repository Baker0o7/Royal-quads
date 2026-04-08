package com.royalquads.app.data.prefs

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore("rq_prefs")

@Singleton
class AppPreferences @Inject constructor(@ApplicationContext ctx: Context) {
    private val ds = ctx.dataStore
    private val THEME_KEY    = stringPreferencesKey("theme")
    private val PIN_KEY      = stringPreferencesKey("admin_pin")
    private val ONBOARDED    = booleanPreferencesKey("onboarded")
    private val LOGGED_IN_ID = intPreferencesKey("logged_in_id")

    val theme: Flow<String> = ds.data.map { it[THEME_KEY] ?: "desert" }
    val adminPin: Flow<String> = ds.data.map { it[PIN_KEY] ?: "1234" }
    val onboarded: Flow<Boolean> = ds.data.map { it[ONBOARDED] ?: false }
    val loggedInUserId: Flow<Int?> = ds.data.map { prefs -> prefs[LOGGED_IN_ID]?.let { if (it == -1) null else it } }

    suspend fun setTheme(id: String) = ds.edit { it[THEME_KEY] = id }
    suspend fun setAdminPin(pin: String) = ds.edit { it[PIN_KEY] = pin }
    suspend fun setOnboarded() = ds.edit { it[ONBOARDED] = true }
    suspend fun setLoggedIn(userId: Int?) = ds.edit { it[LOGGED_IN_ID] = userId ?: -1 }
}
