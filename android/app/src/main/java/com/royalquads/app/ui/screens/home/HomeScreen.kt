package com.royalquads.app.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
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
import com.royalquads.app.data.repository.RoyalQuadRepository
import com.royalquads.app.domain.model.*
import com.royalquads.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    val quads = repo.quads.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val activeBookings = repo.activeBookings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun startRide(quadId: Int, name: String, phone: String, duration: Int, price: Int, guideName: String?, onDone: (Int) -> Unit) {
        viewModelScope.launch {
            val b = repo.createBooking(quadId = quadId, userId = null, customerName = name, customerPhone = phone, duration = duration, price = price, originalPrice = price, guideName = guideName)
            onDone(b.id)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(nav: NavController, vm: HomeViewModel = hiltViewModel()) {
    val quads by vm.quads.collectAsState()
    val active by vm.activeBookings.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text(BUSINESS_NAME, fontWeight = FontWeight.Bold) }, actions = {
            IconButton(onClick = { nav.navigate(Screen.Admin.route) }) { Icon(Icons.Default.AdminPanelSettings, "Admin") }
            IconButton(onClick = { nav.navigate(Screen.Profile.route) }) { Icon(Icons.Default.Person, "Profile") }
        }) },
        floatingActionButton = { FloatingActionButton(onClick = { nav.navigate(Screen.Prebook.route) }) { Icon(Icons.Default.BookOnline, "Prebook") } }
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp)) {
            // Active rides summary
            if (active.isNotEmpty()) {
                Card(Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.DirectionsBike, null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(8.dp))
                        Text("${active.size} active ride${if (active.size != 1) "s" else ""}", fontWeight = FontWeight.Bold)
                        Spacer(Modifier.weight(1f))
                        active.firstOrNull()?.let { TextButton(onClick = { nav.navigate(Screen.ActiveRide.go(it.id)) }) { Text("View") } }
                    }
                }
            }

            Text("Fleet", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))

            LazyVerticalGrid(columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(2), verticalArrangement = Arrangement.spacedBy(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(quads) { quad ->
                    QuadCard(quad, onStart = { nav.navigate(Screen.ActiveRide.go(-quad.id)) })
                }
            }
        }
    }
}

@Composable
fun QuadCard(quad: Quad, onStart: () -> Unit) {
    val color = when (quad.status) {
        QuadStatus.AVAILABLE   -> MaterialTheme.colorScheme.primary
        QuadStatus.RENTED      -> MaterialTheme.colorScheme.error
        QuadStatus.MAINTENANCE -> MaterialTheme.colorScheme.secondary
    }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp)) {
            Text(quad.name, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Badge(containerColor = color) { Text(quad.status.name, color = MaterialTheme.colorScheme.onPrimary) }
            if (quad.status == QuadStatus.AVAILABLE) {
                Spacer(Modifier.height(8.dp))
                Button(onClick = onStart, modifier = Modifier.fillMaxWidth()) { Text("Start") }
            }
        }
    }
}
