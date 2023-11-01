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
    private String preferTransit;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


        getSupportFragmentManager()
                .beginTransaction()
                .replace(android.R.id.content, new SettingsFragment())
                .commit();

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
        }

//        TextInputLayout textInputLayout = findViewById(R.id.inputLayout);
//        MaterialAutoCompleteTextView autoCompleteTextView = findViewById(R.id.inputTV);
//        MaterialButton button = findViewById(R.id.btn);
//
//        button.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                if(autoCompleteTextView.getText().toString().isEmpty()){
//                    textInputLayout.setError("Please select an option");
//                }else{
//                    preferTransit = autoCompleteTextView.getText().toString();
//                    Toast.makeText(PreferenceActivity.this, preferTransit, Toast.LENGTH_SHORT).show();
////                    Log.d("", preferTransit);
//
//                    // send preferTransit to db.
//                }
//            }
//        });



    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }



}
