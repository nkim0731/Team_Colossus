package com.example.frontend;

import android.os.Bundle;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;


/*
 * Number of methods: 2
 * */
public class PreferenceActivity extends AppCompatActivity {
//    private final String TAG = "PreferenceActivity";
//    private Bundle userData;

    /*
     * ChatGPT usage: Partial
     * */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Bundle userData = getIntent().getExtras();

        SettingsFragment settingsFragment = new SettingsFragment();
        settingsFragment.setArguments(userData);

        getSupportFragmentManager()
                .beginTransaction()
                .replace(android.R.id.content, settingsFragment)
                .commit();

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
        }
    }

    /*
     * ChatGPT usage: Yes
     * */
    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }



}
