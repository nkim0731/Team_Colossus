package com.example.frontend;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.MaterialAutoCompleteTextView;
import com.google.android.material.textfield.TextInputLayout;

public class PreferenceActivity extends AppCompatActivity {
    private final String TAG = "PreferenceActivity";
    private String preferTransit;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_preference);

        TextInputLayout textInputLayout = findViewById(R.id.inputLayout);
        MaterialAutoCompleteTextView autoCompleteTextView = findViewById(R.id.inputTV);
        MaterialButton button = findViewById(R.id.btn);

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(autoCompleteTextView.getText().toString().isEmpty()){
                    textInputLayout.setError("Please select an option");
                }else{
                    preferTransit = autoCompleteTextView.getText().toString();
                    Toast.makeText(PreferenceActivity.this, preferTransit, Toast.LENGTH_SHORT).show();
//                    Log.d("", preferTransit);

                    // send preferTransit to db.
                }
            }
        });
    }
}
