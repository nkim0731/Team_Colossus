package com.example.frontend;

import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.preference.PreferenceFragmentCompat;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.MaterialAutoCompleteTextView;
import com.google.android.material.textfield.TextInputLayout;

public class PreferenceActivity extends AppCompatActivity {
    private final String TAG = "PreferenceActivity";
    private Bundle userData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        userData = getIntent().getExtras();

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

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }



}
