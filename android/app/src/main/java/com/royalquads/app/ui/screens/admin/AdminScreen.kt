package com.royalquads.app.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.royalquads.app.domain.model.*
import com.royalquads.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AdminViewModel @Inject constructor(private val repo: RoyalQuadRepository, private val prefs: AppPreferences) : ViewModel() {
    val adminPin = prefs.adminPin.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "1234")
    val quads = repo.quads.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val activeBookings = repo.activeBookings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val promotions = repo.promotions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val staff = repo.staff.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val prebookings = repo.prebookings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _history = MutableStateFlow<List<Booking>>(emptyList())
    val history: StateFlow<List<Booking>> = _history.asStateFlow()

    init { viewModelScope.launch { _history.value = repo.getCompleted() } }

    fun addQuad(name: String) = viewModelScope.launch { repo.createQuad(name) }
    fun deleteQuad(id: Int) = viewModelScope.launch { repo.deleteQuad(id) }
    fun setQuadStatus(id: Int, s: QuadStatus) = viewModelScope.launch { repo.setQuadStatus(id, s) }
    fun createPromo(code: String, discount: Int) = viewModelScope.launch { repo.createPromotion(code, discount) }
    fun togglePromo(id: Int, active: Boolean) = viewModelScope.launch { repo.togglePromo(id, active) }
    fun deletePromo(id: Int) = viewModelScope.launch { repo.deletePromo(id) }
    fun completeRide(id: Int) = viewModelScope.launch { repo.completeBooking(id) }
    fun setPin(pin: String) = viewModelScope.launch { prefs.setAdminPin(pin) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(nav: NavController, vm: AdminViewModel = hiltViewModel()) {
    var pinInput by remember { mutableStateOf("") }
    var unlocked by remember { mutableStateOf(false) }
    val adminPin by vm.adminPin.collectAsState()

    if (!unlocked) {
        // PIN gate
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Card(Modifier.padding(32.dp).fillMaxWidth()) {
                Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Lock, null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(16.dp))
                    Text("Admin Access", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))
                    OutlinedTextField(pinInput, { pinInput = it }, label = { Text("PIN") }, singleLine = true, visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation())
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = { if (pinInput == adminPin) unlocked = true }, Modifier.fillMaxWidth()) { Text("Unlock") }
                }
            }
        }
        return
    }

    val quads by vm.quads.collectAsState()
    val active by vm.activeBookings.collectAsState()
    val promos by vm.promotions.collectAsState()
    val history by vm.history.collectAsState()
    val prebookings by vm.prebookings.collectAsState()
    var tab by remember { mutableIntStateOf(0) }
    var newQuadName by remember { mutableStateOf("") }
    var newPromoCode by remember { mutableStateOf("") }
    var newPromoDiscount by remember { mutableStateOf("10") }

    Scaffold(topBar = { TopAppBar(title = { Text("Admin") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }, actions = {
        IconButton(onClick = { nav.navigate(Screen.Analytics.route) }) { Icon(Icons.Default.BarChart, "Analytics") }
    }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            ScrollableTabRow(selectedTabIndex = tab) {
                listOf("Fleet","Active","History","Promos","Prebooks").forEachIndexed { i, t ->
                    Tab(selected = tab == i, onClick = { tab = i }, text = { Text(t) })
                }
            }

            when (tab) {
                // Fleet
                0 -> LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(newQuadName, { newQuadName = it }, Modifier.weight(1f), label = { Text("Quad name") }, singleLine = true)
                            Button(onClick = { if (newQuadName.isNotBlank()) { vm.addQuad(newQuadName); newQuadName = "" } }, Modifier.padding(top = 8.dp)) { Text("Add") }
                        }
                    }
                    items(quads) { q ->
                        Card(Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(q.name, fontWeight = FontWeight.Bold)
                                    Text(q.status.name, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                IconButton(onClick = { vm.setQuadStatus(q.id, if (q.status == QuadStatus.MAINTENANCE) QuadStatus.AVAILABLE else QuadStatus.MAINTENANCE) }) { Icon(Icons.Default.Build, "Toggle maintenance") }
                                IconButton(onClick = { vm.deleteQuad(q.id) }) { Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error) }
                            }
                        }
                    }
                }
                // Active rides
                1 -> LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (active.isEmpty()) item { Text("No active rides", Modifier.padding(16.dp)) }
                    items(active) { b ->
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp)) {
                                Text(b.customerName, fontWeight = FontWeight.Bold)
                                Text("${b.quadName} · ${b.duration} min · KES ${b.price}", style = MaterialTheme.typography.bodySmall)
                                b.guideName?.let { Text("Guide: $it", style = MaterialTheme.typography.bodySmall) }
                                Spacer(Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(onClick = { nav.navigate(Screen.ActiveRide.go(b.id)) }) { Text("View") }
                                    Button(onClick = { vm.completeRide(b.id) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("End") }
                                }
                            }
                        }
                    }
                }
                // History
                2 -> LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(history) { b ->
                        Card(Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column {
                                    Text(b.customerName, fontWeight = FontWeight.Bold)
                                    Text("${b.quadName} · ${b.duration} min", style = MaterialTheme.typography.bodySmall)
                                    Text(b.receiptId, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                }
                                Text("KES ${b.price + b.overtimeCharge}", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                // Promotions
                3 -> LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("New Promo", fontWeight = FontWeight.Bold)
                                OutlinedTextField(newPromoCode, { newPromoCode = it.uppercase() }, Modifier.fillMaxWidth(), label = { Text("Code") }, singleLine = true)
                                OutlinedTextField(newPromoDiscount, { newPromoDiscount = it }, Modifier.fillMaxWidth(), label = { Text("Discount %") }, singleLine = true)
                                Button(onClick = { vm.createPromo(newPromoCode, newPromoDiscount.toIntOrNull() ?: 10); newPromoCode = ""; newPromoDiscount = "10" }, Modifier.fillMaxWidth()) { Text("Create") }
                            }
                        }
                    }
                    items(promos) { p ->
                        Card(Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(p.code, fontWeight = FontWeight.Bold)
                                    Text("${p.discountPercentage}% off", style = MaterialTheme.typography.bodySmall)
                                }
                                Switch(checked = p.isActive, onCheckedChange = { vm.togglePromo(p.id, it) })
                                IconButton(onClick = { vm.deletePromo(p.id) }) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) }
                            }
                        }
                    }
                }
                // Prebookings
                4 -> LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val pending by derivedStateOf { prebookings.filter { it.status == PrebookStatus.PENDING || it.status == PrebookStatus.CONFIRMED } }
                    if (prebookings.isEmpty()) item { Text("No pre-bookings", Modifier.padding(16.dp)) }
                    items(prebookings) { pb ->
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp)) {
                                Text(pb.customerName, fontWeight = FontWeight.Bold)
                                Text("${pb.duration} min · KES ${pb.price} · ${pb.status.name}", style = MaterialTheme.typography.bodySmall)
                                pb.mpesaRef?.let { Text("M-Pesa: $it", style = MaterialTheme.typography.labelSmall) }
                                pb.notes?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            }
                        }
                    }
                }
            }
        }
    }
}
