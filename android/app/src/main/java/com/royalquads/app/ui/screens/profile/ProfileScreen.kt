package com.royalquads.app.ui.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.royalquads.app.data.prefs.AppPreferences
import com.royalquads.app.data.repository.RoyalQuadRepository
import com.royalquads.app.domain.model.Booking
import com.royalquads.app.ui.theme.RQ_THEMES
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(private val repo: RoyalQuadRepository, private val prefs: AppPreferences) : ViewModel() {
    val theme = prefs.theme.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "midnight")
    val loggedInId = prefs.loggedInUserId.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    private val _history = MutableStateFlow<List<Booking>>(emptyList())
    val history: StateFlow<List<Booking>> = _history.asStateFlow()

    fun loadHistory(userId: Int) { viewModelScope.launch { _history.value = repo.getUserBookings(userId) } }
    fun setTheme(id: String) { viewModelScope.launch { prefs.setTheme(id) } }
    fun logout() { viewModelScope.launch { prefs.setLoggedIn(null) } }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(nav: NavController, vm: ProfileViewModel = hiltViewModel()) {
    val themeId by vm.theme.collectAsState()
    val userId by vm.loggedInId.collectAsState()
    val history by vm.history.collectAsState()
    LaunchedEffect(userId) { userId?.let { vm.loadHistory(it) } }
    val fmt = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())

    Scaffold(topBar = { TopAppBar(title = { Text("Profile") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }, actions = {
        if (userId != null) IconButton(onClick = { vm.logout() }) { Icon(Icons.Default.Logout, "Logout") }
    }) }) { pad ->
        LazyColumn(Modifier.fillMaxSize().padding(pad).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { Spacer(Modifier.height(4.dp)) }

            // Theme picker
            item {
                Text("Theme", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(RQ_THEMES) { t ->
                        FilterChip(selected = themeId == t.id, onClick = { vm.setTheme(t.id) }, label = { Text("${t.emoji} ${t.label}") })
                    }
                }
            }

            if (history.isNotEmpty()) {
                item { Text("Ride History", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold) }
                items(history) { b ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text(b.quadName, fontWeight = FontWeight.Bold)
                                Text(fmt.format(Date(b.startTime)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("KES ${b.price}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}
