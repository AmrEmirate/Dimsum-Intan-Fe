package cloud.vimtk.dimsumintan;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends AppCompatActivity {

    private static final String TARGET_URL = "https://dimsumintan.vaxel.my.id/";
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean isKioskLocked = false;

    private final ActivityResultLauncher<Intent> fileChooserLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (filePathCallback == null) return;
                Uri[] results = null;
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    } else if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Pastikan status bar & poni (display cutout) aman dan tidak menutupi UI web
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.parseColor("#2B1E16"));
        getWindow().setNavigationBarColor(Color.parseColor("#FDFBF7"));
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(true);
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#FDFBF7"));
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);

        // Terapkan safe-area inset untuk poni / gesture bar / keyboard IME
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
                            | WindowInsetsCompat.Type.ime()
            );
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        configureWebView();
        if (!handleDeepLinkIntent(getIntent())) {
            webView.loadUrl(TARGET_URL);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (isKioskLocked) {
                    // Blokir tombol Back saat Mode Kunci Kasir (Kiosk) aktif
                    return;
                }
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    private class KioskBridge {
        @JavascriptInterface
        public void setKioskLock(boolean locked) {
            isKioskLocked = locked;
            runOnUiThread(() -> {
                WindowInsetsControllerCompat insetsController =
                        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                if (locked) {
                    try {
                        startLockTask();
                    } catch (Exception ignored) {
                    }
                    if (insetsController != null) {
                        insetsController.setSystemBarsBehavior(
                                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                        );
                        insetsController.hide(WindowInsetsCompat.Type.systemBars());
                    }
                } else {
                    try {
                        stopLockTask();
                    } catch (Exception ignored) {
                    }
                    if (insetsController != null) {
                        insetsController.show(WindowInsetsCompat.Type.systemBars());
                    }
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        // Hapus token "; wv" agar Google OAuth tidak diblokir sebagai embedded webview,
        // sambil menambahkan penanda DimsumIntanAPK agar FE bisa mendeteksi mode APK.
        String defaultUa = settings.getUserAgentString();
        String cleanUa = defaultUa.replace("; wv)", ")").replace("wv ", "") + " DimsumIntanAPK/1.0";
        settings.setUserAgentString(cleanUa);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.addJavascriptInterface(new KioskBridge(), "DimsumIntanNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
                String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
                String path = uri.getPath() != null ? uri.getPath() : "";

                // Buka Login Google lewat Chrome Custom Tabs agar otomatis memakai akun Google di HP
                if (("http".equals(scheme) || "https".equals(scheme))
                        && (path.contains("/auth/google/start") || host.endsWith("accounts.google.com"))) {
                    Uri launchUri = uri.buildUpon()
                            .clearQuery()
                            .appendQueryParameter("redirect_origin", "dimsumintan://auth")
                            .build();
                    if (host.endsWith("accounts.google.com")) {
                        launchUri = uri;
                    }
                    try {
                        CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                                .setShowTitle(true)
                                .build();
                        customTabsIntent.launchUrl(MainActivity.this, launchUri);
                    } catch (Exception e) {
                        try {
                            startActivity(new Intent(Intent.ACTION_VIEW, launchUri));
                        } catch (Exception ignored) {
                        }
                    }
                    return true;
                }

                if ("http".equals(scheme) || "https".equals(scheme)) {
                    if (isAllowedHost(host, "vaxel.my.id")
                            || isAllowedHost(host, "google.com")
                            || isAllowedHost(host, "gstatic.com")
                            || isAllowedHost(host, "googleusercontent.com")) {
                        return false;
                    }
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    String offlineHtml = "<!doctype html><html lang='id'><head><meta charset='utf-8'>"
                            + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                            + "<style>body{font-family:sans-serif;background:#FDFBF7;color:#2B1E16;"
                            + "display:flex;align-items:center;justify-content:center;min-height:100vh;"
                            + "margin:0;padding:24px;text-align:center}.card{background:#fff;border-radius:16px;"
                            + "padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);max-width:340px}"
                            + "button{margin-top:16px;background:#2B1E16;color:#fff;border:none;"
                            + "padding:12px 24px;border-radius:10px;font-weight:700;font-size:15px}</style>"
                            + "</head><body><div class='card'><h3>Koneksi Terputus</h3>"
                            + "<p>Pastikan internet HP aktif untuk mengakses Dimsum Intan POS.</p>"
                            + "<button onclick=\"location.href='" + TARGET_URL + "'\">Coba Lagi</button>"
                            + "</div></body></html>";
                    view.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    fileChooserLauncher.launch(intent);
                    return true;
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent);
    }

    private boolean isAllowedHost(String host, String domain) {
        return host != null && (host.equals(domain) || host.endsWith("." + domain));
    }

    private boolean handleDeepLinkIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return false;
        Uri data = intent.getData();
        if ("dimsumintan".equalsIgnoreCase(data.getScheme()) && "auth".equalsIgnoreCase(data.getHost())) {
            String query = data.getEncodedQuery();
            if (query != null && !query.isEmpty() && webView != null) {
                webView.loadUrl(TARGET_URL + "?" + query);
                return true;
            }
        }
        return false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }
}
