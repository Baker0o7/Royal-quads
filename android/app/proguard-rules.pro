# ── Capacitor / WebView bridge (REQUIRED — do not remove) ─────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray  { *; }

# Keep JavaScript interface methods callable from WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX / AppCompat
-keep class androidx.appcompat.** { *; }
-keep class androidx.core.**      { *; }
-dontwarn androidx.**

# Retain source file + line numbers for crash traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
