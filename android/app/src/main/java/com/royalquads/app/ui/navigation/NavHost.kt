package com.royalquads.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.royalquads.app.ui.screens.home.HomeScreen
import com.royalquads.app.ui.screens.activeride.ActiveRideScreen
import com.royalquads.app.ui.screens.admin.AdminScreen
import com.royalquads.app.ui.screens.analytics.AnalyticsScreen
import com.royalquads.app.ui.screens.prebook.PrebookScreen
import com.royalquads.app.ui.screens.profile.ProfileScreen
import com.royalquads.app.ui.screens.receipt.ReceiptScreen
import com.royalquads.app.ui.screens.waiver.WaiverScreen

sealed class Screen(val route: String) {
    object Home       : Screen("home")
    object ActiveRide : Screen("ride/{bookingId}") { fun go(id: Int) = "ride/$id" }
    object Receipt    : Screen("receipt/{bookingId}") { fun go(id: Int) = "receipt/$id" }
    object Waiver     : Screen("waiver/{bookingId}") { fun go(id: Int) = "waiver/$id" }
    object Admin      : Screen("admin")
    object Analytics  : Screen("analytics")
    object Prebook    : Screen("prebook")
    object Profile    : Screen("profile")
}

@Composable
fun RoyalQuadNavHost() {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = Screen.Home.route) {
        composable(Screen.Home.route)           { HomeScreen(nav) }
        composable(Screen.ActiveRide.route)     { back -> ActiveRideScreen(nav, back.arguments?.getString("bookingId")?.toIntOrNull() ?: 0) }
        composable(Screen.Receipt.route)        { back -> ReceiptScreen(nav, back.arguments?.getString("bookingId")?.toIntOrNull() ?: 0) }
        composable(Screen.Waiver.route)         { back -> WaiverScreen(nav, back.arguments?.getString("bookingId")?.toIntOrNull() ?: 0) }
        composable(Screen.Admin.route)          { AdminScreen(nav) }
        composable(Screen.Analytics.route)      { AnalyticsScreen(nav) }
        composable(Screen.Prebook.route)        { PrebookScreen(nav) }
        composable(Screen.Profile.route)        { ProfileScreen(nav) }
    }
}
