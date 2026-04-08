package com.royalquads.app.ui.screens.prebook

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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
class PrebookViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    val quads = repo.quads.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    fun createPrebook(name: String, phone: String, duration: Int, price: Int, scheduledFor: Long, mpesaRef: String?, notes: String?, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.createPrebook(Prebooking(customerName = name, customerPhone = phone, duration = duration, price = price, scheduledFor = scheduledFor, mpesaRef = mpesaRef?.ifBlank { null }, notes = notes?.ifBlank { null }))
            onDone()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrebookScreen(nav: NavController, vm: PrebookViewModel = hiltViewModel()) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var mpesaRef by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var selectedTier by remember { mutableStateOf(PRICING_TIERS[2]) }

    Scaffold(topBar = { TopAppBar(title = { Text("Pre-Book a Ride") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(name, { name = it }, Modifier.fillMaxWidth(), label = { Text("Customer Name") }, leadingIcon = { Icon(Icons.Default.Person, null) })
            OutlinedTextField(phone, { phone = it }, Modifier.fillMaxWidth(), label = { Text("Phone Number") }, leadingIcon = { Icon(Icons.Default.Phone, null) })
            OutlinedTextField(mpesaRef, { mpesaRef = it }, Modifier.fillMaxWidth(), label = { Text("M-Pesa Ref (optional)") })
            OutlinedTextField(notes, { notes = it }, Modifier.fillMaxWidth(), label = { Text("Notes (optional)") }, minLines = 2)

            Text("Duration", style = MaterialTheme.typography.titleSmall)
            PRICING_TIERS.chunked(3).forEach { row ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { tier ->
                        FilterChip(selected = selectedTier == tier, onClick = { selectedTier = tier }, label = { Text("${tier.label}\nKES ${tier.price}") }, modifier = Modifier.weight(1f))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { vm.createPrebook(name, phone, selectedTier.duration, selectedTier.price, System.currentTimeMillis() + 3600_000L, mpesaRef, notes) { nav.navigate(Screen.Home.route) { popUpTo(0) } } },
                modifier = Modifier.fillMaxWidth(),
                enabled = name.isNotBlank() && phone.isNotBlank()
            ) { Icon(Icons.Default.BookOnline, null); Spacer(Modifier.width(8.dp)); Text("Confirm Pre-Booking") }
        }
    }
}
