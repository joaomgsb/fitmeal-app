package br.com.fitmeal.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsetsController;
import android.graphics.Color;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GooglePlayBilling.class);
        super.onCreate(savedInstanceState);
        
        // Configurar status bar para não sobrepor o conteúdo
        // O sistema irá gerenciar automaticamente o espaço da status bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Não usar setDecorFitsSystemWindows(false) para evitar sobreposição
            // Deixar o sistema gerenciar o espaço da status bar automaticamente
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Configurar aparência da status bar (texto claro)
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );
            }
            // Garantir que a status bar seja transparente mas o conteúdo não fique por trás
            getWindow().setStatusBarColor(Color.TRANSPARENT);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Para versões anteriores ao Android 11
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            // Usar apenas LAYOUT_STABLE sem LAYOUT_FULLSCREEN para evitar sobreposição
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }
}

