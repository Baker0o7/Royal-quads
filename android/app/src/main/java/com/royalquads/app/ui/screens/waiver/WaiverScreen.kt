package com.royalquads.app.ui.screens.waiver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.royalquads.app.data.repository.RoyalQuadRepository
import com.royalquads.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WaiverViewModel @Inject constructor(private val repo: RoyalQuadRepository) : ViewModel() {
    fun sign(bookingId: Int, onDone: () -> Unit) {
        viewModelScope.launch { repo.signWaiver(bookingId); onDone() }
    }
}

val WAIVER_CLAUSES = listOf(
    "1. INHERENT RISKS — I acknowledge quad biking involves inherent risks including physical injury or death.",
    "2. HEALTH CONFIRMATION — I confirm I am in good physical health and have no medical conditions that would prevent safe participation.",
    "3. EQUIPMENT — I agree to wear all provided safety equipment including helmet at all times during the ride.",
    "4. ALCOHOL POLICY — I confirm I have not consumed alcohol or any substances that impair my judgement or reaction time.",
    "5. FINANCIAL LIABILITY — I accept full financial responsibility for any damage caused to the quad through negligent operation.",
    "6. RELEASE & INDEMNITY — I release Royal Quads Mambrui and its staff from liability for any injury, loss or damage arising from participation.",
    "7. MINORS — If I am signing on behalf of a minor, I confirm I am their legal guardian and accept all terms on their behalf.",
    "8. PHOTOGRAPHY — I consent to photos and videos being taken during the ride for promotional use.",
    "9. RULES — I agree to follow all instructions given by Royal Quads staff and to stay within the designated riding area at all times.",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WaiverScreen(nav: NavController, bookingId: Int, vm: WaiverViewModel = hiltViewModel()) {
    val scroll = rememberScrollState()
    val scrolled by remember { derivedStateOf { scroll.value >= scroll.maxValue - 50 } }
    var accepted by remember { mutableStateOf(false) }

    Scaffold(topBar = { TopAppBar(title = { Text("Safety Waiver") }, navigationIcon = {
        IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Back") }
    }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            Column(Modifier.weight(1f).verticalScroll(scroll).padding(16.dp)) {
                Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                    Row(Modifier.padding(12.dp)) {
                        Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.width(8.dp))
                        Text("Read all 9 clauses carefully before signing.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
                Spacer(Modifier.height(16.dp))
                WAIVER_CLAUSES.forEach { clause ->
                    Card(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                        Text(clause, Modifier.padding(12.dp), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            Column(Modifier.padding(16.dp)) {
                if (!scrolled) Text("⬇ Scroll to read all clauses", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Checkbox(checked = accepted, onCheckedChange = { if (scrolled) accepted = it }, enabled = scrolled)
                    Text("I have read and agree to all terms above")
                }
                Spacer(Modifier.height(8.dp))
                Button(onClick = { vm.sign(bookingId) { nav.navigate(Screen.Home.route) { popUpTo(0) } } },
                    modifier = Modifier.fillMaxWidth(), enabled = accepted && scrolled) {
                    Icon(Icons.Default.VerifiedUser, null); Spacer(Modifier.width(8.dp)); Text("Sign Waiver")
                }
            }
        }
    }
}
