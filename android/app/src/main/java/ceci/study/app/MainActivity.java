package ceci.study.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registra o plugin local antes do bridge carregar (SPEC-012 F8.5).
        registerPlugin(ShareTargetPlugin.class);
        super.onCreate(savedInstanceState);
        ShareTargetPlugin.handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ShareTargetPlugin.handleIntent(intent);
    }
}
