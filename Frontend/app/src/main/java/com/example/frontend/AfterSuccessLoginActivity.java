package com.example.frontend;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Calendar;

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

                // move to setting page, set preference
                Intent settingIntent = new Intent(AfterSuccessLoginActivity.this, PreferenceActivity.class);
                startActivity(settingIntent);
            }
        });

        Button alarmButton = findViewById(R.id.button_alarm);
        alarmButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                Intent intent = new Intent(AfterSuccessLoginActivity.this, AlarmReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(AfterSuccessLoginActivity.this, 0, intent, 0);
                long triggerTime = System.currentTimeMillis() + (30 * 1000); 

                // Set the alarm to start at a specific time.
                Calendar calendar = Calendar.getInstance();
                calendar.setTimeInMillis(System.currentTimeMillis());
                calendar.set(Calendar.HOUR_OF_DAY, 14); 
                calendar.set(Calendar.MINUTE, 30);

                //calendar.getTimeInMillis()
                alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, triggerTime,
                        1000 * 60 * 60 * 24, pendingIntent);

                Log.d("Alarm", "Alarm set");


            }
        });
    }
}
