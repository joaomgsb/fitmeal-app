package br.com.fitmeal.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Configura a window ANTES do super.onCreate
        Window window = getWindow();

        // Flag essencial para desenhar o background da status bar
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        WindowCompat.setDecorFitsSystemWindows(window, true);

        super.onCreate(savedInstanceState);

        registerPlugin(GooglePlayBilling.class);

        // Aplica imediatamente
        applySystemBars();

        // Aplica novamente com delay para dispositivos problemáticos (Samsung, Xiaomi, etc)
        mainHandler.postDelayed(this::applySystemBars, 100);
        mainHandler.postDelayed(this::applySystemBars, 500);
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBars();
        // Delay extra para quando volta de outra app
        mainHandler.postDelayed(this::applySystemBars, 150);
    }

    @Override
    protected void onPostResume() {
        super.onPostResume();
        applySystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applySystemBars();
            // Delay adicional para garantir que o sistema aplicou as mudanças
            mainHandler.postDelayed(this::applySystemBars, 100);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applySystemBars();
    }

    private void applySystemBars() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        // Garante que as flags corretas estão definidas
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Define a cor da status bar como branca
        window.setStatusBarColor(Color.WHITE);

        // Define a cor da navigation bar como branca
        window.setNavigationBarColor(Color.WHITE);

        // Reseta as flags de UI do decorView
        int uiFlags = View.SYSTEM_UI_FLAG_VISIBLE | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;

        // Para API 23+ (Android 6.0+), adiciona flag para ícones escuros
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            uiFlags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }

        // Para API 26+ (Android 8.0+), adiciona flag para navigation bar clara
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            uiFlags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }

        decorView.setSystemUiVisibility(uiFlags);

        // Usa WindowInsetsControllerCompat para garantir compatibilidade
        try {
            WindowInsetsControllerCompat controller =
                    new WindowInsetsControllerCompat(window, decorView);

            // Mostra as barras do sistema
            controller.show(WindowInsetsCompat.Type.systemBars());

            // Ícones escuros na status bar (para fundo claro)
            controller.setAppearanceLightStatusBars(true);

            // Ícones escuros na navigation bar (para fundo claro)
            controller.setAppearanceLightNavigationBars(true);

            // Comportamento padrão
            controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH
            );
        } catch (Exception e) {
            // Fallback silencioso para dispositivos problemáticos
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Remove callbacks pendentes para evitar memory leaks
        mainHandler.removeCallbacksAndMessages(null);
    }
}