package com.example.frontend;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;

public class CreateNewEvent extends AppCompatActivity {
    EditText et_eName;
    EditText et_location;
    EditText et_sTime;
    EditText et_eTime;
    Button submit;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.test_create_event);

        submit = findViewById(R.id.button_submit);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                et_eName = findViewById(R.id.et_eName);
                et_location = findViewById(R.id.et_location);
                et_sTime = findViewById(R.id.et_sTime);
                et_eTime = findViewById(R.id.et_eTime);

                // TODO https connection : send the info to create a new event


                Intent eventIntent = new Intent(CreateNewEvent.this, CalendarActivity.class);
                startActivity(eventIntent);
            }
        });
    }
}
