package com.example.frontend;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class AfterSuccessLoginActivity extends AppCompatActivity  {
    private final String TAG = "AfterSuccessLoginActivity";
    private Button calendarButton;
    private Button groupChatButton;
    private Button settingButton;

    private Bundle userData;

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_after_successful_login);

        // get userdata from login
        userData = getIntent().getExtras();
        // access data with String value1 = receivedData.getString("key1");

        // calendar
        calendarButton = findViewById(R.id.button_calendar);
        calendarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
//                setContentView(R.layout.activity_calendar);
                Intent calendarIntent = new Intent(AfterSuccessLoginActivity.this, CalendarActivity.class);
                calendarIntent.putExtras(userData);
                startActivity(calendarIntent);
            }
        });

        // groupchat
//        groupChatButton = findViewById(R.id.button_groupChat);
//        groupChatButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//            }
//        });

        // settings == preference setting
        settingButton = findViewById(R.id.button_setting);
        settingButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                setContentView(R.layout.activity_preference);
                // move to setting page, set preference
                Intent settingIntent = new Intent(AfterSuccessLoginActivity.this, PreferenceActivity.class);
                startActivity(settingIntent);
            }
        });
    }
}
