package com.kuyubu.openall;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.Gravity;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

public class MainActivity extends Activity {
    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private final AtomicInteger utteranceIds = new AtomicInteger();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(15, 118, 110));
        getWindow().setNavigationBarColor(Color.BLACK);
        buildLayout();
        initTts();
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private void buildLayout() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(246, 247, 244));

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(10), dp(8), dp(10), dp(8));
        bar.setBackgroundColor(Color.rgb(15, 118, 110));

        TextView title = new TextView(this);
        title.setText("环球旅行指南");
        title.setTextColor(Color.WHITE);
        title.setTextSize(18);
        title.setTypeface(null, 1);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, -2, 1);
        bar.addView(title, titleParams);
        bar.addView(navButton("目的地", "#/"));
        bar.addView(navButton("出行指南", "#/tips"));
        root.addView(bar, new LinearLayout.LayoutParams(-1, -2));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(246, 247, 244));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ex) {
                    Toast.makeText(MainActivity.this, "没有可打开此链接的应用", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });
        webView.addJavascriptInterface(new NativeTtsBridge(), "AndroidTTS");
        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));

        TextView footer = new TextView(this);
        footer.setText("离线内容已内置 · 语音使用设备系统引擎");
        footer.setTextColor(Color.rgb(90, 103, 97));
        footer.setTextSize(11);
        footer.setGravity(Gravity.CENTER);
        footer.setPadding(dp(8), dp(5), dp(8), dp(5));
        root.addView(footer, new LinearLayout.LayoutParams(-1, -2));
        setContentView(root);
    }

    private Button navButton(String label, String hash) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(12);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setPadding(dp(5), 0, dp(5), 0);
        button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(13, 96, 91)));
        button.setOnClickListener(v -> webView.evaluateJavascript(
                "location.hash='" + hash + "'", null));
        return button;
    }

    private void initTts() {
        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { }
                    @Override public void onDone(String id) { notifyJsDone(); }
                    @Override public void onError(String id) { notifyJsDone(); }
                });
            }
        });
    }

    private void notifyJsDone() {
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(
                    "if(window.onNativeTtsDone){window.onNativeTtsDone();}", null);
        });
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    public class NativeTtsBridge {
        @JavascriptInterface
        public void speak(String text, String language, float rate) {
            runOnUiThread(() -> {
                if (!ttsReady || tts == null) {
                    Toast.makeText(MainActivity.this, "系统语音引擎尚未准备好", Toast.LENGTH_SHORT).show();
                    notifyJsDone();
                    return;
                }
                try {
                    Locale locale = Locale.forLanguageTag(language == null ? "zh-CN" : language);
                    int result = tts.setLanguage(locale);
                    tts.setSpeechRate(Math.max(0.5f, Math.min(2.0f, rate)));
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Toast.makeText(MainActivity.this, "设备未安装对应语言语音包", Toast.LENGTH_SHORT).show();
                    }
                    String id = "travel-" + utteranceIds.incrementAndGet();
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
                } catch (Exception ex) {
                    notifyJsDone();
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> { if (tts != null) tts.stop(); });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else if (webView != null && webView.getUrl() != null && !webView.getUrl().endsWith("index.html")) {
            webView.evaluateJavascript("location.hash='#/'", null);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (webView != null) { webView.removeJavascriptInterface("AndroidTTS"); webView.destroy(); }
        super.onDestroy();
    }
}