import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class WaiverScreen extends StatefulWidget {
  final int bookingId;
  const WaiverScreen({super.key, required this.bookingId});
  @override State<WaiverScreen> createState() => _WaiverScreenState();
}

class _WaiverScreenState extends State<WaiverScreen> {
  bool _agreed = false;
  bool _signed = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety Waiver', style: TextStyle(color: Colors.white)),
        backgroundColor: kHeroTo,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AppCard(
            color: kRed.withAlpha(8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [
                Icon(Icons.warning_amber_rounded, color: kRed, size: 22),
                SizedBox(width: 8),
                Text('SAFETY WAIVER & RELEASE', style: TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 16, color: kRed,
                    letterSpacing: 0.5)),
              ]),
              const Divider(color: kBorder, height: 24),
              ..._waiverClauses.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('•  ', style: TextStyle(color: kMuted, fontSize: 13)),
                  Expanded(child: Text(c, style: const TextStyle(fontSize: 13, height: 1.5))),
                ]),
              )),
            ]),
          ),

          const SizedBox(height: 20),

          AppCard(child: CheckboxListTile(
            value: _agreed,
            onChanged: (v) => setState(() => _agreed = v ?? false),
            title: const Text(
              'I have read and agree to all terms above. I accept full responsibility for my safety during the ride.',
              style: TextStyle(fontSize: 13, height: 1.5),
            ),
            activeColor: kAccent,
            controlAffinity: ListTileControlAffinity.leading,
          )),

          const SizedBox(height: 16),

          if (_agreed) ...[
            const SectionHeading('Draw Signature', icon: Icons.draw_rounded),
            AppCard(
              color: Colors.white,
              child: Column(children: [
                Container(
                  height: 160,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: kBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: kBorder, width: 1.5),
                  ),
                  child: const Center(child: Text(
                    '✍️\nSign here',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kMuted, fontSize: 14, height: 1.6),
                  )),
                ),
                const SizedBox(height: 12),
                PrimaryButton(
                  label: 'Confirm Signature & Sign Waiver',
                  icon: Icons.check_circle_rounded,
                  color: kGreen,
                  onTap: _agreed ? () async {
                    final bookings = StorageService.getBookings().map((b) =>
                      b.id == widget.bookingId ? b.copyWith(waiverSigned: true) : b
                    ).toList();
                    await StorageService.saveBookings(bookings);
                    setState(() => _signed = true);
                    if (mounted) {
                      showToast(context, 'Waiver signed successfully');
                      context.pop();
                    }
                  } : null,
                ),
              ]),
            ),
          ],

          const SizedBox(height: 40),
        ]),
      ),
    );
  }
}

const _waiverClauses = [
  'I voluntarily participate in quad biking activities at Royal Quad Bikes, Mambrui.',
  'I acknowledge that quad biking involves inherent risks including but not limited to falls, collisions, and physical injury.',
  'I confirm that I am in good physical health and have no medical conditions that would prevent safe participation.',
  'I agree to wear all provided safety equipment including helmet and protective gear at all times during the ride.',
  'I will follow all instructions given by Royal Quad Bikes staff and operate the vehicle responsibly.',
  'I will not operate the vehicle under the influence of alcohol or any substances.',
  'I accept full financial responsibility for any damage caused to the vehicle through negligent or reckless operation.',
  'I release Royal Quad Bikes and its employees from any liability for injury or damage resulting from participation.',
  'Parents or guardians must sign on behalf of minors under 18 years of age.',
];
