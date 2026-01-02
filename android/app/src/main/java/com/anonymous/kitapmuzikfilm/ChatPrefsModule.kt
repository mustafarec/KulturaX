package com.anonymous.kitapmuzikfilm

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Native module to manage chat preferences from React Native
 * Used to suppress notifications when user is in active chat
 */
class ChatPrefsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PREFS_NAME = "ChatPrefs"
        private const val KEY_ACTIVE_CHAT_USER_ID = "activeChatUserId"
    }

    override fun getName(): String = "ChatPrefs"

    @ReactMethod
    fun setActiveChatUserId(userId: String?) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
        if (userId.isNullOrEmpty()) {
            editor.remove(KEY_ACTIVE_CHAT_USER_ID)
        } else {
            editor.putString(KEY_ACTIVE_CHAT_USER_ID, userId)
        }
        
        editor.apply()
    }

    @ReactMethod
    fun clearActiveChatUserId() {
        setActiveChatUserId(null)
    }

    @ReactMethod
    fun clearAllNotifications() {
        val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.cancelAll()
    }
}
