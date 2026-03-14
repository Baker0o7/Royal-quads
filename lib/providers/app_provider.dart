import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/app_themes.dart';

class AppProvider extends ChangeNotifier {
  List<Quad>     _quads     = [];
  List<Booking>  _active    = [];
  List<Booking>  _history   = [];
  AppUser?       _user;
  bool           _loading    = false;
  ThemeMode      _themeMode  = ThemeMode.dark;
  AppTheme       _appTheme   = AppTheme.desertGold;

  List<Quad>    get quads     => _quads;
  List<Booking> get active    => _active;
  List<Booking> get history   => _history;
  AppUser?      get user      => _user;
  bool          get loading   => _loading;
  ThemeMode     get themeMode => _themeMode;
  AppTheme      get appTheme  => _appTheme;

  void _set(VoidCallback fn) { fn(); notifyListeners(); }

  void initTheme() {
    final saved = StorageService.getThemeName();
    // saved format: 'dark:desertGold' or legacy 'dark'/'light'
    if (saved.contains(':')) {
      final parts = saved.split(':');
      _themeMode = parts[0] == 'light' ? ThemeMode.light : ThemeMode.dark;
      _appTheme  = AppThemeX.fromId(parts[1]);
    } else {
      _themeMode = saved == 'light' ? ThemeMode.light : ThemeMode.dark;
      _appTheme  = AppTheme.desertGold;
    }
    notifyListeners();
  }

  void setTheme(AppTheme theme) {
    _appTheme = theme;
    _saveTheme();
    notifyListeners();
  }

  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.dark
        ? ThemeMode.light : ThemeMode.dark;
    _saveTheme();
    notifyListeners();
  }

  void _saveTheme() {
    final mode = _themeMode == ThemeMode.light ? 'light' : 'dark';
    StorageService.setThemeName('$mode:${_appTheme.id}');
  }

  Future<void> loadAll() async {
    _set(() => _loading = true);
    _quads   = StorageService.getQuads();
    _active  = StorageService.getActive();
    _history = StorageService.getHistory();
    _set(() => _loading = false);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  void setUser(AppUser? u) => _set(() => _user = u);

  Future<void> signIn(String phone, String password) async {
    final u = await StorageService.loginUser(phone, password);
    setUser(u);
  }

  Future<void> register(String name, String phone, String password) async {
    final u = await StorageService.registerUser(name, phone, password);
    setUser(u);
  }

  void signOut() => _set(() => _user = null);

  // ── Quads ─────────────────────────────────────────────────────────────────
  Future<void> refreshQuads() async {
    _set(() => _quads = StorageService.getQuads());
  }

  Future<Quad> addQuad(String name, {String? imei}) async {
    final q = await StorageService.addQuad(name, imei: imei);
    await refreshQuads();
    return q;
  }

  Future<void> updateQuad(int id, {String? name, String? status, String? imei}) async {
    await StorageService.updateQuad(id, name: name, status: status, imei: imei);
    await refreshQuads();
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  Future<Booking> createBooking({
    required int quadId, required String customerName,
    required String customerPhone, required int duration, required int price,
    int? originalPrice, String? promoCode, int groupSize = 1,
    int depositAmount = 0, String? mpesaRef, bool waiverSigned = false,
  }) async {
    final booking = await StorageService.createBooking(
      quadId: quadId, userId: _user?.id,
      customerName: customerName, customerPhone: customerPhone,
      duration: duration, price: price, originalPrice: originalPrice,
      promoCode: promoCode, groupSize: groupSize,
      depositAmount: depositAmount, mpesaRef: mpesaRef,
      waiverSigned: waiverSigned,
    );
    await loadAll();
    return booking;
  }

  Future<void> completeBooking(int id, int overtimeMins) async {
    await StorageService.completeBooking(id, overtimeMins);
    await loadAll();
  }

  Future<void> submitFeedback(int id, int rating, String feedback) async {
    await StorageService.submitFeedback(id, rating, feedback);
    await loadAll();
  }

  // ── Promos ────────────────────────────────────────────────────────────────
  int? applyPromo(String code, int price) => StorageService.applyPromo(code, price);

  List<Booking> getUserHistory() =>
      _history.where((b) => _user != null && b.userId == _user!.id).toList();
}
