package com.royalquads.app.ui.screens.receipt

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.*
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.royalquads.app.data.repository.RoyalQuadRepository
import com.royalquads.app.domain.model.Booking
import com.royalquads.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ReceiptViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    private val _booking = MutableStateFlow<Booking?>(null)
    val booking: StateFlow<Booking?> = _booking.asStateFlow()
    fun load(id: Int) { viewModelScope.launch { _booking.value = repo.getBookingById(id) } }
    fun submitFeedback(id: Int, rating: Int, text: String) { viewModelScope.launch { repo.submitFeedback(id, rating, text) } }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReceiptScreen(nav: NavController, bookingId: Int, vm: ReceiptViewModel = hiltViewModel()) {
    LaunchedEffect(bookingId) { vm.load(bookingId) }
    val booking by vm.booking.collectAsState()
    var rating by remember { mutableIntStateOf(0) }
    var feedback by remember { mutableStateOf("") }
    val fmt = SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault())

    Scaffold(topBar = { TopAppBar(title = { Text("Receipt") }, navigationIcon = {
        IconButton(onClick = { nav.navigate(Screen.Home.route) { popUpTo(0) } }) { Icon(Icons.Default.Home, "Home") }
    }) }) { pad ->
        booking?.let { b ->
            Column(Modifier.fillMaxSize().padding(pad).padding(16.dp).verticalScroll(rememberScrollState())) {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(20.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Receipt", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(b.receiptId, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                        }
                        HorizontalDivider(Modifier.padding(vertical = 12.dp))
                        ReceiptRow("Customer", b.customerName)
                        ReceiptRow("Phone", b.customerPhone)
                        ReceiptRow("Quad", b.quadName)
                        ReceiptRow("Duration", "${b.duration} min")
                        ReceiptRow("Start", b.startTime.let { fmt.format(Date(it)) })
                        b.endTime?.let { ReceiptRow("End", fmt.format(Date(it))) }
                        b.guideName?.let { ReceiptRow("Guide", it) }
                        b.mpesaRef?.let { ReceiptRow("M-Pesa Ref", it) }
                        HorizontalDivider(Modifier.padding(vertical = 12.dp))
                        if (b.overtimeCharge > 0) {
                            ReceiptRow("Base Price", "KES ${b.price - b.overtimeCharge}")
                            ReceiptRow("Overtime (${b.overtimeMinutes} min)", "KES ${b.overtimeCharge}")
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("TOTAL", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text("KES ${b.price + b.overtimeCharge}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))
                Text("Rate your experience", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Row(Modifier.padding(vertical = 8.dp)) {
                    (1..5).forEach { star ->
                        IconButton(onClick = { rating = star }) {
                            Icon(if (star <= rating) Icons.Default.Star else Icons.Default.StarBorder, null, tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
                OutlinedTextField(value = feedback, onValueChange = { feedback = it }, label = { Text("Feedback (optional)") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(12.dp))
                if (rating > 0) Button(onClick = { vm.submitFeedback(b.id, rating, feedback); nav.navigate(Screen.Home.route) { popUpTo(0) } }, Modifier.fillMaxWidth()) { Text("Submit & Done") }
                else OutlinedButton(onClick = { nav.navigate(Screen.Home.route) { popUpTo(0) } }, Modifier.fillMaxWidth()) { Text("Done") }
            }
        } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
    }
}

@Composable
private fun ReceiptRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
    }
}
