package ceci.study.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin local da captura de link por compartilhamento (SPEC-012 §8.8, F8.5).
 *
 * O Android entrega o `ACTION_SEND` em `MainActivity.onCreate` (partida a frio)
 * ou `onNewIntent` (app já aberto). O `MainActivity` chama `handleIntent`, que:
 * - com o bridge já carregado, emite `shareReceived` (o JS abre a sheet);
 * - antes disso, guarda o texto em `pendingText` para o `getPendingShare`.
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    private static ShareTargetPlugin instance;
    private static String pendingText;

    @Override
    public void load() {
        instance = this;
    }

    static void handleIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return;
        }
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) {
            return;
        }
        if (instance != null) {
            JSObject payload = new JSObject();
            payload.put("text", text);
            // retained: se o JS ainda não assinou, o evento fica na fila.
            instance.notifyListeners("shareReceived", payload, true);
        } else {
            pendingText = text;
        }
    }

    @PluginMethod
    public void getPendingShare(PluginCall call) {
        JSObject ret = new JSObject();
        if (pendingText != null) {
            ret.put("text", pendingText);
            pendingText = null;
        }
        call.resolve(ret);
    }
}
