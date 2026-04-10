package com.royalquads.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.royalquads.app.data.prefs.AppPreferences
import com.royalquads.app.ui.navigation.RoyalQuadNavHost
import com.royalquads.app.ui.theme.RQ_THEMES
import com.royalquads.app.ui.theme.RoyalQuadTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var prefs: AppPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        // installSplashScreen MUST be before super.onCreate()
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val themeId by prefs.theme.collectAsState(initial = "midnight")
            val theme = RQ_THEMES.find { it.id == themeId } ?: RQ_THEMES[1]
            RoyalQuadTheme(theme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RoyalQuadNavHost()
                }
            }
        }
    }
}
