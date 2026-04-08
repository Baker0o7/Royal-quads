package com.royalquads.app.ui.screens.analytics

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
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.royalquads.app.data.repository.RoyalQuadRepository
import com.royalquads.app.data.repository.SalesData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AnalyticsViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    private val _sales = MutableStateFlow<SalesData?>(null)
    val sales: StateFlow<SalesData?> = _sales.asStateFlow()
    private val _chart = MutableStateFlow<List<Triple<String,Int,Int>>>(emptyList())
    val chart: StateFlow<List<Triple<String,Int,Int>>> = _chart.asStateFlow()
    private val _peaks = MutableStateFlow<List<Pair<Int,Int>>>(emptyList())
    val peaks: StateFlow<List<Pair<Int,Int>>> = _peaks.asStateFlow()
    private val _utilisation = MutableStateFlow<List<List<Any>>>(emptyList())
    val utilisation: StateFlow<List<List<Any>>> = _utilisation.asStateFlow()

    init {
        viewModelScope.launch {
            _sales.value = repo.getSales()
            _chart.value = repo.getRevenueChart()
            _peaks.value = repo.getPeakHours()
            _utilisation.value = repo.getQuadUtilisation()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyticsScreen(nav: NavController, vm: AnalyticsViewModel = hiltViewModel()) {
    val sales by vm.sales.collectAsState()
    val chart by vm.chart.collectAsState()
    val peaks by vm.peaks.collectAsState()
    val utilisation by vm.utilisation.collectAsState()
    val maxRev = chart.maxOfOrNull { it.second } ?: 1

    Scaffold(topBar = { TopAppBar(title = { Text("Analytics") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {

            // KPI cards
            sales?.let { s ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KpiCard("Today", "KES ${s.today}", Modifier.weight(1f))
                    KpiCard("This Week", "KES ${s.thisWeek}", Modifier.weight(1f))
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KpiCard("This Month", "KES ${s.thisMonth}", Modifier.weight(1f))
                    KpiCard("All Time", "KES ${s.total}", Modifier.weight(1f))
                }
                if (s.overtimeRevenue > 0) KpiCard("Overtime Revenue", "KES ${s.overtimeRevenue}", Modifier.fillMaxWidth())
            }

            // Revenue chart (7 days)
            if (chart.isNotEmpty()) {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Revenue — Last 7 Days", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(12.dp))
                        chart.forEach { (date, rev, rides) ->
                            Column(Modifier.padding(vertical = 4.dp)) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(date, style = MaterialTheme.typography.labelSmall)
                                    Text("KES $rev · $rides rides", style = MaterialTheme.typography.labelSmall)
                                }
                                Spacer(Modifier.height(2.dp))
                                LinearProgressIndicator(progress = { if (maxRev > 0) rev.toFloat() / maxRev else 0f }, modifier = Modifier.fillMaxWidth().height(6.dp))
                            }
                        }
                    }
                }
            }

            // Quad utilisation
            if (utilisation.isNotEmpty()) {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Quad Utilisation", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        utilisation.forEach { row ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(row[0].toString(), fontWeight = FontWeight.Medium)
                                Text("${row[1]} rides · KES ${row[2]}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            HorizontalDivider()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}
