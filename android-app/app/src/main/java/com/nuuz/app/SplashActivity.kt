package com.nuuz.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Navigate to MainActivity after a short delay
        lifecycleScope.launch {
            delay(2000) // 2 seconds splash screen
            startActivity(Intent(this@SplashActivity, MainActivity::class.java))
            finish()
        }
    }
}
