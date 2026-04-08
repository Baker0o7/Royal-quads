package com.royalquads.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color

data class RqTheme(val id: String, val label: String, val emoji: String, val dark: Boolean, val primary: Color, val secondary: Color, val background: Color, val surface: Color, val onBackground: Color, val accent: Color)

val RQ_THEMES = listOf(
    RqTheme("desert","Desert","🏜️",false, Color(0xFFC9972A), Color(0xFFE8B84B), Color(0xFFF5F0E8), Color(0xFFFFFFFF), Color(0xFF1A1612), Color(0xFFC9972A)),
    RqTheme("midnight","Midnight","🌑",true,  Color(0xFFC9972A), Color(0xFFE8B84B), Color(0xFF0D0B09), Color(0xFF1A1612), Color(0xFFF5F0E8), Color(0xFFC9972A)),
    RqTheme("ocean","Ocean","🌊",false,   Color(0xFF0EA5E9), Color(0xFF38BDF8), Color(0xFFEEF6FB), Color(0xFFFFFFFF), Color(0xFF0C2D3F), Color(0xFF0EA5E9)),
    RqTheme("forest","Forest","🌿",true,  Color(0xFF4ADE80), Color(0xFF86EFAC), Color(0xFF0D1A0F), Color(0xFF142018), Color(0xFFE8F5EB), Color(0xFF4ADE80)),
    RqTheme("sunset","Sunset","🌅",true,  Color(0xFFFB7185), Color(0xFFF97316), Color(0xFF1A0A1A), Color(0xFF2D1030), Color(0xFFFDE8EC), Color(0xFFFB7185)),
    RqTheme("arctic","Arctic","❄️",false, Color(0xFF3B82F6), Color(0xFF60A5FA), Color(0xFFF0F7FF), Color(0xFFFFFFFF), Color(0xFF0F2444), Color(0xFF3B82F6)),
    RqTheme("volcanic","Volcanic","🌋",true, Color(0xFFFB5722), Color(0xFFFDBA74), Color(0xFF0F0A08), Color(0xFF1C1008), Color(0xFFFFF1EC), Color(0xFFFB5722)),
    RqTheme("rose","Rose","🌸",false,     Color(0xFFF43F8E), Color(0xFFFB7BB8), Color(0xFFFFF5F7), Color(0xFFFFFFFF), Color(0xFF3B0A1F), Color(0xFFF43F8E)),
)

fun RqTheme.toColorScheme() = if (dark) darkColorScheme(primary = primary, secondary = secondary, background = background, surface = surface, onBackground = onBackground, onSurface = onBackground, tertiary = accent) else lightColorScheme(primary = primary, secondary = secondary, background = background, surface = surface, onBackground = onBackground, onSurface = onBackground, tertiary = accent)

val LocalRqTheme = staticCompositionLocalOf { RQ_THEMES[1] } // midnight default

@Composable
fun RoyalQuadTheme(theme: RqTheme = RQ_THEMES[1], content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalRqTheme provides theme) {
        MaterialTheme(colorScheme = theme.toColorScheme(), typography = Typography(), content = content)
    }
}
