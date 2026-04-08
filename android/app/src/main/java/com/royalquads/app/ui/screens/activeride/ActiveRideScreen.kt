package com.royalquads.app.ui.screens.activeride

import androidx.compose.foundation.layout.*
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
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject

@HiltViewModel
class ActiveRideViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    private val _booking = MutableStateFlow<Booking?>(null)
    val booking: StateFlow<Booking?> = _booking.asStateFlow()
    private val _elapsed = MutableStateFlow(0L)
    val elapsed: StateFlow<Long> = _elapsed.asStateFlow()
    private var timerJob: Job? = null

    fun load(id: Int) {
        viewModelScope.launch {
            _booking.value = repo.getBookingById(id)
            startTimer()
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                val b = _booking.value ?: break
                _elapsed.value = (System.currentTimeMillis() - b.startTime) / 1000L
                delay(1000)
            }
        }
    }

    fun completeRide(bookingId: Int, onDone: (Int) -> Unit) {
        viewModelScope.launch {
            val b = _booking.value ?: return@launch
            val overtime = maxOf(0, ((_elapsed.value / 60).toInt() - b.duration))
            repo.completeBooking(bookingId, overtime)
            timerJob?.cancel()
            onDone(bookingId)
        }
    }

    fun extendRide(bookingId: Int, mins: Int, price: Int) {
        viewModelScope.launch { repo.extendBooking(bookingId, mins, price) }
    }

    override fun onCleared() { super.onCleared(); timerJob?.cancel() }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveRideScreen(nav: NavController, bookingId: Int, vm: ActiveRideViewModel = hiltViewModel()) {
    LaunchedEffect(bookingId) { vm.load(bookingId) }
    val booking by vm.booking.collectAsState()
    val elapsed by vm.elapsed.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Active Ride") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }) }) { pad ->
        booking?.let { b ->
            Column(Modifier.fillMaxSize().padding(pad).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(b.quadName, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(b.customerName, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(24.dp))

                // Timer
                val mins = elapsed / 60; val secs = elapsed % 60
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Elapsed", style = MaterialTheme.typography.labelLarge)
                        Text("%02d:%02d".format(mins, secs), style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold)
                        Text("/ ${b.duration} min booked", style = MaterialTheme.typography.bodySmall)
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text("KES ${b.price}", style = MaterialTheme.typography.titleLarge)
                b.guideName?.let { Text("Guide: $it", style = MaterialTheme.typography.bodyMedium) }
                b.mpesaRef?.let { Text("M-Pesa: $it", style = MaterialTheme.typography.bodySmall) }

                Spacer(Modifier.height(24.dp))
                // Extend buttons
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(5 to 500, 10 to 900, 15 to 1100, 30 to 1750).forEach { (m, p) ->
                        OutlinedButton(onClick = { vm.extendRide(b.id, m, p) }) { Text("+${m}m") }
                    }
                }

                Spacer(Modifier.weight(1f))
                Button(onClick = { vm.completeRide(b.id) { nav.navigate(Screen.Receipt.go(it)) { popUpTo(Screen.Home.route) } } },
                    modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) {
                    Icon(Icons.Default.Stop, null); Spacer(Modifier.width(8.dp)); Text("Complete Ride")
                }
            }
        } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
    }
}
