package com.example.frontend;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

public class AfterSuccessLoginActivity extends AppCompatActivity  {
    private final String TAG = "MainMenuActivity";
    private Button calendarButton;
    private Button settingButton;
    private Bundle userData;
    private HttpsRequest httpsRequest;

    private final String server_url = ServerConfig.SERVER_URL;

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_after_successful_login);

        // get userdata from login
        userData = getIntent().getExtras();
        httpsRequest = new HttpsRequest();

        // calendar
        calendarButton = findViewById(R.id.button_calendar);
        calendarButton.setOnClickListener(view -> {
            //            checkPermission();
            Intent calendarIntent = new Intent(AfterSuccessLoginActivity.this, CalendarActivity.class);

            // userData contains, Id, Email, IdToken, RefreshToken
            String user_id = userData.getString("userId");
            String user_id_token = userData.getString("userIdToken");
            String user_email = userData.getString("userEmail");
            String user_refresh_token = userData.getString("userRefreshToken");



            //Go to calendar after importing the calendar data
            calendarIntent.putExtras(userData);
            startActivity(calendarIntent);


//            // send necessary data to backend for database
//            JSONObject tokenHeader = new JSONObject();
//            try {
//                tokenHeader.put("id_token", user_id_token);
//                tokenHeader.put("refresh_token", user_refresh_token);
//            } catch (JSONException e){
//                Log.e(TAG, "unexpected JSON exception", e);
//            }
//
//            httpsRequest.get(server_url + "/auth/google/token?useremail=" + user_email, tokenHeader, new HttpsCallback() {
//                @Override
//                public void onResponse(String response) {
//                    try {
//                        JSONObject responseObj = new JSONObject(response);
//                        String eventsForAWeek = responseObj.getString("events");
//                        Log.i(TAG,"eventsForAWeek : " + eventsForAWeek);
//
//                        userData.putString("events", eventsForAWeek); // put json string into data bundle
//
//                        //Go to calendar after importing the calendar data
//                        calendarIntent.putExtras(userData);
//                        startActivity(calendarIntent);
//                    } catch (JSONException e) {
//                        Log.e(TAG, "JSON Exception while parsing response from google token calendar import");
//                    }
//                }
//                @Override
//                public void onFailure(String error) {
//                    Log.e(TAG, "google token calendar import : " + error);
//                }
//            });

        });

        // settings == preference setting
        settingButton = findViewById(R.id.button_setting);
        settingButton.setOnClickListener(view -> {
            // move to setting page, set preference
            Intent settingIntent = new Intent(AfterSuccessLoginActivity.this, PreferenceActivity.class);
            // get users set preferences first
            //httpsRequest.get(server_url + "/api/preferences?user=" + userData.getString("userEmail"), null, new HttpsCallback() {
            httpsRequest.get(server_url + "/api/preferences?user=" + userData.getString("userEmail"), null, new HttpsCallback() {

                @Override
                public void onResponse(String response) {
                    Log.d(TAG, response);
                    userData.putString("preferences", response); // put json string into data bundle
                    settingIntent.putExtras(userData);
                    startActivity(settingIntent);
                }
                @Override
                public void onFailure(String error) {
                    Log.e(TAG, "Network error: Server probably closed");
                }
            });
        });

//        Button alarmButton = findViewById(R.id.button_alarm);
//        alarmButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
//                Intent intent = new Intent(AfterSuccessLoginActivity.this, AlarmReceiver.class);
//                PendingIntent pendingIntent = PendingIntent.getBroadcast(AfterSuccessLoginActivity.this, 0, intent, 0);
//                long triggerTime = System.currentTimeMillis() + (30 * 1000);
//
//                // Set the alarm to start at a specific time.
//                Calendar calendar = Calendar.getInstance();
//                calendar.setTimeInMillis(System.currentTimeMillis());
//                calendar.set(Calendar.HOUR_OF_DAY, 14);
//                calendar.set(Calendar.MINUTE, 30);
//
//                //calendar.getTimeInMillis()
//                alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, triggerTime,
//                        1000 * 60 * 60 * 24, pendingIntent);
//
//                Log.d("Alarm", "Alarm set");
//            }
//        });




    }


    private void checkPermission(){
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED) {

            Intent serviceIntent = new Intent(this, ActivityRecognitionService.class);
            ContextCompat.startForegroundService(this, serviceIntent);
            Log.d("Alarm", "permission allowed");
        }else{
            Log.d("Alarm", "no permission");
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACTIVITY_RECOGNITION}, 1);

        }
    }
}
